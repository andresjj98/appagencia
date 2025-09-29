const express = require('express');
const router = express.Router();
const { searchAirports } = require('../controllers/airports.controller');

// @route   GET /api/airports/search
// @desc    Search for airports by IATA, name, city, or country
// @access  Public (or protected if you add auth middleware)
router.get('/search', searchAirports);

module.exports = router;
