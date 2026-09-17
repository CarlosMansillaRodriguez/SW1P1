import { Handle, Position } from '@xyflow/react';
import type { DiagramAttribute } from '../types/models';

interface EntityNodeData {
  label: string;
  attributes: DiagramAttribute[];
  onAddAttribute: () => void;
}

export default function EntityNode({ data }: { data: EntityNodeData }) {
  return (
    <div style={{ border: '1px solid #333', borderRadius: 6, background: 'white', minWidth: 160 }}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div style={{ padding: '6px 10px', background: '#2563eb', color: 'white', fontWeight: 'bold' }}>
        {data.label}
      </div>
      <div style={{ padding: '4px 0' }}>
        {data.attributes.map(attr => (
          <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px', fontSize: 13 }}>
            <span>{attr.primaryKey ? '🔑 ' : ''}{attr.name}</span>
            <span style={{ color: '#666' }}>{attr.dataType}</span>
          </div>
        ))}
      </div>
      <button onClick={data.onAddAttribute} style={{ width: '100%', fontSize: 12, padding: 4 }}>
        + atributo
      </button>
    </div>
  );
}