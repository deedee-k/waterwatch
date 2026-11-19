import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, full_name, role } = await req.json()

    // 1. Create the user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'wasco123',
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (createError) throw createError

    // 2. Update the profile with the role and name (DO NOT touch phone)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role, full_name })
      .eq('id', user.user.id)

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ success: true, user: user.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Function Error:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})