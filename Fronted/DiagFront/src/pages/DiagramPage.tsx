import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  addEdge,
} from '@xyflow/react';
import type { Node, Edge, NodeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getEntities, getRelationships, createEntity, renameEntity, deleteEntity, moveEntity } from '../api/diagramApi';
import { getAttributes, createAttribute, updateAttribute, deleteAttribute } from '../api/attributeApi';
import { createRelationship, updateRelationship, deleteRelationship, swapRelationshipDirection } from '../api/relationshipApi';
import { exportArchitect, importArchitect } from '../api/architectApi';
import EntityNode from '../components/EntityNode';
import Sidebar from '../components/Sidebar';
import AssociationEdge from '../components/AssociationEdge';
import AssociationMarkers from '../components/AssociationMarkers';
import RelationshipEditModal from '../components/RelationshipEditModal';
import AttributeEditModal from '../components/AttributeEditModal';
import type { AssociationType, DiagramAttribute, DiagramRelationship } from '../types/models';
import './DiagramPage.css';

const nodeTypes = { entity: EntityNode };
const edgeTypes = { association: AssociationEdge };

const DEFAULT_CARDINALITY: Record<AssociationType, { source: string; target: string; relType: DiagramRelationship['relationshipType'] }> = {
  ASSOCIATION: { source: '1', target: '*', relType: 'ONE_TO_MANY' },
  GENERALIZATION: { source: '1', target: '1', relType: 'ONE_TO_ONE' },
  AGGREGATION: { source: '1', target: '*', relType: 'ONE_TO_MANY' },
  COMPOSITION: { source: '1', target: '*', relType: 'ONE_TO_MANY' },
};

function relationshipToEdge(r: DiagramRelationship): Edge {
  return {
    id: r.id,
    source: r.sourceEntity.id,
    target: r.targetEntity.id,
    type: 'association',
    data: {
      associationType: r.associationType,
      sourceCardinality: r.sourceCardinality,
      targetCardinality: r.targetCardinality,
      verb: r.name,
    },
  };
}

export default function DiagramPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [activeAssociation, setActiveAssociation] = useState<AssociationType | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<DiagramRelationship | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<DiagramAttribute | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddAttribute = useCallback(async (entityId: string) => {
    const name = prompt('Nombre del atributo:');
    if (!name) return;
    const dataType = prompt('Tipo de dato (VARCHAR, TEXT, INTEGER, BOOLEAN, DATE, TIMESTAMP, DECIMAL, UUID):', 'VARCHAR');
    if (!dataType) return;
    await createAttribute(entityId, { name, dataType });
    loadDiagram();
  }, []);

  const handleRenameEntity = useCallback(async (entityId: string, newName: string) => {
    await renameEntity(entityId, newName);
    loadDiagram();
  }, []);

  const handleDeleteEntity = useCallback(async (entityId: string) => {
    await deleteEntity(entityId);
    loadDiagram();
  }, []);

  const handleDeleteAttribute = useCallback(async (attributeId: string) => {
    await deleteAttribute(attributeId);
    loadDiagram();
  }, []);

  const loadDiagram = useCallback(async () => {
    if (!projectId) return;
    const entities = await getEntities(projectId);
    const relationships = await getRelationships(projectId);

    const nodesWithAttrs = await Promise.all(entities.map(async (e) => {
      const attributes = await getAttributes(e.id);
      return {
        id: e.id,
        position: { x: e.posX, y: e.posY },
        type: 'entity',
        data: {
          label: e.name,
          attributes,
          onAddAttribute: () => handleAddAttribute(e.id),
          onRename: (newName: string) => handleRenameEntity(e.id, newName),
          onDeleteEntity: () => handleDeleteEntity(e.id),
          onEditAttribute: (attribute: DiagramAttribute) => setEditingAttribute(attribute),
          onDeleteAttribute: (attributeId: string) => handleDeleteAttribute(attributeId),
        },
      };
    }));

    setNodes(nodesWithAttrs);
    setEdges(relationships.map(relationshipToEdge));
  }, [projectId, setNodes, setEdges, handleAddAttribute, handleRenameEntity, handleDeleteEntity, handleDeleteAttribute]);

  useEffect(() => { loadDiagram(); }, [loadDiagram]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        moveEntity(change.id, Math.round(change.position.x), Math.round(change.position.y));
      }
    });
  }, [setNodes]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target || !projectId) return;
    const type = activeAssociation ?? 'ASSOCIATION';
    const defaults = DEFAULT_CARDINALITY[type];

    const relationship = await createRelationship(projectId, connection.source, connection.target, {
      relationshipType: defaults.relType,
      associationType: type,
      sourceCardinality: defaults.source,
      targetCardinality: defaults.target,
    });

    setEdges((eds: Edge[]) => addEdge(relationshipToEdge(relationship), eds));
  }, [setEdges, projectId, activeAssociation]);

  const onEdgeDoubleClick = useCallback((_: MouseEvent, edge: Edge) => {
    const data = edge.data as { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; verb?: string };
    setEditingRelationship({
      id: edge.id,
      name: data.verb,
      associationType: data.associationType,
      sourceCardinality: data.sourceCardinality,
      targetCardinality: data.targetCardinality,
      relationshipType: 'ONE_TO_MANY',
      sourceEntity: { id: edge.source } as never,
      targetEntity: { id: edge.target } as never,
    });
  }, []);

  const handleSaveRelationship = async (payload: { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; name: string; relationshipType: DiagramRelationship['relationshipType'] }) => {
    if (!editingRelationship) return;
    const updated = await updateRelationship(editingRelationship.id, payload);
    setEdges((eds: Edge[]) => eds.map(e => e.id === updated.id ? relationshipToEdge(updated) : e));
    setEditingRelationship(null);
  };

  const handleDeleteRelationship = async () => {
    if (!editingRelationship) return;
    await deleteRelationship(editingRelationship.id);
    setEdges((eds: Edge[]) => eds.filter(e => e.id !== editingRelationship.id));
    setEditingRelationship(null);
  };

  const handleSwapRelationship = async () => {
    if (!editingRelationship) return;
    const updated = await swapRelationshipDirection(editingRelationship.id);
    setEdges((eds: Edge[]) => eds.map(e => e.id === updated.id ? relationshipToEdge(updated) : e));
    setEditingRelationship(null);
  };

  const handleSaveAttribute = async (changes: Partial<DiagramAttribute>) => {
    if (!editingAttribute) return;
    await updateAttribute(editingAttribute.id, changes);
    setEditingAttribute(null);
    loadDiagram();
  };

  const handleDeleteAttributeFromModal = async () => {
    if (!editingAttribute) return;
    await handleDeleteAttribute(editingAttribute.id);
    setEditingAttribute(null);
  };

  const handleAddEntity = async () => {
    if (!projectId) return;
    const name = prompt('Nombre de la nueva tabla:');
    if (!name) return;
    await createEntity(projectId, name);
    loadDiagram();
  };

  const handleExportArchitect = async () => {
    if (!projectId) return;
    await exportArchitect(projectId);
  };

  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!confirm('Se van a agregar las tablas y relaciones del archivo a este proyecto. ¿Continuar?')) {
      e.target.value = '';
      return;
    }
    await importArchitect(projectId, file);
    e.target.value = '';
    loadDiagram();
  };

  return (
    <div className="diagram-layout">
      <AssociationMarkers />
      <Sidebar
        onAddEntity={handleAddEntity}
        activeAssociation={activeAssociation}
        onSelectAssociation={setActiveAssociation}
      />
      <div className="diagram-canvas">
        <div className="diagram-topbar">
          <span className="diagram-title">Diagramador ER</span>
          <div className="diagram-topbar-actions">
            <button className="btn" onClick={handleExportArchitect}>
              <Download size={14} /> Exportar a Architect
            </button>
            <button className="btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Importar de Architect
            </button>
            <input
              type="file"
              accept=".architect,.xml"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
            <Link to="/projects" className="btn">Volver a proyectos</Link>
          </div>
        </div>
        <div className="diagram-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {editingRelationship && (
        <RelationshipEditModal
          relationship={editingRelationship}
          onClose={() => setEditingRelationship(null)}
          onSave={handleSaveRelationship}
          onDelete={handleDeleteRelationship}
          onSwap={handleSwapRelationship}
        />
      )}

      {editingAttribute && (
        <AttributeEditModal
          attribute={editingAttribute}
          onClose={() => setEditingAttribute(null)}
          onSave={handleSaveAttribute}
          onDelete={handleDeleteAttributeFromModal}
        />
      )}
    </div>
  );
}