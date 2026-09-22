import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { AssociationType, DiagramRelationship } from '../types/models';
import {
  ASSOCIATION_ORDER, ASSOCIATION_RULES, CARDINALITY_OPTIONS, MANY_TO_MANY_TYPES, deriveRelationshipType,
} from '../utils/associationRules';
import './RelationshipEditModal.css';

interface Props {
  relationship: DiagramRelationship;
  associationClass: { id: string; name: string } | null;
  onClose: () => void;
  onSave: (payload: { associationType: AssociationType; sourceCardinality: string; targetCardinality: string; name: string; relationshipType: DiagramRelationship['relationshipType'] }) => void;
  onDelete: () => void;
  onSwap: () => void;
}

export default function RelationshipEditModal({ relationship, associationClass, onClose, onSave, onDelete, onSwap }: Props) {
  const isClass = relationship.associationType === 'ASSOCIATION_CLASS';
  const hasClass = associationClass !== null;
  const [associationType, setAssociationType] = useState<AssociationType>(relationship.associationType);
  const [sourceCardinality, setSourceCardinality] = useState(relationship.sourceCardinality);
  const [targetCardinality, setTargetCardinality] = useState(relationship.targetCardinality);
  // en una asociación con clase intermedia, este nombre es el de la tabla
  const [name, setName] = useState(associationClass ? associationClass.name : relationship.name || '');

  const rule = ASSOCIATION_RULES[associationType];
  const relationshipType = rule.allowsCardinality
    ? deriveRelationshipType(sourceCardinality, targetCardinality)
    : rule.relType;
  const isManyToMany = rule.allowsCardinality && relationshipType === 'MANY_TO_MANY';
  const sourceOptions = rule.sourceOptions ?? CARDINALITY_OPTIONS;
  const missing = [!rule.allowsVerb && 'verbo', !rule.allowsCardinality && 'cardinalidad'].filter(Boolean).join(' ni ');

  const typeOptions = ASSOCIATION_ORDER.filter(t =>
    t === 'ASSOCIATION_CLASS' ? isClass : !hasClass || MANY_TO_MANY_TYPES.includes(t)
  );

  const handleTypeChange = (next: AssociationType) => {
    const nextRule = ASSOCIATION_RULES[next];
    setAssociationType(next);
    if (!nextRule.allowsVerb && !hasClass) setName('');
    if (!nextRule.allowsCardinality) {
      setSourceCardinality('');
      setTargetCardinality('');
      return;
    }
    if (!sourceCardinality || (nextRule.sourceOptions && !nextRule.sourceOptions.includes(sourceCardinality))) {
      setSourceCardinality(nextRule.defaultSource);
    }
    if (!targetCardinality) setTargetCardinality(nextRule.defaultTarget);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">Editar relación</h3>

        {associationType !== 'ASSOCIATION' && !isClass && (
          <button className="btn modal-swap-btn" onClick={onSwap}>
            <ArrowLeftRight size={14} /> Invertir dirección
          </button>
        )}

        <label className="modal-field">
          Tipo de relación
          <select
            value={associationType}
            disabled={isClass}
            onChange={e => handleTypeChange(e.target.value as AssociationType)}
          >
            {typeOptions.map(t => (
              <option key={t} value={t}>{ASSOCIATION_RULES[t].label}</option>
            ))}
          </select>
        </label>

        {missing && (
          <p className="modal-hint">{rule.label} no lleva {missing}.</p>
        )}
        {rule.sourceOptions && (
          <p className="modal-hint">El extremo del "todo" solo admite cardinalidad {rule.sourceOptions.join(' o ')}.</p>
        )}
        {hasClass && (
          <p className="modal-hint">
            Muchos a muchos con tabla intermedia: la cardinalidad no se puede cambiar. La línea no lleva verbo ni números; el nombre es el de la tabla.
          </p>
        )}
        {isManyToMany && !hasClass && (
          <p className="modal-hint">
            Muchos a muchos: al guardar se crea la tabla intermedia (te pide el nombre). La línea no lleva verbo ni cardinalidad.
          </p>
        )}

        {rule.allowsCardinality && !hasClass && (
          <div className="modal-field-row">
            <label className="modal-field">
              Cardinalidad origen
              <select value={sourceCardinality} onChange={e => setSourceCardinality(e.target.value)}>
                {sourceOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>

            <label className="modal-field">
              Cardinalidad destino
              <select value={targetCardinality} onChange={e => setTargetCardinality(e.target.value)}>
                {CARDINALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>
        )}

        {hasClass && (
          <label className="modal-field">
            Nombre de la tabla intermedia
            <input value={name} onChange={e => setName(e.target.value)} />
          </label>
        )}

        {rule.allowsVerb && !isManyToMany && !hasClass && (
          <label className="modal-field">
            Verbo (ej: "pertenece a")
            <input value={name} onChange={e => setName(e.target.value)} placeholder="pertenece a" />
          </label>
        )}

        <div className="modal-actions modal-actions--split">
          <button className="btn btn-danger" onClick={onDelete}>Eliminar</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={() => onSave({ associationType, relationshipType, sourceCardinality, targetCardinality, name })}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}