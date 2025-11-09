-- Add explicit DENY policies for UPDATE and DELETE on admin_audit_logs
-- This ensures audit logs are truly immutable and append-only

-- Explicitly deny all updates to audit logs
CREATE POLICY "Audit logs cannot be updated"
ON public.admin_audit_logs
FOR UPDATE
USING (false);

-- Explicitly deny all deletions of audit logs
CREATE POLICY "Audit logs cannot be deleted"
ON public.admin_audit_logs
FOR DELETE
USING (false);