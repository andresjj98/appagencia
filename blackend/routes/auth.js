const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller.js');
const { loginLimiter } = require('../middleware/rateLimiter');

// Ruta de login con rate limiting
// Límite: 5 intentos por 15 minutos
router.post('/login', loginLimiter, login);

module.exports = router;
