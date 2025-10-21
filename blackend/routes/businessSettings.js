const express = require('express');
const multer = require('multer');
const {
  getBusinessSettings,
  upsertBusinessSettings,
  uploadLogo,
  deleteLogo,
} = require('../controllers/businessSettings.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todos los usuarios autenticados pueden ver la configuración
router.get('/', authenticateToken, getBusinessSettings);

// Solo administradores pueden modificar la configuración
router.put('/', authenticateToken, requireRole('administrador'), upsertBusinessSettings);

// Solo administradores pueden subir/eliminar logos (con rate limiting)
router.put('/logo/:type', uploadLimiter, authenticateToken, requireRole('administrador'), upload.single('logo'), uploadLogo);
router.delete('/logo/:type', authenticateToken, requireRole('administrador'), deleteLogo);

module.exports = router;
