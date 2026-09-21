import { useState } from 'react';
import {
  Table2, ChevronDown, ChevronRight, Link2, GitBranch, Diamond, Component,
  ArrowRight, MoveRight, Triangle, Puzzle,
} from 'lucide-react';
import type { AssociationType } from '../types/models';
import { ASSOCIATION_ORDER, ASSOCIATION_RULES } from '../utils/associationRules';
import './Sidebar.css';

interface SidebarProps {
  onAddEntity: () => void;
  activeAssociation: AssociationType | null;
  onSelectAssociation: (type: AssociationType | null) => void;
}

const ICONS: Record<AssociationType, typeof Link2> = {
  ASSOCIATION: Link2,
  GENERALIZATION: GitBranch,
  COMPOSITION: Component,
  AGGREGATION: Diamond,
  DEPENDENCY: MoveRight,
  DIRECTED_ASSOCIATION: ArrowRight,
  REALIZATION: Triangle,
  ASSOCIATION_CLASS: Puzzle,
};

export default function Sidebar({ onAddEntity, activeAssociation, onSelectAssociation }: SidebarProps) {
  const [associationsOpen, setAssociationsOpen] = useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Herramientas</div>

      <button className="sidebar-item" onClick={onAddEntity}>
        <Table2 size={16} />
        <span className="sidebar-item-label">Crear tabla</span>
      </button>

      <button className="sidebar-group-header" onClick={() => setAssociationsOpen(o => !o)}>
        {associationsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Relaciones
      </button>

      {associationsOpen && (
        <div>
          {ASSOCIATION_ORDER.map(type => {
            const rule = ASSOCIATION_RULES[type];
            const Icon = ICONS[type];
            const active = activeAssociation === type;
            return (
              <button
                key={type}
                className={`sidebar-item sidebar-item--nested ${active ? 'sidebar-item--active' : ''}`}
                onClick={() => onSelectAssociation(active ? null : type)}
              >
                <Icon size={15} />
                <span className="sidebar-item-text">
                  <span className="sidebar-item-label">{rule.label}</span>
                  <span className="sidebar-item-hint">{rule.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeAssociation && (
        <div className="sidebar-hint-box">
          Modo activo: <strong>{ASSOCIATION_RULES[activeAssociation].label}</strong>.{' '}
          {activeAssociation === 'ASSOCIATION_CLASS'
            ? 'Hacé click sobre la línea de una asociación para colgarle la clase.'
            : 'Arrastrá desde una tabla a otra para crear la relación.'}
        </div>
      )}
    </aside>
  );
}