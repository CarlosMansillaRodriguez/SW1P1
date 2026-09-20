import { BaseEdge, EdgeLabelRenderer, getBezierPath, useInternalNode } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { AssociationType } from '../types/models';
import { getEdgeParams } from '../utils/floatingEdgeUtils';
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

export default function AssociationEdge({ id, source, target, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const edgeData = data as AssociationEdgeData;
  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
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
          style={{ transform: `translate(-50%, -130%) translate(${sx}px,${sy}px)` }}
        >
          {edgeData.sourceCardinality}
        </div>
        <div
          className="association-edge-cardinality"
          style={{ transform: `translate(-50%, 30%) translate(${tx}px,${ty}px)` }}
        >
          {edgeData.targetCardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}