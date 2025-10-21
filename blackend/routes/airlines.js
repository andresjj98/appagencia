const express = require('express');
const router = express.Router();
const { searchAirlines } = require('../controllers/airlines.controller');
const { authenticateToken } = require('../middleware/auth');

// Catálogo de aerolíneas - requiere autenticación
router.get('/search', authenticateToken, searchAirlines);

module.exports = router;
