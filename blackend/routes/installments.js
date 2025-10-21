const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadReceipt, updateInstallmentStatus } = require('../controllers/installments.controller');
const { uploadLimiter } = require('../middleware/rateLimiter');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload de comprobantes de pago con rate limiting
router.post('/:installment_id/receipt', uploadLimiter, upload.single('receipt'), uploadReceipt);
router.put('/:installment_id/status', updateInstallmentStatus);

module.exports = router;