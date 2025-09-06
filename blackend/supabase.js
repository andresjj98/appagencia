console.log('[ENV CHECK]', {
  url: process.env.SUPABASE_URL,
  anonLen: process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.length,
  svcLen: process.env.SUPABASE_SERVICE_ROLE && process.env.SUPABASE_SERVICE_ROLE.length,
});

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,

  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabase, supabaseAdmin };