import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Upload, Image as ImageIcon, ChevronDown, Server } from 'lucide-react';
import { importAiImage } from '../api/aiApi';
import { downloadGeneratedBackend } from '../api/generatorApi';
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
import { getEntities, getRelationships, createEntity, renameEntity, deleteEntity, moveEntity, getEntityById } from '../api/diagramApi';
import { getAttributes, createAttribute, updateAttribute, deleteAttribute } from '../api/attributeApi';
import { createRelationship, updateRelationship, deleteRelationship, swapRelationshipDirection } from '../api/relationshipApi';
import { exportArchitect, importArchitect } from '../api/architectApi';
import EntityNode from '../components/EntityNode';
import Sidebar from '../components/Sidebar';
import AssociationEdge from '../components/AssociationEdge';
import AssociationMarkers from '../components/AssociationMarkers';
import RelationshipEditModal from '../components/RelationshipEditModal';
import AttributeEditModal from '../components/AttributeEditModal';
import AiChatPanel from '../components/AiChatPanel';
import type { AiCommandResult, AssociationType, DiagramAttribute, DiagramRelationship } from '../types/models';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [importingImage, setImportingImage] = useState(false);
  const [generatingBackend, setGeneratingBackend] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (importMenuRef.current && !importMenuRef.current.contains(e.target as HTMLElement)) {
        setImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const buildNode = useCallback((entity: { id: string; name: string; posX: number; posY: number }, attributes: DiagramAttribute[]): Node => ({
    id: entity.id,
    position: { x: entity.posX, y: entity.posY },
    type: 'entity',
    data: {
      label: entity.name,
      attributes,
      onAddAttribute: () => handleAddAttribute(entity.id),
      onRename: (newName: string) => handleRenameEntity(entity.id, newName),
      onDeleteEntity: () => handleDeleteEntity(entity.id),
      onEditAttribute: (attribute: DiagramAttribute) => setEditingAttribute(attribute),
      onDeleteAttribute: (attributeId: string) => handleDeleteAttribute(attributeId),
    },
  }), [handleAddAttribute, handleRenameEntity, handleDeleteEntity, handleDeleteAttribute]);

  const loadDiagram = useCallback(async () => {
    if (!projectId) return;
    const entities = await getEntities(projectId);
    const relationships = await getRelationships(projectId);

    const nodesWithAttrs = await Promise.all(entities.map(async (e) => {
      const attributes = await getAttributes(e.id);
      return buildNode(e, attributes);
    }));

    setNodes(nodesWithAttrs);
    setEdges(relationships.map(relationshipToEdge));
  }, [projectId, setNodes, setEdges, buildNode]);

  useEffect(() => { loadDiagram(); }, [loadDiagram]);

  // Aplica el resultado de un comando de IA (texto, voz o foto) sin recargar todo el diagrama:
  // solo refresca las tablas que realmente cambiaron, y las relaciones solo si hubo cambios en ellas.
  const applyAiResult = useCallback(async (result: AiCommandResult) => {
    if (result.deletedEntityIds.length > 0) {
      setNodes((nds: Node[]) => nds.filter(n => !result.deletedEntityIds.includes(n.id)));
    }

    for (const entityId of result.affectedEntityIds) {
      const entity = await getEntityById(entityId);
      const attributes = await getAttributes(entityId);
      const node = buildNode(entity, attributes);
      setNodes((nds: Node[]) => {
        const exists = nds.some(n => n.id === entity.id);
        return exists ? nds.map(n => n.id === entity.id ? node : n) : [...nds, node];
      });
    }

    if (result.relationshipsChanged && projectId) {
      const relationships = await getRelationships(projectId);
      setEdges(relationships.map(relationshipToEdge));
    }
  }, [projectId, setNodes, setEdges, buildNode]);

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

  const handleGenerateBackend = async () => {
    if (!projectId) return;
    setGeneratingBackend(true);
    try {
      await downloadGeneratedBackend(projectId);
    } catch {
      alert('No se pudo generar el backend. Revisá la consola del backend para ver el error.');
    } finally {
      setGeneratingBackend(false);
    }
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

  const handleImportImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!projectId || !file) return;
    if (!confirm('Se van a agregar las tablas y relaciones detectadas en la foto a este proyecto. ¿Continuar?')) {
      e.target.value = '';
      return;
    }
    setImportingImage(true);
    try {
      await importAiImage(projectId, file);
      await loadDiagram();
    } catch {
      alert('No pude leer el diagrama de la imagen. Probá con otra foto más nítida.');
    } finally {
      setImportingImage(false);
      e.target.value = '';
    }
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
            <button className="btn btn-primary" onClick={handleGenerateBackend} disabled={generatingBackend}>
              <Server size={14} /> {generatingBackend ? 'Generando...' : 'Generar backend'}
            </button>
            <button className="btn" onClick={handleExportArchitect}>
              <Download size={14} /> Exportar
            </button>
            <div className="import-menu" ref={importMenuRef}>
              <button className="btn" onClick={() => setImportMenuOpen(o => !o)} disabled={importingImage}>
                <Upload size={14} /> {importingImage ? 'Importando...' : 'Importar'} <ChevronDown size={14} />
              </button>
              {importMenuOpen && (
                <div className="import-menu-dropdown">
                  <button
                    className="import-menu-item"
                    onClick={() => { setImportMenuOpen(false); fileInputRef.current?.click(); }}
                  >
                    <Upload size={14} /> Desde Architect
                  </button>
                  <button
                    className="import-menu-item"
                    onClick={() => { setImportMenuOpen(false); imageInputRef.current?.click(); }}
                  >
                    <ImageIcon size={14} /> Desde foto
                  </button>
                </div>
              )}
            </div>
            <input
              type="file"
              accept=".architect,.xml"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              style={{ display: 'none' }}
              onChange={handleImportImageChange}
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
        {projectId && <AiChatPanel projectId={projectId} onResult={applyAiResult} />}
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