BEGIN;
CREATE FUNCTION one_runtime.reject_governance_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Governance records are append-only'; END; $$;
CREATE TRIGGER plans_append_only BEFORE UPDATE OR DELETE ON one_runtime.plans FOR EACH ROW EXECUTE FUNCTION one_runtime.reject_governance_mutation();
CREATE TRIGGER approvals_append_only BEFORE UPDATE OR DELETE ON one_runtime.approvals FOR EACH ROW EXECUTE FUNCTION one_runtime.reject_governance_mutation();
COMMIT;
