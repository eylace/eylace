import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MANAGE_MARKETING_ROLES = ['super_admin', 'admin', 'marketing_manager'];

const DELETE_TARGETS = {
  'delete-newsletter': 'newsletters',
  'delete-subscriber': 'newsletter_subscribers',
  'delete-template': 'marketing_email_templates',
} as const;

type DeleteAction = keyof typeof DELETE_TARGETS;

const isDeleteAction = (value: string): value is DeleteAction => value in DELETE_TARGETS;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const id = typeof body.id === 'string' ? body.id.trim() : '';

    if (!isDeleteAction(action) || !id) {
      return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', MANAGE_MARKETING_ROLES)
      .limit(1);

    if (roleError) {
      console.error('Error checking marketing access role:', roleError);
    }

    if (roleError || !roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden - Marketing access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const table = DELETE_TARGETS[action];
    const { data: deletedRow, error: deleteError } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      console.error(`Error deleting ${action}:`, deleteError);
      throw deleteError;
    }

    if (!deletedRow) {
      return new Response(JSON.stringify({ error: 'Record not found or already deleted' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Deleted ${action} ${id} by ${user.id}`);

    return new Response(JSON.stringify({ success: true, action, id: deletedRow.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-manage-marketing:', error);

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});