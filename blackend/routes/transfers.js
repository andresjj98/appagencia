const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');
const { ensureReservationAccess } = require('../utils/accessControl');

const handleAccessError = (res, error, fallbackMessage) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
};

// GET - Obtener todos los traslados de una reserva
router.get('/:reservation_id/transfers', authenticateToken, async (req, res) => {
  const { reservation_id } = req.params;
  try {
    await ensureReservationAccess(reservation_id, req.user);

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .select('*')
      .eq('reservation_id', Number(reservation_id))
      .order('segment_id', { ascending: true });

    if (error) {
      console.error('Error fetching transfers:', error);
      return res.status(500).json({ message: 'Error al obtener los traslados', error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    handleAccessError(res, error, 'Error al validar permisos para obtener traslados.');
  }
});

// POST - Crear traslados para una reserva
router.post('/:reservation_id/transfers', authenticateToken, async (req, res) => {
  const { reservation_id } = req.params;
  const { transfers } = req.body;

  try {
    await ensureReservationAccess(reservation_id, req.user);

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).json({ message: 'Se requiere un array de traslados' });
    }

    const reservationId = Number(reservation_id);
    const transfersWithReservation = transfers.map(transfer => ({
      ...transfer,
      reservation_id: reservationId
    }));

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .insert(transfersWithReservation)
      .select();

    if (error) {
      console.error('Error creating transfers:', error);
      return res.status(500).json({ message: 'Error al crear los traslados', error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    handleAccessError(res, error, 'Error al validar permisos para crear traslados.');
  }
});

// PUT - Actualizar un traslado especifico
router.put('/:reservation_id/transfers/:transfer_id', authenticateToken, async (req, res) => {
  const { reservation_id, transfer_id } = req.params;
  const transferData = { ...req.body };

  try {
    await ensureReservationAccess(reservation_id, req.user);

    delete transferData.id;
    delete transferData.reservation_id;
    delete transferData.created_at;
    delete transferData.updated_at;

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .update(transferData)
      .eq('id', Number(transfer_id))
      .select();

    if (error) {
      console.error('Error updating transfer:', error);
      return res.status(500).json({ message: 'Error al actualizar el traslado', error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Traslado no encontrado' });
    }

    res.json(data[0]);
  } catch (error) {
    handleAccessError(res, error, 'Error al validar permisos para actualizar el traslado.');
  }
});

// DELETE - Eliminar un traslado
router.delete('/:reservation_id/transfers/:transfer_id', authenticateToken, async (req, res) => {
  const { reservation_id, transfer_id } = req.params;

  try {
    await ensureReservationAccess(reservation_id, req.user);

    const { error } = await supabaseAdmin
      .from('reservation_transfers')
      .delete()
      .eq('id', Number(transfer_id));

    if (error) {
      console.error('Error deleting transfer:', error);
      return res.status(500).json({ message: 'Error al eliminar el traslado', error: error.message });
    }

    res.json({ message: 'Traslado eliminado exitosamente' });
  } catch (error) {
    handleAccessError(res, error, 'Error al validar permisos para eliminar el traslado.');
  }
});

// PUT - Actualizar todos los traslados de una reserva (upsert)
router.put('/:reservation_id/transfers', authenticateToken, async (req, res) => {
  const { reservation_id } = req.params;
  const { transfers } = req.body;

  try {
    await ensureReservationAccess(reservation_id, req.user);

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).json({ message: 'Se requiere un array de traslados' });
    }

    const reservationId = Number(reservation_id);

    const { error: deleteError } = await supabaseAdmin
      .from('reservation_transfers')
      .delete()
      .eq('reservation_id', reservationId);

    if (deleteError) {
      console.error('Error deleting existing transfers:', deleteError);
      return res.status(500).json({ message: 'Error al limpiar traslados anteriores', error: deleteError.message });
    }

    if (transfers.length === 0) {
      return res.json([]);
    }

    const transfersWithReservation = transfers.map(transfer => {
      const { id, created_at, updated_at, ...cleanTransfer } = transfer;
      return {
        ...cleanTransfer,
        reservation_id: reservationId
      };
    });

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .insert(transfersWithReservation)
      .select();

    if (error) {
      console.error('Error upserting transfers:', error);
      return res.status(500).json({ message: 'Error al actualizar los traslados', error: error.message });
    }

    res.json(data);
  } catch (error) {
    handleAccessError(res, error, 'Error al validar permisos para actualizar los traslados.');
  }
});

module.exports = router;

