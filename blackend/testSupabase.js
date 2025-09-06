const { supabase } = require('./supabase');

(async () => {
  const { data, error } = await supabase
    .from('usuarios_public')        // o 'usuarios_public' si tienes la vista
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error Supabase:', error);
  } else {
    console.log('OK Supabase, ejemplo:', data);
  }
})();
