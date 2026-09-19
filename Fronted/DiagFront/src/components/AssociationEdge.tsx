import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { AssociationType } from '../types/models';

export interface AssociationEdgeData {
  associationType: AssociationType;
  sourceCardinality: string;
  targetCardinality: string;
  verb?: string;
  [key: string]: unknown;
}

const MARKER_BY_TYPE: Record<AssociationType, string> = {
  ASSOCIATION: 'none',
  GENERALIZATION: 'url(#generalization-marker)',
  AGGREGATION: 'url(#aggregation-marker)',
  COMPOSITION: 'url(#composition-marker)',
};

export default function AssociationEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data,
}: EdgeProps) {
  const edgeData = data as AssociationEdgeData;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={MARKER_BY_TYPE[edgeData.associationType]} style={{ stroke: '#333', strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          background: '#fff', padding: '1px 6px', borderRadius: 4, fontSize: 11,
          border: '1px solid #ddd', pointerEvents: 'all',
        }}>
          {edgeData.verb || ''}
        </div>
        <div style={{
          position: 'absolute',
          transform: `translate(-120%, -50%) translate(${sourceX}px,${sourceY}px)`,
          background: '#fff', fontSize: 11, padding: '0 3px',
        }}>
          {edgeData.sourceCardinality}
        </div>
        <div style={{
          position: 'absolute',
          transform: `translate(20%, -50%) translate(${targetX}px,${targetY}px)`,
          background: '#fff', fontSize: 11, padding: '0 3px',
        }}>
          {edgeData.targetCardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}