import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | 'approve_content'
  | 'reject_content'
  | 'delete_user'
  | 'approve_request'
  | 'reject_request'
  | 'update_content'
  | 'delete_content'
  | 'update_user_role';

export type TargetType = 'content' | 'user' | 'registration_request';

interface AuditLogParams {
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  details?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({ action, targetType, targetId, details }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found for audit log');
        return;
      }

      const { error } = await supabase
        .from('admin_audit_logs')
        .insert({
          admin_id: user.id,
          action_type: action,
          target_type: targetType,
          target_id: targetId,
          details: details || null,
          ip_address: null, // Puede ser poblado desde el cliente si es necesario
          user_agent: navigator.userAgent,
        });

      if (error) {
        console.error('Error logging audit action:', error);
      }
    } catch (error) {
      console.error('Error in audit log:', error);
    }
  };

  return { logAction };
};
