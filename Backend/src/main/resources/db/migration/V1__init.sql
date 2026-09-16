CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    owner_id    UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE project_collaborators (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('OWNER','EDITOR','VIEWER')),
    joined_at   TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

CREATE TABLE entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    pos_x       INTEGER NOT NULL DEFAULT 0,
    pos_y       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE attributes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id       UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    data_type       VARCHAR(30) NOT NULL,
    is_primary_key  BOOLEAN NOT NULL DEFAULT false,
    is_foreign_key  BOOLEAN NOT NULL DEFAULT false,
    is_nullable     BOOLEAN NOT NULL DEFAULT true,
    is_unique       BOOLEAN NOT NULL DEFAULT false,
    default_value   VARCHAR(255),
    order_index     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE relationships (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name              VARCHAR(100),
    source_entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id  UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('ONE_TO_ONE','ONE_TO_MANY','MANY_TO_MANY'))
);

CREATE TABLE command_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    source          VARCHAR(10) NOT NULL CHECK (source IN ('MANUAL','TEXT','VOICE')),
    raw_input       TEXT,
    parsed_command  JSONB NOT NULL,
    success         BOOLEAN NOT NULL DEFAULT true,
    applied_at      TIMESTAMP NOT NULL DEFAULT now()
);