import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { AssociationType } from '../types/models';
import './AssociationEdge.css';

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
      <BaseEdge id={id} path={edgePath} markerEnd={MARKER_BY_TYPE[edgeData.associationType]} style={{ stroke: '#94a3b8', strokeWidth: 1.5 }} />
      <EdgeLabelRenderer>
        {edgeData.verb && (
          <div
            className="association-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {edgeData.verb}
          </div>
        )}
        <div
          className="association-edge-cardinality"
          style={{ transform: `translate(-140%, -50%) translate(${sourceX}px,${sourceY}px)` }}
        >
          {edgeData.sourceCardinality}
        </div>
        <div
          className="association-edge-cardinality"
          style={{ transform: `translate(40%, -50%) translate(${targetX}px,${targetY}px)` }}
        >
          {edgeData.targetCardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}