BEGIN;
CREATE TABLE one_runtime.infrastructure_hosts (
 id uuid PRIMARY KEY, provider_id text NOT NULL CHECK(provider_id='local-docker'),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 256), enabled boolean NOT NULL DEFAULT false
);
CREATE TABLE one_runtime.infrastructure_collectors (
 id uuid PRIMARY KEY, host_id uuid NOT NULL REFERENCES one_runtime.infrastructure_hosts(id),
 issuer text NOT NULL, subject text NOT NULL, enabled boolean NOT NULL DEFAULT false,
 UNIQUE(issuer,subject)
);
ALTER TABLE one_runtime.resources ADD CONSTRAINT resource_project_identity UNIQUE(tenant_id,project_id,id);
CREATE TABLE one_runtime.infrastructure_assignments (
 host_id uuid NOT NULL REFERENCES one_runtime.infrastructure_hosts(id),
 kind text NOT NULL CHECK(kind IN ('containers','images','networks','volumes')),
 external_ref text NOT NULL CHECK(length(trim(external_ref)) BETWEEN 1 AND 256),
 tenant_id uuid NOT NULL, project_id uuid NOT NULL, resource_id uuid NOT NULL,
 PRIMARY KEY(host_id,kind,external_ref),
 UNIQUE(tenant_id,resource_id),
 FOREIGN KEY(tenant_id,project_id,resource_id) REFERENCES one_runtime.resources(tenant_id,project_id,id)
);
ALTER TABLE one_runtime.infrastructure_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_runtime.infrastructure_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_scope ON one_runtime.infrastructure_assignments USING(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=nullif(current_setting('one.tenant_id',true),'')::uuid);
REVOKE ALL ON one_runtime.infrastructure_hosts,one_runtime.infrastructure_collectors,one_runtime.infrastructure_assignments FROM PUBLIC;
COMMIT;
