import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, applicationId, applicationIds, adminNotes } = await req.json();

    if (action === 'list') {
      const { data: applications, error } = await supabaseAdmin
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      return new Response(JSON.stringify({ applications: applications || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk approve
    if (action === 'bulk-approve' && applicationIds?.length) {
      let successCount = 0;
      for (const appId of applicationIds) {
        const { data: app } = await supabaseAdmin
          .from('seller_applications')
          .select('*')
          .eq('id', appId)
          .eq('status', 'pending')
          .single();

        if (!app) continue;

        const slug = app.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { error: sellerError } = await supabaseAdmin
          .from('sellers')
          .insert({
            user_id: app.user_id,
            name: app.store_name,
            slug: slug + '-' + Date.now().toString(36),
            is_verified: true,
          });

        if (!sellerError) {
          await supabaseAdmin
            .from('seller_applications')
            .update({ status: 'approved', admin_notes: adminNotes, updated_at: new Date().toISOString() })
            .eq('id', appId);
          successCount++;
        }
      }
      return new Response(JSON.stringify({ success: true, count: successCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bulk reject
    if (action === 'bulk-reject' && applicationIds?.length) {
      const { error } = await supabaseAdmin
        .from('seller_applications')
        .update({ status: 'rejected', admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .in('id', applicationIds);

      return new Response(JSON.stringify({ success: true, count: error ? 0 : applicationIds.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve' && applicationId) {
      const { data: app } = await supabaseAdmin
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!app) {
        return new Response(JSON.stringify({ error: 'Application not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const slug = app.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error: sellerError } = await supabaseAdmin
        .from('sellers')
        .insert({
          user_id: app.user_id,
          name: app.store_name,
          slug: slug + '-' + Date.now().toString(36),
          is_verified: true,
        });

      if (sellerError) {
        return new Response(JSON.stringify({ error: 'Failed to create seller: ' + sellerError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabaseAdmin
        .from('seller_applications')
        .update({ status: 'approved', admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reject' && applicationId) {
      await supabaseAdmin
        .from('seller_applications')
        .update({ status: 'rejected', admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete a seller
    if (action === 'delete' && applicationId) {
      const { error: delError } = await supabaseAdmin
        .from('sellers')
        .delete()
        .eq('id', applicationId);

      if (delError) {
        return new Response(JSON.stringify({ error: 'Failed to delete seller: ' + delError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete a seller application
    if (action === 'delete-application' && applicationId) {
      const { error: delError } = await supabaseAdmin
        .from('seller_applications')
        .delete()
        .eq('id', applicationId);

      if (delError) {
        return new Response(JSON.stringify({ error: 'Failed to delete application: ' + delError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
