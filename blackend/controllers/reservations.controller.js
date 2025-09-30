const { supabaseAdmin } = require('../supabase');

const DEFAULT_INVOICE_FORMAT = 'INV-####';
const DEFAULT_NEXT_INVOICE_NUMBER = 1001;

const resolveInvoiceSequence = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_NEXT_INVOICE_NUMBER;
  }
  return Math.floor(numericValue);
};

const formatInvoiceNumber = (pattern, sequenceNumber) => {
  const safeSequence = resolveInvoiceSequence(sequenceNumber);
  const rawPattern = typeof pattern === 'string' && pattern.trim().length > 0
    ? pattern.trim()
    : DEFAULT_INVOICE_FORMAT;

  if (!rawPattern.includes('#')) {
    return `${rawPattern}${safeSequence}`;
  }

  return rawPattern.replace(/#+/g, (match) => String(safeSequence).padStart(match.length, '0'));
};

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


const approveReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, invoice_number, status')
      .eq('id', id)
      .single();

    if (reservationError) {
      console.error('Error fetching reservation for approval:', reservationError);
      return res.status(500).json({ message: 'Error al obtener la reserva para aprobación.' });
    }

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    if (reservation.invoice_number) {
      return res.status(400).json({ message: 'La reserva ya tiene un número de factura asignado.' });
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('id, next_invoice_number, invoice_format')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching business settings for approval:', settingsError);
      return res.status(500).json({ message: 'Error al obtener la configuración de facturación.' });
    }

    const currentSequence = resolveInvoiceSequence(settings?.next_invoice_number);
    const invoiceFormat = settings?.invoice_format;
    const invoiceNumber = formatInvoiceNumber(invoiceFormat, currentSequence);
    const nextSequence = currentSequence + 1;

    const settingsId = settings?.id || null;
    let rollbackInfo = null;

    const updateSequence = async () => {
      if (settingsId) {
        let updateQuery = supabaseAdmin
          .from('business_settings')
          .update({ next_invoice_number: nextSequence })
          .eq('id', settingsId);

        if (settings?.next_invoice_number !== null && settings?.next_invoice_number !== undefined) {
          const numericPrev = Number(settings.next_invoice_number);
          if (Number.isFinite(numericPrev)) {
            updateQuery = updateQuery.eq('next_invoice_number', settings.next_invoice_number);
          }
        }

        const { data: updatedSettings, error: updateError } = await updateQuery.select('id').maybeSingle();

        if (updateError || !updatedSettings) {
          const statusCode = updateError ? 500 : 409;
          const errorMessage = updateError ? 'No se pudo actualizar el consecutivo de facturas.' : 'El consecutivo de facturas ha cambiado. Inténtalo nuevamente.';
          const err = new Error(errorMessage);
          err.statusCode = statusCode;
          err.cause = updateError;
          throw err;
        }

        rollbackInfo = { id: settingsId, previousValue: settings?.next_invoice_number ?? currentSequence };
      } else {
        const { data: insertedSettings, error: insertError } = await supabaseAdmin
          .from('business_settings')
          .insert({ next_invoice_number: nextSequence, invoice_format: invoiceFormat ?? DEFAULT_INVOICE_FORMAT })
          .select('id')
          .single();

        if (insertError || !insertedSettings) {
          const err = new Error('No se pudo inicializar la configuración de facturación.');
          err.statusCode = 500;
          err.cause = insertError;
          throw err;
        }

        rollbackInfo = { id: insertedSettings.id, previousValue: currentSequence };
      }
    };

    try {
      await updateSequence();
    } catch (seqError) {
      console.error('Error updating invoice sequence:', seqError.cause || seqError);
      return res.status(seqError.statusCode || 500).json({ message: seqError.message });
    }

    const reservationUpdatePayload = {
      invoice_number: invoiceNumber,
      status: 'confirmed',
    };


    const { data: updatedReservation, error: updateReservationError } = await supabaseAdmin
      .from('reservations')
      .update(reservationUpdatePayload)
      .eq('id', id)
      .select(fullReservationSelect)
      .maybeSingle();

    if (updateReservationError || !updatedReservation) {
      console.error('Error approving reservation:', updateReservationError);
      if (rollbackInfo?.id) {
        await supabaseAdmin
          .from('business_settings')
          .update({ next_invoice_number: rollbackInfo.previousValue })
          .eq('id', rollbackInfo.id);
      }
      return res.status(500).json({ message: 'Error al actualizar la reserva durante la aprobación.' });
    }

    return res.json({
      message: 'Reserva aprobada correctamente.',
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error('Unexpected error approving reservation:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
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
  approveReservation,
  deleteReservation,
};
