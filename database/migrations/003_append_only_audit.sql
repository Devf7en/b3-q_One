BEGIN;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON one_runtime.audit_events FOR EACH ROW EXECUTE FUNCTION one_runtime.reject_governance_mutation();
CREATE TRIGGER evidence_append_only BEFORE UPDATE OR DELETE ON one_runtime.evidence FOR EACH ROW EXECUTE FUNCTION one_runtime.reject_governance_mutation();
COMMIT;
