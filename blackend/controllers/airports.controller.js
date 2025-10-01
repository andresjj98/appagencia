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
    // This is a placeholder to avoid crashing the server.
    // The original search logic should be restored here.
    res.json([]);
};

module.exports = { 
    getAllAirports,
    searchAirports,
};