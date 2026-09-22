import type { AssociationType, DiagramRelationship } from '../types/models';

export const CARDINALITY_OPTIONS = ['0..1', '1', '0..*', '1..*', '*'];

// Tipos que pueden ser muchos a muchos y, por lo tanto, llevar una clase intermedia
export const MANY_TO_MANY_TYPES: AssociationType[] = ['ASSOCIATION', 'DIRECTED_ASSOCIATION', 'AGGREGATION'];

const isMany = (cardinality: string) => cardinality.includes('*');

// El tipo sale de las cardinalidades: ambos extremos "muchos" = muchos a muchos
export const deriveRelationshipType = (source: string, target: string): DiagramRelationship['relationshipType'] => {
  const s = isMany(source);
  const t = isMany(target);
  if (s && t) return 'MANY_TO_MANY';
  return s || t ? 'ONE_TO_MANY' : 'ONE_TO_ONE';
};

export interface AssociationRule {
  label: string;
  hint: string;
  dashed: boolean;
  marker?: string;
  markerAt?: 'start' | 'end';
  allowsVerb: boolean;
  allowsCardinality: boolean;
  persists: boolean;
  defaultSource: string;
  defaultTarget: string;
  relType: DiagramRelationship['relationshipType'];
  sourceOptions?: string[];
}

export const ASSOCIATION_RULES: Record<AssociationType, AssociationRule> = {
  ASSOCIATION: {
    label: 'Asociación', hint: 'Línea simple',
    dashed: false,
    allowsVerb: true, allowsCardinality: true, persists: true,
    defaultSource: '1', defaultTarget: '*', relType: 'ONE_TO_MANY',
  },
  GENERALIZATION: {
    label: 'Generalización', hint: 'Herencia · sin verbo ni card.',
    dashed: false, marker: 'generalization-marker', markerAt: 'end',
    allowsVerb: false, allowsCardinality: false, persists: true,
    defaultSource: '', defaultTarget: '', relType: 'ONE_TO_ONE',
  },
  COMPOSITION: {
    label: 'Composición', hint: 'Rombo relleno · todo-parte',
    dashed: false, marker: 'composition-marker', markerAt: 'start',
    allowsVerb: true, allowsCardinality: true, persists: true,
    defaultSource: '1', defaultTarget: '*', relType: 'ONE_TO_MANY',
    sourceOptions: ['1', '0..1'],
  },
  AGGREGATION: {
    label: 'Agregación', hint: 'Rombo hueco · todo-parte',
    dashed: false, marker: 'aggregation-marker', markerAt: 'start',
    allowsVerb: true, allowsCardinality: true, persists: true,
    defaultSource: '1', defaultTarget: '*', relType: 'ONE_TO_MANY',
  },
  DEPENDENCY: {
    label: 'Dependencia', hint: 'Punteada con flecha',
    dashed: true, marker: 'directed-marker', markerAt: 'end',
    allowsVerb: true, allowsCardinality: false, persists: false,
    defaultSource: '', defaultTarget: '', relType: 'ONE_TO_MANY',
  },
  DIRECTED_ASSOCIATION: {
    label: 'Asoc. dirigida', hint: 'Línea con flecha',
    dashed: false, marker: 'directed-marker', markerAt: 'end',
    allowsVerb: true, allowsCardinality: true, persists: true,
    defaultSource: '1', defaultTarget: '*', relType: 'ONE_TO_MANY',
  },
  REALIZATION: {
    label: 'Realización', hint: 'Punteada con triángulo',
    dashed: true, marker: 'generalization-marker', markerAt: 'end',
    allowsVerb: false, allowsCardinality: false, persists: false,
    defaultSource: '', defaultTarget: '', relType: 'ONE_TO_MANY',
  },
  ASSOCIATION_CLASS: {
    label: 'Clase de asoc.', hint: 'Muchos a muchos + tabla intermedia',
    dashed: true,
    allowsVerb: false, allowsCardinality: false, persists: true,
    defaultSource: '', defaultTarget: '', relType: 'ONE_TO_MANY',
  },
};

export const ASSOCIATION_ORDER: AssociationType[] = [
  'ASSOCIATION',
  'GENERALIZATION',
  'COMPOSITION',
  'AGGREGATION',
  'DEPENDENCY',
  'DIRECTED_ASSOCIATION',
  'REALIZATION',
  'ASSOCIATION_CLASS',
];