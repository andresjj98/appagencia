const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadReceipt,
  updateInstallmentStatus,
  updateInstallmentDetails
} = require('../controllers/installments.controller');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, requireRole } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/:installment_id/receipt',
  authenticateToken,
  uploadLimiter,
  upload.single('receipt'),
  uploadReceipt
);

router.put(
  '/:installment_id/status',
  authenticateToken,
  updateInstallmentStatus
);

router.put(
  '/:installment_id/details',
  authenticateToken,
  requireRole('superadmin'),
  updateInstallmentDetails
);

module.exports = router;

