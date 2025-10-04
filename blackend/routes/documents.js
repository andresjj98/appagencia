const express = require('express');
const router = express.Router();
const {
  getAllDocuments,
  getDocumentById,
  createDocument,
  getDocumentsByReservation,
  deleteDocument
} = require('../controllers/documents.controller');

// GET all documents (con filtros)
router.get('/', getAllDocuments);

// GET a single document by ID
router.get('/:id', getDocumentById);

// GET documents by reservation ID
router.get('/reservation/:reservation_id', getDocumentsByReservation);

// POST a new document
router.post('/', createDocument);

// DELETE a document
router.delete('/:id', deleteDocument);

module.exports = router;
