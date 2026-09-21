import { BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath, useInternalNode } from '@xyflow/react';
import type { EdgeProps, InternalNode } from '@xyflow/react';
import type { AssociationType } from '../types/models';
import { ASSOCIATION_RULES } from '../utils/associationRules';
import { getEdgeParams } from '../utils/floatingEdgeUtils';
import './AssociationEdge.css';

export interface AssociationEdgeData {
  associationType: AssociationType;
  sourceCardinality: string;
  targetCardinality: string;
  verb?: string;
  assocSourceId?: string;
  assocTargetId?: string;
  [key: string]: unknown;
}

function defaultGeometry(source: InternalNode, target: InternalNode) {
  const p = getEdgeParams(source, target);
  const [path, labelX, labelY] = getBezierPath({
    sourceX: p.sx,
    sourceY: p.sy,
    sourcePosition: p.sourcePos,
    targetX: p.tx,
    targetY: p.ty,
    targetPosition: p.targetPos,
  });
  return { path, sx: p.sx, sy: p.sy, tx: p.tx, ty: p.ty, labelX, labelY };
}

// La clase de asociación no va a una tabla: va al punto medio de la asociación que la contiene
function associationClassGeometry(classNode: InternalNode, hostSource: InternalNode, hostTarget: InternalNode) {
  const host = getEdgeParams(hostSource, hostTarget);
  const [, midX, midY] = getBezierPath({
    sourceX: host.sx,
    sourceY: host.sy,
    sourcePosition: host.sourcePos,
    targetX: host.tx,
    targetY: host.ty,
    targetPosition: host.targetPos,
  });
  const anchor = {
    measured: { width: 1, height: 1 },
    internals: { positionAbsolute: { x: midX - 0.5, y: midY - 0.5 } },
  };
  const p = getEdgeParams(classNode, anchor);
  const [path] = getStraightPath({ sourceX: p.sx, sourceY: p.sy, targetX: midX, targetY: midY });
  return { path, sx: p.sx, sy: p.sy, tx: midX, ty: midY, labelX: midX, labelY: midY };
}

export default function AssociationEdge({ id, source, target, data }: EdgeProps) {
  const edgeData = data as AssociationEdgeData;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const hostSourceNode = useInternalNode(edgeData.assocSourceId ?? source);
  const hostTargetNode = useInternalNode(edgeData.assocTargetId ?? target);

  if (!sourceNode || !targetNode) return null;

  const rule = ASSOCIATION_RULES[edgeData.associationType];
  const isAssociationClass = edgeData.associationType === 'ASSOCIATION_CLASS';
  const geometry = isAssociationClass && hostSourceNode && hostTargetNode
    ? associationClassGeometry(sourceNode, hostSourceNode, hostTargetNode)
    : defaultGeometry(sourceNode, targetNode);

  const markerUrl = rule.marker ? `url(#${rule.marker})` : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={geometry.path}
        markerStart={rule.markerAt === 'start' ? markerUrl : undefined}
        markerEnd={rule.markerAt === 'end' ? markerUrl : undefined}
        style={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: rule.dashed ? '6 4' : undefined }}
      />
      <EdgeLabelRenderer>
        {rule.allowsVerb && edgeData.verb && (
          <div
            className="association-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${geometry.labelX}px,${geometry.labelY}px)` }}
          >
            {edgeData.verb}
          </div>
        )}
        {rule.allowsCardinality && edgeData.sourceCardinality && (
          <div
            className="association-edge-cardinality"
            style={{ transform: `translate(-50%, -130%) translate(${geometry.sx}px,${geometry.sy}px)` }}
          >
            {edgeData.sourceCardinality}
          </div>
        )}
        {rule.allowsCardinality && edgeData.targetCardinality && (
          <div
            className="association-edge-cardinality"
            style={{ transform: `translate(-50%, 30%) translate(${geometry.tx}px,${geometry.ty}px)` }}
          >
            {edgeData.targetCardinality}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}