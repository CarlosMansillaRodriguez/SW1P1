import { useState } from 'react';
import type { AssociationType } from '../types/models';

interface SidebarProps {
  onAddEntity: () => void;
  activeAssociation: AssociationType | null;
  onSelectAssociation: (type: AssociationType | null) => void;
}

const ASSOCIATIONS: { type: AssociationType; label: string; hint: string }[] = [
  { type: 'ASSOCIATION', label: 'Asociación', hint: '1:1, 1:N, N:M' },
  { type: 'GENERALIZATION', label: 'Generalización', hint: 'Herencia' },
  { type: 'AGGREGATION', label: 'Agregación', hint: 'Todo-parte (débil)' },
  { type: 'COMPOSITION', label: 'Composición', hint: 'Todo-parte (fuerte)' },
];

export default function Sidebar({ onAddEntity, activeAssociation, onSelectAssociation }: SidebarProps) {
  const [associationsOpen, setAssociationsOpen] = useState(true);

  return (
    <div style={{
      width: 220,
      height: '100vh',
      borderRight: '1px solid #ddd',
      background: '#fafafa',
      overflowY: 'auto',
      fontSize: 14,
    }}>
      <div style={{ padding: 12, fontWeight: 600, borderBottom: '1px solid #ddd' }}>
        Herramientas
      </div>

      <button
        onClick={onAddEntity}
        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        ▭ Crear tabla
      </button>

      <div>
        <button
          onClick={() => setAssociationsOpen(o => !o)}
          style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
        >
          {associationsOpen ? '▾' : '▸'} Asociaciones
        </button>

        {associationsOpen && (
          <div>
            {ASSOCIATIONS.map(a => (
              <button
                key={a.type}
                onClick={() => onSelectAssociation(activeAssociation === a.type ? null : a.type)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px 8px 28px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeAssociation === a.type ? '#dbeafe' : 'transparent',
                }}
              >
                <div>{a.label}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{a.hint}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeAssociation && (
        <div style={{ padding: 12, fontSize: 12, color: '#555', borderTop: '1px solid #ddd', marginTop: 8 }}>
          Modo activo: <strong>{ASSOCIATIONS.find(a => a.type === activeAssociation)?.label}</strong>.
          Arrastrá desde una tabla a otra para crear la relación.
        </div>
      )}
    </div>
  );
}