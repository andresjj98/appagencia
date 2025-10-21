const express = require('express');
const router = express.Router();
const { searchAirports, getAllAirports } = require('../controllers/airports.controller');
const { authenticateToken } = require('../middleware/auth');

// Catálogo de aeropuertos - requiere autenticación
router.get('/', authenticateToken, getAllAirports);
router.get('/search', authenticateToken, searchAirports);

module.exports = router;