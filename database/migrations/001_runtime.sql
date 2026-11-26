BEGIN;
CREATE SCHEMA one_runtime;
CREATE TABLE one_runtime.tenants (id uuid PRIMARY KEY, name text NOT NULL CHECK(length(trim(name))>0));
CREATE TABLE one_runtime.identities (id uuid PRIMARY KEY, issuer text NOT NULL, subject text NOT NULL, UNIQUE(issuer,subject));
CREATE TABLE one_runtime.memberships (tenant_id uuid REFERENCES one_runtime.tenants(id), user_id uuid REFERENCES one_runtime.identities(id), role text NOT NULL CHECK(role IN ('viewer','operator','approver')), PRIMARY KEY(tenant_id,user_id));
CREATE TABLE one_runtime.projects (tenant_id uuid REFERENCES one_runtime.tenants(id), id uuid NOT NULL, name text NOT NULL, PRIMARY KEY(tenant_id,id));
CREATE TABLE one_runtime.resources (tenant_id uuid NOT NULL, id uuid NOT NULL, project_id uuid NOT NULL, kind text NOT NULL, PRIMARY KEY(tenant_id,id), FOREIGN KEY(tenant_id,project_id) REFERENCES one_runtime.projects(tenant_id,id));
CREATE TABLE one_runtime.plans (tenant_id uuid NOT NULL, id uuid NOT NULL, version integer NOT NULL CHECK(version>0), project_id uuid NOT NULL, created_by uuid NOT NULL, manifest jsonb NOT NULL, digest text NOT NULL CHECK(digest ~ '^[0-9a-f]{64}$'), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id,version), UNIQUE(tenant_id,id,version,digest,created_by), FOREIGN KEY(tenant_id,project_id) REFERENCES one_runtime.projects(tenant_id,id), FOREIGN KEY(tenant_id,created_by) REFERENCES one_runtime.memberships(tenant_id,user_id));
CREATE TABLE one_runtime.approvals (tenant_id uuid NOT NULL, plan_id uuid NOT NULL, version integer NOT NULL, digest text NOT NULL, created_by uuid NOT NULL, approved_by uuid NOT NULL, approved_at timestamptz NOT NULL DEFAULT now(), CHECK(created_by<>approved_by), PRIMARY KEY(tenant_id,plan_id,version), FOREIGN KEY(tenant_id,plan_id,version,digest,created_by) REFERENCES one_runtime.plans(tenant_id,id,version,digest,created_by), FOREIGN KEY(tenant_id,approved_by) REFERENCES one_runtime.memberships(tenant_id,user_id));
CREATE TABLE one_runtime.audit_events (tenant_id uuid NOT NULL, id uuid NOT NULL, actor_id uuid NOT NULL, action text NOT NULL, details jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,id), FOREIGN KEY(tenant_id,actor_id) REFERENCES one_runtime.memberships(tenant_id,user_id));
CREATE TABLE one_runtime.evidence (tenant_id uuid NOT NULL, id uuid NOT NULL, project_id uuid NOT NULL, source text NOT NULL, observed_at timestamptz, state text NOT NULL CHECK(state IN ('live','cached','unavailable','demonstration')), payload jsonb NOT NULL, CHECK(state NOT IN ('live','cached') OR observed_at IS NOT NULL), PRIMARY KEY(tenant_id,id), FOREIGN KEY(tenant_id,project_id) REFERENCES one_runtime.projects(tenant_id,id));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['memberships','projects','resources','plans','approvals','audit_events','evidence'] LOOP
 EXECUTE format('ALTER TABLE one_runtime.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE one_runtime.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY tenant_scope ON one_runtime.%I USING (tenant_id = nullif(current_setting(''one.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''one.tenant_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
REVOKE ALL ON SCHEMA one_runtime FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA one_runtime FROM PUBLIC;
COMMIT;
