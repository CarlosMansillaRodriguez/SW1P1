import { useState } from 'react';
import { Table2, ChevronDown, ChevronRight, Link2, GitBranch, Diamond, Component } from 'lucide-react';
import type { AssociationType } from '../types/models';
import './Sidebar.css';

interface SidebarProps {
  onAddEntity: () => void;
  activeAssociation: AssociationType | null;
  onSelectAssociation: (type: AssociationType | null) => void;
}

const ASSOCIATIONS: { type: AssociationType; label: string; hint: string; icon: typeof Link2 }[] = [
  { type: 'ASSOCIATION', label: 'Asociación', hint: '1:1, 1:N, N:M', icon: Link2 },
  { type: 'GENERALIZATION', label: 'Generalización', hint: 'Herencia', icon: GitBranch },
  { type: 'AGGREGATION', label: 'Agregación', hint: 'Todo-parte (débil)', icon: Diamond },
  { type: 'COMPOSITION', label: 'Composición', hint: 'Todo-parte (fuerte)', icon: Component },
];

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
        Asociaciones
      </button>

      {associationsOpen && (
        <div>
          {ASSOCIATIONS.map(a => {
            const Icon = a.icon;
            const active = activeAssociation === a.type;
            return (
              <button
                key={a.type}
                className={`sidebar-item sidebar-item--nested ${active ? 'sidebar-item--active' : ''}`}
                onClick={() => onSelectAssociation(active ? null : a.type)}
              >
                <Icon size={15} />
                <span className="sidebar-item-text">
                  <span className="sidebar-item-label">{a.label}</span>
                  <span className="sidebar-item-hint">{a.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeAssociation && (
        <div className="sidebar-hint-box">
          Modo activo: <strong>{ASSOCIATIONS.find(a => a.type === activeAssociation)?.label}</strong>.
          Arrastrá desde una tabla a otra para crear la relación.
        </div>
      )}
    </aside>
  );
}