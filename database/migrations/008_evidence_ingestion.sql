BEGIN;
CREATE ROLE one_ingest NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA one_runtime TO one_ingest;
CREATE FUNCTION one_runtime.resolve_collector_assignments(p_issuer text,p_subject text,p_tenant uuid,p_project uuid)
RETURNS TABLE(host_id uuid,collector_id uuid,kind text,external_ref text,resource_id uuid)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT h.id,c.id,a.kind,a.external_ref,a.resource_id
 FROM one_runtime.infrastructure_collectors c
 JOIN one_runtime.infrastructure_hosts h ON h.id=c.host_id
 JOIN one_runtime.infrastructure_assignments a ON a.host_id=h.id
 WHERE c.issuer=p_issuer AND c.subject=p_subject AND c.enabled AND h.enabled
 AND a.tenant_id=p_tenant AND a.project_id=p_project
 AND p_tenant=nullif(current_setting('one.tenant_id',true),'')::uuid
 FOR SHARE OF c,h,a
$$;
REVOKE ALL ON FUNCTION one_runtime.resolve_collector_assignments(text,text,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION one_runtime.resolve_collector_assignments(text,text,uuid,uuid) TO one_ingest;
GRANT INSERT ON one_runtime.evidence TO one_ingest;
CREATE UNIQUE INDEX evidence_ingestion_replay ON one_runtime.evidence(tenant_id,project_id,(payload->>'collectorId'),(payload->>'submissionId')) WHERE payload ? 'submissionId';
COMMIT;
