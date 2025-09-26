const { supabaseAdmin } = require('../supabase');

const fullReservationSelect = `
  *,
  clients(*),
  advisor:advisor_id(name),
  reservation_segments(*),
  reservation_flights(*, reservation_flight_itineraries(*)),
  reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
  reservation_tours(*),
  reservation_medical_assistances(*),
  reservation_installments(*),
  change_requests(*),
  reservation_passengers(*),
  reservation_attachments(*)
`;

const getAllReservations = async (req, res) => {
  const { userId, userRole, reservation_type } = req.query;
  try {
    let query = supabaseAdmin
      .from('reservations')
      .select(fullReservationSelect);

    if (userRole === 'advisor' && userId) {
      query = query.eq('advisor_id', userId);
    }

    if (reservation_type) {
      query = query.eq('reservation_type', reservation_type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reservations from Supabase:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReservationById = async (req, res) => {
  const { id } = req.params;
  try {
    let { data, error } = await supabaseAdmin
      .from('reservations')
      .select(fullReservationSelect)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reservation from Supabase:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createReservation = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.rpc('create_full_reservation', { 
      payload: req.body 
    });

    if (error) {
      console.error('Error creating reservation via RPC:', error);
      return res.status(500).json({ message: 'Error en la base de datos al crear la reserva', details: error.message });
    }

    // The RPC function handles everything, so we just return success.
    // For a better user experience, we could have the RPC return the new reservation ID
    // and then fetch the full reservation data to send back to the client.
    res.status(201).json({ message: 'Reserva creada con éxito' });

  } catch (error) {
    console.error('Server error in createReservation:', error);
    res.status(500).json({ message: 'Error interno del servidor', details: error.message });
  }
};

const updateReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.rpc('update_full_reservation', { 
      reservation_id_input: id,
      payload: req.body 
    });

    if (error) {
      console.error('Error updating reservation via RPC:', error);
      return res.status(500).json({ message: 'Error en la base de datos al actualizar la reserva', details: error.message });
    }

    res.status(200).json({ message: 'Reserva actualizada con éxito' });

  } catch (error) {
    console.error('Server error in updateReservation:', error);
    res.status(500).json({ message: 'Error interno del servidor', details: error.message });
  }
};

const deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.rpc('delete_full_reservation', { 
      reservation_id_input: id
    });

    if (error) {
      console.error('Error deleting reservation via RPC:', error);
      return res.status(500).json({ message: 'Error en la base de datos al eliminar la reserva', details: error.message });
    }

    res.status(200).json({ message: 'Reserva eliminada con éxito' });

  } catch (error) {
    console.error('Server error in deleteReservation:', error);
    res.status(500).json({ message: 'Error interno del servidor', details: error.message });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
