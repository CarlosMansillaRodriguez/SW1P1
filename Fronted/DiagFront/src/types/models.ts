export interface DiagramEntity {
  id: string;
  name: string;
  posX: number;
  posY: number;
}

export interface DiagramAttribute {
  id: string;
  name: string;
  dataType: string;
  primaryKey: boolean;
  foreignKey: boolean;
  nullable: boolean;
  unique: boolean;
}

export interface DiagramRelationship {
  id: string;
  sourceEntity: DiagramEntity;
  targetEntity: DiagramEntity;
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
}

export interface AuthUser {
  token: string;
  userId: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
}