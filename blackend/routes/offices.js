const express = require('express');
const {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
} = require('../controllers/offices.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Todos los usuarios autenticados pueden ver las oficinas
router.get('/', authenticateToken, getAllOffices);

// Solo administradores pueden crear oficinas
router.post('/', authenticateToken, requireRole('administrador'), createOffice);

// Solo administradores pueden actualizar oficinas
router.put('/:id', authenticateToken, requireRole('administrador'), updateOffice);

// Solo administradores pueden eliminar oficinas
router.delete('/:id', authenticateToken, requireRole('administrador'), deleteOffice);

module.exports = router;
