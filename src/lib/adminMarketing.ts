import { supabase } from '@/integrations/supabase/client';

interface AdminMarketingActionResponse {
  action: string;
  error?: string;
  id: string;
  success: boolean;
}

const invokeAdminMarketingAction = async (action: string, id: string) => {
  const { data, error } = await supabase.functions.invoke('admin-manage-marketing', {
    body: { action, id },
  });

  if (error) {
    throw error;
  }

  const response = data as AdminMarketingActionResponse | null;

  if (!response?.success) {
    throw new Error(response?.error || 'Request failed');
  }

  return response;
};

export const deleteMarketingSubscriber = async (id: string) =>
  invokeAdminMarketingAction('delete-subscriber', id);

export const deleteMarketingNewsletter = async (id: string) =>
  invokeAdminMarketingAction('delete-newsletter', id);

export const deleteMarketingTemplate = async (id: string) =>
  invokeAdminMarketingAction('delete-template', id);