import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Upload, Image as ImageIcon, ChevronDown, Server, Moon, Sun } from 'lucide-react';
import { importAiImage } from '../api/aiApi';
import { downloadGeneratedBackend } from '../api/generatorApi';
import { ASSOCIATION_RULES, MANY_TO_MANY_TYPES } from '../utils/associationRules';
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
import type { Node, Edge, NodeChange, Connection, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getEntities, getRelationships, createEntity, renameEntity, deleteEntity, moveEntity, getEntityById } from '../api/diagramApi';
import { getAttributes, createAttribute, updateAttribute, deleteAttribute, reorderAttributes } from '../api/attributeApi';
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
import { useTheme } from '../context/ThemeContext';

const nodeTypes = { entity: EntityNode };
const edgeTypes = { association: AssociationEdge };

interface AssociationClassInfo {
  id: string;
  name: string;
}

function entityLabel(nodes: Node[], id: string): string {
  return (nodes.find(n => n.id === id)?.data as { label?: string } | undefined)?.label ?? '';
}

function relationshipToEdge(r: DiagramRelationship, hostedClass?: AssociationClassInfo): Edge {
  return {
    id: r.id,
    source: r.sourceEntity.id,
    target: r.targetEntity.id,
    type: 'association',
    data: {
      associationType: r.associationType,
      relationshipType: r.relationshipType,
      sourceCardinality: r.sourceCardinality,
      targetCardinality: r.targetCardinality,
      verb: r.name,
      assocSourceId: r.targetRelationship?.sourceEntity.id,
      assocTargetId: r.targetRelationship?.targetEntity.id,
      classId: hostedClass?.id,
      className: hostedClass?.name,
    },
  };
}

// Cada asociación conoce la tabla intermedia (clase de asociación) que tiene colgada, si la tiene
function relationshipsToEdges(relationships: DiagramRelationship[]): Edge[] {
  const classByHost = new Map<string, AssociationClassInfo>();
  relationships.forEach(r => {
    if (r.associationType === 'ASSOCIATION_CLASS' && r.targetRelationship) {
      classByHost.set(r.targetRelationship.id, { id: r.sourceEntity.id, name: r.sourceEntity.name });
    }
  });
  return relationships.map(r => relationshipToEdge(r, classByHost.get(r.id)));
}

export default function DiagramPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [activeAssociation, setActiveAssociation] = useState<AssociationType | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<DiagramRelationship | null>(null);
  const [editingClass, setEditingClass] = useState<AssociationClassInfo | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<DiagramAttribute | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [importingImage, setImportingImage] = useState(false);
  const [generatingBackend, setGeneratingBackend] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const flowWrapperRef = useRef<HTMLDivElement>(null);

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

  const handleMoveAttribute = useCallback((entityId: string, attributeId: string, direction: 'up' | 'down') => {
    setNodes((nds: Node[]) => {
      const node = nds.find(n => n.id === entityId);
      if (!node) return nds;
      const attrs = (node.data as { attributes: DiagramAttribute[] }).attributes;
      const index = attrs.findIndex(a => a.id === attributeId);
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || swapWith < 0 || swapWith >= attrs.length) return nds;

      const reordered = [...attrs];
      [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
      reorderAttributes(entityId, reordered.map(a => a.id));

      return nds.map(n => n.id === entityId ? { ...n, data: { ...n.data, attributes: reordered } } : n);
    });
  }, [setNodes]);

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
      onMoveAttribute: (attributeId: string, direction: 'up' | 'down') => handleMoveAttribute(entity.id, attributeId, direction),
    },
  }), [handleAddAttribute, handleRenameEntity, handleDeleteEntity, handleDeleteAttribute, handleMoveAttribute]);

  const loadDiagram = useCallback(async () => {
    if (!projectId) return;
    const entities = await getEntities(projectId);
    const relationships = await getRelationships(projectId);

    const nodesWithAttrs = await Promise.all(entities.map(async (e) => {
      const attributes = await getAttributes(e.id);
      return buildNode(e, attributes);
    }));

    setNodes(nodesWithAttrs);
    setEdges(relationshipsToEdges(relationships));
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
      setEdges(relationshipsToEdges(relationships));
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

  // Crea la tabla intermedia (clase de asociación) y la cuelga del centro de la asociación
  const attachAssociationClass = useCallback(async (associationId: string, sourceId: string, targetId: string, name: string) => {
    if (!projectId) return;
    const a = nodes.find(n => n.id === sourceId);
    const b = nodes.find(n => n.id === targetId);
    const x = a && b ? Math.round((a.position.x + b.position.x) / 2) : 100;
    const y = a && b ? Math.round((a.position.y + b.position.y) / 2) + 180 : 100;

    const entity = await createEntity(projectId, name);
    await moveEntity(entity.id, x, y);

    const rule = ASSOCIATION_RULES.ASSOCIATION_CLASS;
    await createRelationship(projectId, entity.id, sourceId, {
      relationshipType: rule.relType,
      associationType: 'ASSOCIATION_CLASS',
      sourceCardinality: rule.defaultSource,
      targetCardinality: rule.defaultTarget,
    }, associationId);

    await loadDiagram();
  }, [projectId, nodes, loadDiagram]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target || !projectId) return;
    const type = activeAssociation ?? 'ASSOCIATION';
    const rule = ASSOCIATION_RULES[type];

    // Clase de asociación: se dibuja la asociación (muchos a muchos) y sale su tabla intermedia
    if (type === 'ASSOCIATION_CLASS') {
      if (connection.source === connection.target) {
        alert('La clase de asociación necesita dos tablas distintas.');
        return;
      }
      const suggested = `${entityLabel(nodes, connection.source)}_${entityLabel(nodes, connection.target)}`;
      const name = prompt('Nombre de la tabla intermedia:', suggested)?.trim();
      if (!name) return;

      const association = await createRelationship(projectId, connection.source, connection.target, {
        relationshipType: 'MANY_TO_MANY',
        associationType: 'ASSOCIATION',
        sourceCardinality: '*',
        targetCardinality: '*',
      });
      await attachAssociationClass(association.id, connection.source, connection.target, name);
      return;
    }

    if (connection.source === connection.target && (type === 'GENERALIZATION' || type === 'REALIZATION')) {
      alert(`${rule.label} no puede unir una tabla consigo misma.`);
      return;
    }

    try {
      const relationship = await createRelationship(projectId, connection.source, connection.target, {
        relationshipType: rule.relType,
        associationType: type,
        sourceCardinality: rule.defaultSource,
        targetCardinality: rule.defaultTarget,
      });
      setEdges((eds: Edge[]) => addEdge(relationshipToEdge(relationship), eds));
    } catch {
      alert('No se pudo crear la relación. Si es una generalización, revisá que no forme un ciclo de herencia.');
    }
  }, [setEdges, projectId, activeAssociation, nodes, attachAssociationClass]);

  // Modo "Clase de asoc." sobre una asociación que ya existe
  const onEdgeClick = useCallback(async (_: MouseEvent, edge: Edge) => {
    if (activeAssociation !== 'ASSOCIATION_CLASS' || !projectId) return;
    const data = edge.data as { associationType: AssociationType; classId?: string };
    if (!MANY_TO_MANY_TYPES.includes(data.associationType)) {
      alert('La clase de asociación solo puede colgar de una asociación, asociación dirigida o agregación.');
      return;
    }
    if (data.classId) {
      alert('Esta asociación ya tiene su tabla intermedia.');
      return;
    }
    const suggested = `${entityLabel(nodes, edge.source)}_${entityLabel(nodes, edge.target)}`;
    const name = prompt('Nombre de la tabla intermedia (la asociación pasará a ser de muchos a muchos):', suggested)?.trim();
    if (!name) return;

    await updateRelationship(edge.id, {
      relationshipType: 'MANY_TO_MANY',
      associationType: data.associationType,
      sourceCardinality: '*',
      targetCardinality: '*',
    });
    await attachAssociationClass(edge.id, edge.source, edge.target, name);
  }, [activeAssociation, projectId, nodes, attachAssociationClass]);

  const onEdgeDoubleClick = useCallback((_: MouseEvent, edge: Edge) => {
    const data = edge.data as {
      associationType: AssociationType;
      relationshipType: DiagramRelationship['relationshipType'];
      sourceCardinality: string;
      targetCardinality: string;
      verb?: string;
      classId?: string;
      className?: string;
    };
    setEditingClass(data.classId ? { id: data.classId, name: data.className ?? '' } : null);
    setEditingRelationship({
      id: edge.id,
      name: data.verb,
      associationType: data.associationType,
      sourceCardinality: data.sourceCardinality,
      targetCardinality: data.targetCardinality,
      relationshipType: data.relationshipType,
      sourceEntity: { id: edge.source } as never,
      targetEntity: { id: edge.target } as never,
    });
  }, []);

  const closeRelationshipModal = () => {
    setEditingRelationship(null);
    setEditingClass(null);
  };

  const handleSaveRelationship = async (payload: { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; name: string; relationshipType: DiagramRelationship['relationshipType'] }) => {
    if (!editingRelationship) return;
    const { id, sourceEntity, targetEntity } = editingRelationship;

    // muchos a muchos = asociación + tabla intermedia con nombre
    let newClassName: string | null = null;
    if (payload.relationshipType === 'MANY_TO_MANY' && payload.associationType !== 'ASSOCIATION_CLASS' && !editingClass) {
      const suggested = `${entityLabel(nodes, sourceEntity.id)}_${entityLabel(nodes, targetEntity.id)}`;
      newClassName = prompt('Nombre de la tabla intermedia:', suggested)?.trim() || null;
      if (!newClassName) return;
    }

    try {
      await updateRelationship(id, payload);
      if (editingClass && payload.name.trim() && payload.name.trim() !== editingClass.name) {
        await renameEntity(editingClass.id, payload.name.trim());
      }
      if (newClassName) {
        await attachAssociationClass(id, sourceEntity.id, targetEntity.id, newClassName);
      } else {
        await loadDiagram();
      }
      closeRelationshipModal();
    } catch {
      alert('No se pudo guardar la relación. Si es una generalización, revisá que no forme un ciclo de herencia.');
    }
  };

  const handleDeleteRelationship = async () => {
    if (!editingRelationship) return;
    await deleteRelationship(editingRelationship.id);
    // sin la asociación, su tabla intermedia no tiene sentido
    if (editingClass) await deleteEntity(editingClass.id);
    closeRelationshipModal();
    await loadDiagram();
  };

  const handleSwapRelationship = async () => {
    if (!editingRelationship) return;
    await swapRelationshipDirection(editingRelationship.id);
    closeRelationshipModal();
    await loadDiagram();
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
    const entity = await createEntity(projectId, name);

    if (flowInstance && flowWrapperRef.current) {
      const rect = flowWrapperRef.current.getBoundingClientRect();
      const center = flowInstance.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      await moveEntity(entity.id, Math.round(center.x - 110), Math.round(center.y - 40));
    }

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
            <button className="btn" onClick={toggleTheme} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}>
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <Link to="/projects" className="btn">Volver a proyectos</Link>
          </div>
        </div>
        <div className="diagram-flow-wrapper" ref={flowWrapperRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onInit={setFlowInstance}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background color={theme === 'dark' ? '#334155' : '#e2e8f0'} />
            <Controls />
            <MiniMap maskColor={theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(240,240,240,0.6)'} />
          </ReactFlow>
        </div>
        {projectId && <AiChatPanel projectId={projectId} onResult={applyAiResult} />}
      </div>

      {editingRelationship && (
        <RelationshipEditModal
          relationship={editingRelationship}
          associationClass={editingClass}
          onClose={closeRelationshipModal}
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