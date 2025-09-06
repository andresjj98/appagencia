const { supabaseAdmin } = require('./supabase');

(async () => {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error Supabase:', error);
  } else {
    console.log('OK Supabase, ejemplo:', data);
  }
})();
