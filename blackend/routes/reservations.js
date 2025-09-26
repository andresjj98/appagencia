const express = require('express');
const router = express.Router();
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservations.controller.js');

// GET all reservations
router.get('/', getAllReservations);

// GET a single reservation by ID
router.get('/:id', getReservationById);

// POST a new reservation
router.post('/', createReservation);

// PUT to update a reservation
router.put('/:id', updateReservation);

// DELETE a reservation
router.delete('/:id', deleteReservation);

module.exports = router;
