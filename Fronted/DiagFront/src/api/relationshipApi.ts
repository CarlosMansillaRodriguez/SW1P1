import api from './client';
import type { DiagramRelationship, AssociationType } from '../types/models';

export interface RelationshipPayload {
  relationshipType: DiagramRelationship['relationshipType'];
  associationType: AssociationType;
  sourceCardinality: string;
  targetCardinality: string;
  name?: string;
}

export const createRelationship = (
  projectId: string,
  sourceEntityId: string,
  targetEntityId: string,
  payload: RelationshipPayload,
  targetRelationshipId?: string
) =>
  api.post<DiagramRelationship>(
    `/projects/${projectId}/relationships`,
    payload,
    { params: { sourceEntityId, targetEntityId, targetRelationshipId } }
  ).then(r => r.data);

export const updateRelationship = (id: string, payload: RelationshipPayload) =>
  api.put<DiagramRelationship>(`/relationships/${id}`, payload).then(r => r.data);

export const deleteRelationship = (id: string) =>
  api.delete(`/relationships/${id}`);

export const swapRelationshipDirection = (id: string) =>
  api.put<DiagramRelationship>(`/relationships/${id}/swap`).then(r => r.data);