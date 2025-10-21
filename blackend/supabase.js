// Primero, carga las variables de entorno del archivo .env
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Solo mostrar información de debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('[Supabase] Configuración cargada correctamente');
}

const { createClient } = require('@supabase/supabase-js');

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