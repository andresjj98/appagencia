const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadReceipt, updateInstallmentStatus } = require('../controllers/installments.controller');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/:installment_id/receipt', upload.single('receipt'), uploadReceipt);
router.put('/:installment_id/status', updateInstallmentStatus);

module.exports = router;