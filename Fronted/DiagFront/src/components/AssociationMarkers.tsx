export default function AssociationMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker id="generalization-marker" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto-start-reverse">
          <path d="M0,0 L14,6 L0,12 Z" fill="white" stroke="#333" strokeWidth="1" />
        </marker>
        <marker id="aggregation-marker" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto-start-reverse">
          <path d="M0,6 L7,0 L14,6 L7,12 Z" fill="white" stroke="#333" strokeWidth="1" />
        </marker>
        <marker id="composition-marker" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto-start-reverse">
          <path d="M0,6 L7,0 L14,6 L7,12 Z" fill="#333" stroke="#333" strokeWidth="1" />
        </marker>
        <marker id="directed-marker" markerWidth="16" markerHeight="12" refX="14" refY="6" orient="auto-start-reverse">
          <path d="M0,0 L14,6 L0,12" fill="none" stroke="#333" strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  );
}