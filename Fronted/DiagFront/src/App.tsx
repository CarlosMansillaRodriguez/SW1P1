import { useCallback, useEffect, useState } from 'react';
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
import { getEntities, getRelationships, createEntity, moveEntity } from './api/diagramApi';
import { getAttributes, createAttribute } from './api/attributeApi';
import { createRelationship } from './api/relationshipApi';
import EntityNode from './components/EntityNode';

const PROJECT_ID = 'f5dc243c-3c65-4189-8b21-8baa2c7c3fe0';

const nodeTypes = { entity: EntityNode };

function App() {
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
    const entities = await getEntities(PROJECT_ID);
    const relationships = await getRelationships(PROJECT_ID);

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
  }, [setNodes, setEdges, handleAddAttribute]);

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
    if (!connection.source || !connection.target) return;
    const relationship = await createRelationship(PROJECT_ID, connection.source, connection.target, 'ONE_TO_MANY');
    setEdges((eds: Edge[]) => addEdge({ ...connection, id: relationship.id, label: relationship.relationshipType }, eds));
  }, [setEdges]);

  const handleAddEntity = async () => {
    const name = prompt('Nombre de la nueva tabla:');
    if (!name) return;
    await createEntity(PROJECT_ID, name);
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

export default App;