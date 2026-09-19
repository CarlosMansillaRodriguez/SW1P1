import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Key, Hash, Trash2, Pencil } from 'lucide-react';
import type { DiagramAttribute } from '../types/models';
import './EntityNode.css';

interface EntityNodeData {
  label: string;
  attributes: DiagramAttribute[];
  onAddAttribute: () => void;
  onRename: (newName: string) => void;
  onDeleteEntity: () => void;
  onEditAttribute: (attribute: DiagramAttribute) => void;
  onDeleteAttribute: (attributeId: string) => void;
}

export default function EntityNode({ data }: { data: EntityNodeData }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(data.label);

  const commitRename = () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== data.label) {
      data.onRename(trimmed);
    } else {
      setNameDraft(data.label);
    }
  };

  return (
    <div className="entity-node">
      <Handle type="target" position={Position.Left} className="entity-node-handle" />
      <Handle type="source" position={Position.Right} className="entity-node-handle" />

      <div className="entity-node-header">
        <Hash size={13} />
        {editingName ? (
          <input
            className="entity-node-name-input"
            value={nameDraft}
            autoFocus
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setNameDraft(data.label); setEditingName(false); }
            }}
          />
        ) : (
          <span className="entity-node-name" onDoubleClick={() => setEditingName(true)}>
            {data.label}
          </span>
        )}
        <div className="entity-node-header-actions">
          <button className="entity-node-icon-btn" title="Renombrar" onClick={() => setEditingName(true)}>
            <Pencil size={12} />
          </button>
          <button
            className="entity-node-icon-btn"
            title="Eliminar tabla"
            onClick={() => {
              if (confirm(`¿Eliminar la tabla "${data.label}" y todos sus atributos y relaciones?`)) {
                data.onDeleteEntity();
              }
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="entity-node-body">
        {data.attributes.length === 0 && (
          <div className="entity-node-empty">Sin atributos</div>
        )}
        {data.attributes.map(attr => (
          <div key={attr.id} className="entity-node-row">
            <span className="entity-node-attr-name" onClick={() => data.onEditAttribute(attr)}>
              {attr.primaryKey && <Key size={11} className="entity-node-pk-icon" />}
              {attr.name}
            </span>
            <span className="entity-node-attr-type">{attr.dataType}</span>
            <button
              className="entity-node-row-delete"
              title="Eliminar atributo"
              onClick={() => data.onDeleteAttribute(attr.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button className="entity-node-add" onClick={data.onAddAttribute}>
        + Agregar atributo
      </button>
    </div>
  );
}