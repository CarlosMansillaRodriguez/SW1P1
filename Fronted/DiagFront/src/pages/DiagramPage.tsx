import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  addEdge,
} from '@xyflow/react';
import type { Node, Edge, NodeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getEntities, getRelationships, createEntity, moveEntity } from '../api/diagramApi';
import { getAttributes, createAttribute } from '../api/attributeApi';
import { createRelationship, updateRelationship } from '../api/relationshipApi';
import EntityNode from '../components/EntityNode';
import Sidebar from '../components/Sidebar';
import AssociationEdge from '../components/AssociationEdge';
import AssociationMarkers from '../components/AssociationMarkers';
import RelationshipEditModal from '../components/RelationshipEditModal';
import type { AssociationType, DiagramRelationship } from '../types/models';

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

  const handleAddAttribute = useCallback(async (entityId: string) => {
    const name = prompt('Nombre del atributo:');
    if (!name) return;
    const dataType = prompt('Tipo de dato (VARCHAR, INTEGER, BOOLEAN, DATE...):', 'VARCHAR');
    if (!dataType) return;
    await createAttribute(entityId, { name, dataType });
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
        data: { label: e.name, attributes, onAddAttribute: () => handleAddAttribute(e.id) },
      };
    }));

    setNodes(nodesWithAttrs);
    setEdges(relationships.map(relationshipToEdge));
  }, [projectId, setNodes, setEdges, handleAddAttribute]);

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

  const handleAddEntity = async () => {
    if (!projectId) return;
    const name = prompt('Nombre de la nueva tabla:');
    if (!name) return;
    await createEntity(projectId, name);
    loadDiagram();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <AssociationMarkers />
      <Sidebar
        onAddEntity={handleAddEntity}
        activeAssociation={activeAssociation}
        onSelectAssociation={setActiveAssociation}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {editingRelationship && (
        <RelationshipEditModal
          relationship={editingRelationship}
          onClose={() => setEditingRelationship(null)}
          onSave={handleSaveRelationship}
        />
      )}
    </div>
  );
}