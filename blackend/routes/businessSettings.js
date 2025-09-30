const express = require('express');
const {
  getBusinessSettings,
  upsertBusinessSettings,
} = require('../controllers/businessSettings.controller');

const router = express.Router();

router.get('/', getBusinessSettings);
router.put('/', upsertBusinessSettings);

module.exports = router;
