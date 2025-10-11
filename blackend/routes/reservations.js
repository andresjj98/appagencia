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
const { authenticateToken } = require('../middleware/auth');

// GET all reservations
router.get('/', getAllReservations);

// GET a single reservation by ID
router.get('/:id', getReservationById);

// GET activities for a reservation
router.get('/:id/activities', getReservationActivities);

// POST a new reservation
router.post('/', authenticateToken, createReservation);

// PUT to update a reservation
router.put('/:id', authenticateToken, updateReservation);

// POST to approve a reservation
router.post('/:id/approve', authenticateToken, approveReservation);

// POST to reject a reservation
router.post('/:id/reject', authenticateToken, rejectReservation);

// POST to confirm a service
router.post('/:id/confirm-service', authenticateToken, confirmService);

// PUT to update passengers for a reservation
router.put('/:id/passengers', authenticateToken, updatePassengers);

// GET passengers for a reservation
router.get('/:id/passengers', getPassengers);

// DELETE a specific passenger
router.delete('/:id/passengers/:passengerId', authenticateToken, deletePassenger);

// DELETE a reservation
router.delete('/:id', authenticateToken, deleteReservation);

module.exports = router;
