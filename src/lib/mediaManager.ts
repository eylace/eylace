import { supabase } from '@/integrations/supabase/client';

export const deleteMediaFiles = async (paths: string[], bucket = 'product-images') => {
  const { data, error } = await supabase.functions.invoke('admin-manage-media', {
    body: { action: 'delete', paths, bucket },
  });

  if (error) throw new Error(error.message || 'Delete failed');
  if (data?.error) throw new Error(data.error);
  return data;
};
