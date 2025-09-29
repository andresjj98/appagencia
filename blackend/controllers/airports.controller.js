const { supabaseAdmin } = require('../supabase');

const searchAirports = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'El parametro de busqueda "q" es requerido.' });
  }

  try {
    const searchTerm = q.trim();
    if (!searchTerm) {
      return res.status(200).json([]);
    }

    const upperCaseQ = searchTerm.toUpperCase();
    const sanitizedTerm = searchTerm.replace(/[,%]/g, ' ').trim();
    const safeTerm = sanitizedTerm.replace(/[%_]/g, '');
    const likePattern = `%${safeTerm}%`;

    const { data, error } = await supabaseAdmin
      .from('catalog_airports')
      .select('iata_code, airport_name, city, country, is_main_hub')
      .or(
        `iata_code.eq.${upperCaseQ},` +
        `airport_name.ilike.${likePattern},` +
        `city.ilike.${likePattern},` +
        `country.ilike.${likePattern}`
      )
      .order('is_main_hub', { ascending: false })
      .order('airport_name', { ascending: true })
      .limit(20);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error searching airports:', error);
    res.status(500).json({ message: 'Error en el servidor al buscar aeropuertos.', details: error.message });
  }
};

module.exports = {
  searchAirports,
};
