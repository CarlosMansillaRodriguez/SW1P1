import { useState } from 'react';
import type { DiagramAttribute } from '../types/models';
import './RelationshipEditModal.css';

interface Props {
  attribute: DiagramAttribute;
  onClose: () => void;
  onSave: (changes: Partial<DiagramAttribute>) => void;
  onDelete: () => void;
}

const DATA_TYPES = ['VARCHAR', 'TEXT', 'INTEGER', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'DECIMAL', 'UUID'];

export default function AttributeEditModal({ attribute, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(attribute.name);
  const [dataType, setDataType] = useState(attribute.dataType);
  const [primaryKey, setPrimaryKey] = useState(attribute.primaryKey);
  const [foreignKey, setForeignKey] = useState(attribute.foreignKey);
  const [nullable, setNullable] = useState(attribute.nullable);
  const [unique, setUnique] = useState(attribute.unique);
  const [defaultValue, setDefaultValue] = useState(attribute.defaultValue || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Editar atributo</h3>

        <label className="modal-field">
          Nombre
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>

        <label className="modal-field">
          Tipo de dato
          <select value={dataType} onChange={e => setDataType(e.target.value)}>
            {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="modal-field">
          Valor por defecto (opcional)
          <input value={defaultValue} onChange={e => setDefaultValue(e.target.value)} />
        </label>

        <div className="modal-checkbox-row">
          <label><input type="checkbox" checked={primaryKey} onChange={e => setPrimaryKey(e.target.checked)} /> Clave primaria</label>
          <label><input type="checkbox" checked={foreignKey} onChange={e => setForeignKey(e.target.checked)} /> Clave foránea</label>
        </div>
        <div className="modal-checkbox-row">
          <label><input type="checkbox" checked={!nullable} onChange={e => setNullable(!e.target.checked)} /> Obligatorio (NOT NULL)</label>
          <label><input type="checkbox" checked={unique} onChange={e => setUnique(e.target.checked)} /> Único</label>
        </div>

        <div className="modal-actions modal-actions--split">
          <button className="btn btn-danger" onClick={onDelete}>Eliminar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={() => onSave({ name, dataType, primaryKey, foreignKey, nullable, unique, defaultValue: defaultValue || undefined })}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}