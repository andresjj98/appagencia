const express = require('express');
const router = express.Router();
const { searchAirlines } = require('../controllers/airlines.controller');

router.get('/search', searchAirlines);

module.exports = router;
