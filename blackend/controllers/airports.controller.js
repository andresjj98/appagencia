const { supabaseAdmin } = require('../supabase');

const getAllAirports = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('catalog_airports').select('*');
        if (error) {
            console.error('Supabase error fetching airports:', error);
            return res.status(500).json({ 
                message: 'Error fetching airports from database.', 
                details: error.message,
                code: error.code,
                hint: error.hint,
            });
        }
        res.json(data);
    } catch (error) {
        console.error('Unexpected error in getAllAirports:', error);
        res.status(500).json({ message: 'Unexpected server error while fetching airports', details: error.message });
    }
};

const searchAirports = async (req, res) => {
    try {
        const query = req.query.q;

        if (!query || query.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = query.trim().toLowerCase();

        // Search in multiple fields: airport_name, city, country, iata_code
        const { data, error } = await supabaseAdmin
            .from('catalog_airports')
            .select('*')
            .or(`airport_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,iata_code.ilike.%${searchTerm}%`)
            .limit(10);

        if (error) {
            console.error('Supabase error searching airports:', error);
            return res.status(500).json({
                message: 'Error searching airports from database.',
                details: error.message
            });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Unexpected error in searchAirports:', error);
        res.status(500).json({
            message: 'Unexpected server error while searching airports',
            details: error.message
        });
    }
};

module.exports = { 
    getAllAirports,
    searchAirports,
};