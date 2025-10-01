const express = require('express');
const router = express.Router();
const { searchAirports, getAllAirports } = require('../controllers/airports.controller');

router.get('/', getAllAirports);
router.get('/search', searchAirports);

module.exports = router;