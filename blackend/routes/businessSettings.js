const express = require('express');
const multer = require('multer');
const {
  getBusinessSettings,
  upsertBusinessSettings,
  uploadLogo,
  deleteLogo,
} = require('../controllers/businessSettings.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getBusinessSettings);
router.put('/', upsertBusinessSettings);
router.put('/logo/:type', upload.single('logo'), uploadLogo);
router.delete('/logo/:type', deleteLogo);

module.exports = router;
