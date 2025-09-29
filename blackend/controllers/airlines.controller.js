const { supabaseAdmin } = require('../supabase');

const searchAirlines = async (req, res) => {
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
      .from('catalog_airlines')
      .select('iata_code, name, country, global_alliance, airline_type, logo_url')
      .or(
        `iata_code.eq.${upperCaseQ},` +
        `name.ilike.${likePattern},` +
        `country.ilike.${likePattern},` +
        `global_alliance.ilike.${likePattern}`
      )
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error searching airlines:', error);
    res.status(500).json({ message: 'Error en el servidor al buscar aerolineas.', details: error.message });
  }
};

module.exports = {
  searchAirlines,
};
