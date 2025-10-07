const express = require('express');
const router = express.Router();
const {
  createChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  getPendingChangeRequests,
  getMyChangeRequests,
  getChangeRequestById
} = require('../controllers/changeRequests.controller');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// RUTAS PARA SOLICITUDES DE CAMBIO
// =====================================================

// Crear una nueva solicitud de cambio para una reserva
// POST /api/reservations/:reservationId/change-requests
router.post('/reservations/:reservationId/change-requests', authenticateToken, createChangeRequest);

// Obtener todas las solicitudes pendientes (solo gestores/admins)
// GET /api/change-requests/pending
router.get('/change-requests/pending', authenticateToken, getPendingChangeRequests);

// Obtener mis solicitudes (como asesor)
// GET /api/change-requests/my-requests
router.get('/change-requests/my-requests', authenticateToken, getMyChangeRequests);

// Obtener detalle de una solicitud específica
// GET /api/change-requests/:id
router.get('/change-requests/:id', authenticateToken, getChangeRequestById);

// Aprobar una solicitud de cambio (solo gestores/admins)
// POST /api/change-requests/:id/approve
router.post('/change-requests/:id/approve', authenticateToken, approveChangeRequest);

// Rechazar una solicitud de cambio (solo gestores/admins)
// POST /api/change-requests/:id/reject
router.post('/change-requests/:id/reject', authenticateToken, rejectChangeRequest);

module.exports = router;
