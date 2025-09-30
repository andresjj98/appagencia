const express = require('express');
const {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  updateOfficeUsers,
} = require('../controllers/offices.controller');

const router = express.Router();

router.get('/', getAllOffices);
router.post('/', createOffice);
router.put('/:id', updateOffice);
router.delete('/:id', deleteOffice);
router.put('/:id/usuarios', updateOfficeUsers);

module.exports = router;
