import api from './client';
import type { DiagramRelationship } from '../types/models';

export const createRelationship = (
  projectId: string,
  sourceEntityId: string,
  targetEntityId: string,
  relationshipType: DiagramRelationship['relationshipType']
) =>
  api.post<DiagramRelationship>(
    `/projects/${projectId}/relationships`,
    { relationshipType },
    { params: { sourceEntityId, targetEntityId } }
  ).then(r => r.data);