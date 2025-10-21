const express = require('express');
const router = express.Router();
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  approveReservation,
  rejectReservation,
  deleteReservation,
  getReservationActivities,
  confirmService,
  updatePassengers,
  getPassengers,
  deletePassenger
} = require('../controllers/reservations.controller.js');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all reservations - requiere autenticación (el filtro por rol se hace en el controlador)
router.get('/', authenticateToken, getAllReservations);

// GET a single reservation by ID - requiere autenticación
router.get('/:id', authenticateToken, getReservationById);

// GET activities for a reservation - requiere autenticación
router.get('/:id/activities', authenticateToken, getReservationActivities);

// POST a new reservation
router.post('/', authenticateToken, createReservation);

// PUT to update a reservation
router.put('/:id', authenticateToken, updateReservation);

// POST to approve a reservation - solo administradores y gestores
router.post('/:id/approve', authenticateToken, requireRole('administrador', 'gestor'), approveReservation);

// POST to reject a reservation - solo administradores y gestores
router.post('/:id/reject', authenticateToken, requireRole('administrador', 'gestor'), rejectReservation);

// POST to confirm a service - solo administradores y gestores
router.post('/:id/confirm-service', authenticateToken, requireRole('administrador', 'gestor'), confirmService);

// PUT to update passengers for a reservation
router.put('/:id/passengers', authenticateToken, updatePassengers);

// GET passengers for a reservation - requiere autenticación
router.get('/:id/passengers', authenticateToken, getPassengers);

// DELETE a specific passenger
router.delete('/:id/passengers/:passengerId', authenticateToken, deletePassenger);

// DELETE a reservation - administradores pueden eliminar cualquiera, otros usuarios solo sus propias reservas no aprobadas
router.delete('/:id', authenticateToken, deleteReservation);

module.exports = router;
