import { BaseEdge, EdgeLabelRenderer, Position, getBezierPath, getStraightPath, useInternalNode } from '@xyflow/react';
import type { EdgeProps, InternalNode } from '@xyflow/react';
import type { AssociationType } from '../types/models';
import { ASSOCIATION_RULES } from '../utils/associationRules';
import { getEdgeParams } from '../utils/floatingEdgeUtils';
import './AssociationEdge.css';

export interface AssociationEdgeData {
  associationType: AssociationType;
  relationshipType?: string;
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
  return { path, sx: p.sx, sy: p.sy, tx: p.tx, ty: p.ty, sourcePos: p.sourcePos, targetPos: p.targetPos, labelX, labelY };
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
  return { path, sx: p.sx, sy: p.sy, tx: midX, ty: midY, sourcePos: p.sourcePos, targetPos: p.targetPos, labelX: midX, labelY: midY };
}

// nx/ny: hacia afuera de la tabla · px/py: corrimiento al costado de la línea
const LABEL_OFFSETS: Record<Position, { nx: number; ny: number; px: number; py: number }> = {
  [Position.Left]: { nx: -1, ny: 0, px: 0, py: -14 },
  [Position.Right]: { nx: 1, ny: 0, px: 0, py: -14 },
  [Position.Top]: { nx: 0, ny: -1, px: 14, py: 0 },
  [Position.Bottom]: { nx: 0, ny: 1, px: 14, py: 0 },
};

// El número se coloca afuera de la tabla, del lado por el que entra la línea.
// Si las tablas están muy juntas se acerca al borde para no caer dentro de la otra.
function cardinalityPosition(x: number, y: number, side: Position, gap: number) {
  const o = LABEL_OFFSETS[side];
  const distance = Math.max(10, Math.min(22, gap / 3));
  return { x: x + o.nx * distance + o.px, y: y + o.ny * distance + o.py };
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

  // En muchos a muchos no hay verbo ni cardinalidad: el nombre lo lleva la tabla intermedia
  const isManyToMany = edgeData.relationshipType === 'MANY_TO_MANY';
  const showVerb = rule.allowsVerb && !isManyToMany && !!edgeData.verb;
  const showCardinality = rule.allowsCardinality && !isManyToMany;

  const gap = Math.hypot(geometry.tx - geometry.sx, geometry.ty - geometry.sy);
  const sourceLabel = cardinalityPosition(geometry.sx, geometry.sy, geometry.sourcePos, gap);
  const targetLabel = cardinalityPosition(geometry.tx, geometry.ty, geometry.targetPos, gap);
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
        {showVerb && (
          <div
            className="association-edge-label"
            style={{ zIndex: 10, transform: `translate(-50%, -50%) translate(${geometry.labelX}px,${geometry.labelY}px)` }}
          >
            {edgeData.verb}
          </div>
        )}
        {showCardinality && edgeData.sourceCardinality && (
          <div
            className="association-edge-cardinality"
            style={{ zIndex: 10, transform: `translate(-50%, -50%) translate(${sourceLabel.x}px,${sourceLabel.y}px)` }}
          >
            {edgeData.sourceCardinality}
          </div>
        )}
        {showCardinality && edgeData.targetCardinality && (
          <div
            className="association-edge-cardinality"
            style={{ zIndex: 10, transform: `translate(-50%, -50%) translate(${targetLabel.x}px,${targetLabel.y}px)` }}
          >
            {edgeData.targetCardinality}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}