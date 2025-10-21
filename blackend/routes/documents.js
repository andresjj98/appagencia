const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllDocuments,
  getDocumentById,
  createDocument,
  getDocumentsByReservation,
  deleteDocument
} = require('../controllers/documents.controller');

// GET all documents (con filtros) - requiere autenticación
router.get('/', authenticateToken, getAllDocuments);

// GET a single document by ID - requiere autenticación
router.get('/:id', authenticateToken, getDocumentById);

// GET documents by reservation ID - requiere autenticación
router.get('/reservation/:reservation_id', authenticateToken, getDocumentsByReservation);

// POST a new document - requiere autenticación
router.post('/', authenticateToken, createDocument);

// DELETE a document - solo administradores y gestores
router.delete('/:id', authenticateToken, requireRole('administrador', 'gestor'), deleteDocument);

module.exports = router;
