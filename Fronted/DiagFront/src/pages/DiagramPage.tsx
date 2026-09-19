import { useCallback, useEffect, useState } from 'react';
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
import { createRelationship } from '../api/relationshipApi';
import EntityNode from '../components/EntityNode';

const nodeTypes = { entity: EntityNode };

export default function DiagramPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

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

    setEdges(relationships.map(r => ({
      id: r.id,
      source: r.sourceEntity.id,
      target: r.targetEntity.id,
      label: r.relationshipType,
    })));
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
    const relationship = await createRelationship(projectId, connection.source, connection.target, 'ONE_TO_MANY');
    setEdges((eds: Edge[]) => addEdge({ ...connection, id: relationship.id, label: relationship.relationshipType }, eds));
  }, [setEdges, projectId]);

  const handleAddEntity = async () => {
    if (!projectId) return;
    const name = prompt('Nombre de la nueva tabla:');
    if (!name) return;
    await createEntity(projectId, name);
    loadDiagram();
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <button onClick={handleAddEntity} style={{ position: 'absolute', zIndex: 10, margin: 10 }}>
        + Agregar tabla
      </button>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}