import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
} from '@xyflow/react';
import type { Node, Edge, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getEntities, getRelationships, createEntity, moveEntity } from './api/diagramApi';

// Reemplazá esto por un id real de proyecto que hayas creado por Postman
const PROJECT_ID = 'f5dc243c-3c65-4189-8b21-8baa2c7c3fe0';

function App() {
  const [nodes, setNodes, onNodesChangeDefault] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const loadDiagram = useCallback(async () => {
    const entities = await getEntities(PROJECT_ID);
    const relationships = await getRelationships(PROJECT_ID);

    setNodes(entities.map(e => ({
      id: e.id,
      position: { x: e.posX, y: e.posY },
      data: { label: e.name },
      type: 'default',
    })));

    setEdges(relationships.map(r => ({
      id: r.id,
      source: r.sourceEntity.id,
      target: r.targetEntity.id,
      label: r.relationshipType,
    })));
  }, [setNodes, setEdges]);

  useEffect(() => { loadDiagram(); }, [loadDiagram]);

  // Cuando se suelta un nodo arrastrado, persiste la nueva posición en el backend
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds: Node[]) => applyNodeChanges(changes, nds));
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false && change.position) {
        moveEntity(change.id, Math.round(change.position.x), Math.round(change.position.y));
      }
    });
  }, [setNodes]);

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
        onNodesChange={onNodesChange}
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