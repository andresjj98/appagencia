const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadReceipt, updateInstallmentStatus, updateInstallmentDetails } = require('../controllers/installments.controller');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { requireRole } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware de autenticación opcional (no bloquea si no hay token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const decoded = jwt.verify(token, secret);

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        officeId: decoded.officeId
      };
    } catch (error) {
      console.warn('Token inválido, continuando sin autenticación:', error.message);
    }
  }

  next();
};

// Upload de comprobantes de pago con rate limiting
router.post('/:installment_id/receipt', uploadLimiter, upload.single('receipt'), uploadReceipt);

// Actualizar estado de cuota - validación de permisos en el controlador
router.put('/:installment_id/status', optionalAuth, updateInstallmentStatus);

// Actualizar detalles completos de cuota (monto, fecha, etc.) - solo superadmin
router.put('/:installment_id/details', optionalAuth, requireRole('superadmin'), updateInstallmentDetails);

module.exports = router;