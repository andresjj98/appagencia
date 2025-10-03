const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabase');

// GET - Obtener todos los traslados de una reserva
router.get('/:reservation_id/transfers', async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .select('*')
      .eq('reservation_id', reservation_id)
      .order('segment_id', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Error al obtener los traslados', error: error.message });
  }
});

// POST - Crear traslados para una reserva
router.post('/:reservation_id/transfers', async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const { transfers } = req.body;

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).json({ message: 'Se requiere un array de traslados' });
    }

    // Agregar reservation_id a cada traslado
    const transfersWithReservation = transfers.map(transfer => ({
      ...transfer,
      reservation_id
    }));

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .insert(transfersWithReservation)
      .select();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating transfers:', error);
    res.status(500).json({ message: 'Error al crear los traslados', error: error.message });
  }
});

// PUT - Actualizar un traslado específico
router.put('/:reservation_id/transfers/:transfer_id', async (req, res) => {
  try {
    const { transfer_id } = req.params;
    const transferData = req.body;

    // Remover campos que no deben actualizarse
    delete transferData.id;
    delete transferData.reservation_id;
    delete transferData.created_at;
    delete transferData.updated_at;

    const { data, error } = await supabaseAdmin
      .from('reservation_transfers')
      .update(transferData)
      .eq('id', transfer_id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Traslado no encontrado' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating transfer:', error);
    res.status(500).json({ message: 'Error al actualizar el traslado', error: error.message });
  }
});

// DELETE - Eliminar un traslado
router.delete('/:reservation_id/transfers/:transfer_id', async (req, res) => {
  try {
    const { transfer_id } = req.params;

    const { error } = await supabaseAdmin
      .from('reservation_transfers')
      .delete()
      .eq('id', transfer_id);

    if (error) throw error;

    res.json({ message: 'Traslado eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    res.status(500).json({ message: 'Error al eliminar el traslado', error: error.message });
  }
});

// PUT - Actualizar todos los traslados de una reserva (upsert)
router.put('/:reservation_id/transfers', async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const { transfers } = req.body;

    if (!transfers || !Array.isArray(transfers)) {
      return res.status(400).json({ message: 'Se requiere un array de traslados' });
    }

    // Primero, eliminar todos los traslados existentes de esta reserva
    await supabaseAdmin
      .from('reservation_transfers')
      .delete()
      .eq('reservation_id', reservation_id);

    // Luego, insertar los nuevos traslados
    if (transfers.length > 0) {
      const transfersWithReservation = transfers.map(transfer => {
        // Remover id si existe (para evitar conflictos)
        const { id, created_at, updated_at, ...cleanTransfer } = transfer;
        return {
          ...cleanTransfer,
          reservation_id
        };
      });

      const { data, error } = await supabaseAdmin
        .from('reservation_transfers')
        .insert(transfersWithReservation)
        .select();

      if (error) throw error;

      res.json(data);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error upserting transfers:', error);
    res.status(500).json({ message: 'Error al actualizar los traslados', error: error.message });
  }
});

module.exports = router;
