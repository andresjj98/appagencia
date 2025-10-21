const { supabaseAdmin } = require('../supabase');

// =====================================================
// CREAR SOLICITUD DE CAMBIO
// =====================================================
const createChangeRequest = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { section, changes, reason } = req.body;
    const userId = req.user.id;

    // Validar que la reserva existe y está confirmada
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id, status, advisor_id')
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar que el usuario es el asesor de la reserva
    if (reservation.advisor_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar esta reserva' });
    }

    // Para cancelaciones, validar que exista la carta
    if (section === 'cancellation') {
      if (!changes.cancellation_reason || changes.cancellation_reason.trim().length < 20) {
        return res.status(400).json({ error: 'El motivo de cancelación debe tener al menos 20 caracteres' });
      }
      if (!changes.cancellation_letter) {
        return res.status(400).json({ error: 'Debe subir la carta de cancelación firmada' });
      }
    }

    // Crear la solicitud de cambio
    const { data: changeRequest, error: createError } = await supabaseAdmin
      .from('change_requests')
      .insert({
        reservation_id: reservationId,
        requested_by_id: userId,
        section_to_change: section,
        requested_changes: changes,
        request_reason: reason || changes.cancellation_reason || '',
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating change request:', createError);
      return res.status(500).json({ error: 'Error al crear la solicitud de cambio' });
    }

    // Si es una cancelación con documento, guardar el documento
    if (section === 'cancellation' && changes.cancellation_letter) {
      const { error: docError } = await supabaseAdmin
        .from('change_request_documents')
        .insert({
          change_request_id: changeRequest.id,
          document_type: 'cancellation_letter',
          file_name: changes.cancellation_letter.file_name,
          file_url: changes.cancellation_letter.file_url,
          file_size: changes.cancellation_letter.file_size,
          uploaded_by_id: userId
        });

      if (docError) {
        console.error('Error saving document:', docError);
        // No fallar la solicitud si hay error al guardar el documento
      }
    }

    // Crear notificación para gestores/administradores
    const { data: managers } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .in('role', ['gestor', 'administrador'])
      .eq('active', true);

    // Obtener invoice_number de la reserva
    const { data: reservationData } = await supabaseAdmin
      .from('reservations')
      .select('invoice_number')
      .eq('id', reservationId)
      .single();

    if (managers && managers.length > 0) {
      const notifications = managers.map(manager => ({
        recipient_id: manager.id,
        sender_id: userId,
        type: section === 'cancellation' ? 'cancellation_request' : 'change_request',
        title: section === 'cancellation' ? '🚫 Solicitud de Cancelación' : '📝 Solicitud de Cambio',
        message: section === 'cancellation'
          ? `Nueva solicitud de cancelación de reserva #${reservationData?.invoice_number || reservationId}`
          : `Nueva solicitud de cambio en reserva #${reservationData?.invoice_number || reservationId} - Sección: ${section}`,
        reference_id: changeRequest.id,
        reference_type: 'change_request',
        metadata: {
          reservation_id: reservationId,
          invoice_number: reservationData?.invoice_number,
          change_request_id: changeRequest.id,
          section: section
        }
      }));

      await supabaseAdmin.from('notifications').insert(notifications);
    }

    // Registrar en el historial de actividades
    await supabaseAdmin.rpc('log_reservation_activity', {
      p_reservation_id: reservationId,
      p_activity_type: 'change_request_created',
      p_performed_by_id: userId,
      p_description: section === 'cancellation'
        ? 'Solicitud de cancelación creada'
        : `Solicitud de cambio creada para la sección: ${section}`,
      p_metadata: {
        change_request_id: changeRequest.id,
        section: section,
        status: 'pending'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de cambio creada exitosamente',
      changeRequest
    });

  } catch (error) {
    console.error('Error in createChangeRequest:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// =====================================================
// APROBAR SOLICITUD DE CAMBIO
// =====================================================
const approveChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['gestor', 'administrador'].includes(userRole)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { data: changeRequest, error: fetchError } = await supabaseAdmin
      .from('change_requests')
      .select('*, reservations(id, client_id, status, advisor_id, invoice_number)')
      .eq('id', id)
      .single();

    if (fetchError || !changeRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }

    const reservation = changeRequest.reservations;
    if (!reservation) {
      return res.status(400).json({ error: 'No se pudo cargar la reserva asociada a la solicitud de cambio.' });
    }

    const reservationId = changeRequest.reservation_id;
    const section = changeRequest.section_to_change;
    const changes = changeRequest.requested_changes ?? {};

    const ensureSuccess = (error, message) => {
      if (error) {
        console.error(message, error);
        throw new Error(message);
      }
    };

    const normalizeString = (value) => {
      if (value === undefined || value === null) return null;
      const trimmed = String(value).trim();
      return trimmed.length ? trimmed : null;
    };

    const normalizeNumber = (value, { allowNull = true } = {}) => {
      if (value === undefined || value === null || value === '') {
        return allowNull ? null : 0;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return allowNull ? null : 0;
      }
      return numeric;
    };

    const normalizeInt = (value, { allowNull = true, defaultValue = 0 } = {}) => {
      if (value === undefined || value === null || value === '') {
        return allowNull ? null : defaultValue;
      }
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) {
        return allowNull ? null : defaultValue;
      }
      return parsed;
    };

    if (section === 'cancellation') {
      const { error: cancelError } = await supabaseAdmin
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by_id: userId
        })
        .eq('id', reservationId);
      ensureSuccess(cancelError, 'No se pudo cancelar la reserva');
    } else if (section === 'client') {
      if (!reservation.client_id) {
        return res.status(400).json({ error: 'La reserva no tiene un cliente asociado para actualizar.' });
      }

      const allowedFields = [
        'name',
        'id_card',
        'email',
        'phone',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone'
      ];
      const clientPayload = {};
      for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(changes, field)) {
          if (field === 'email') {
            const normalizedEmail = normalizeString(changes[field]);
            clientPayload[field] = normalizedEmail ? normalizedEmail.toLowerCase() : null;
          } else {
            clientPayload[field] = normalizeString(changes[field]);
          }
        }
      }

      if (Object.keys(clientPayload).length === 0) {
        return res.status(400).json({ error: 'No hay cambios de cliente para aplicar.' });
      }

      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .update(clientPayload)
        .eq('id', reservation.client_id);
      ensureSuccess(clientError, 'No se pudo actualizar la informacion del cliente');
    } else if (section === 'passengers') {
      const passengerKeys = ['passengers_adt', 'passengers_chd', 'passengers_inf'];
      const passengerPayload = {};
      for (const key of passengerKeys) {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          passengerPayload[key] = normalizeInt(changes[key], { allowNull: false, defaultValue: 0 });
        }
      }

      if (Object.keys(passengerPayload).length === 0) {
        return res.status(400).json({ error: 'No hay cambios de pasajeros para aplicar.' });
      }

      const { error: passengersError } = await supabaseAdmin
        .from('reservations')
        .update(passengerPayload)
        .eq('id', reservationId);
      ensureSuccess(passengersError, 'No se pudo actualizar la cantidad de pasajeros');
    } else if (section === 'itinerary') {
      if (!Array.isArray(changes)) {
        return res.status(400).json({ error: 'Los cambios del itinerario deben ser una lista.' });
      }

      const { data: existingSegments, error: segmentsError } = await supabaseAdmin
        .from('reservation_segments')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(segmentsError, 'No se pudieron obtener los segmentos actuales');

      const incomingSegmentIds = new Set();

      for (const segment of changes) {
        const segmentPayload = {
          origin: normalizeString(segment.origin),
          destination: normalizeString(segment.destination),
          departure_date: segment.departure_date || null,
          return_date: segment.return_date || null
        };

        if (segment.id) {
          incomingSegmentIds.add(segment.id);
          const { error } = await supabaseAdmin
            .from('reservation_segments')
            .update(segmentPayload)
            .eq('id', segment.id)
            .eq('reservation_id', reservationId);
          ensureSuccess(error, 'No se pudo actualizar el segmento del itinerario');
        } else {
          const { data: insertedSegment, error } = await supabaseAdmin
            .from('reservation_segments')
            .insert({
              reservation_id: reservationId,
              ...segmentPayload
            })
            .select('id')
            .single();
          ensureSuccess(error, 'No se pudo crear el segmento del itinerario');
          if (insertedSegment?.id) {
            incomingSegmentIds.add(insertedSegment.id);
          }
        }
      }

      const segmentsToDelete = (existingSegments || []).filter((segment) => !incomingSegmentIds.has(segment.id));
      if (segmentsToDelete.length > 0) {
        const idsToDelete = segmentsToDelete.map((segment) => segment.id);

        const { error: transfersDeleteError } = await supabaseAdmin
          .from('reservation_transfers')
          .delete()
          .in('segment_id', idsToDelete);
        ensureSuccess(transfersDeleteError, 'No se pudieron eliminar los traslados asociados al segmento');

        const { error: deleteSegmentsError } = await supabaseAdmin
          .from('reservation_segments')
          .delete()
          .in('id', idsToDelete);
        ensureSuccess(deleteSegmentsError, 'No se pudieron eliminar los segmentos antiguos');
      }
    } else if (section === 'flights') {
      if (!Array.isArray(changes)) {
        return res.status(400).json({ error: 'Los cambios de vuelos deben ser una lista.' });
      }

      const { data: existingFlights, error: flightsError } = await supabaseAdmin
        .from('reservation_flights')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(flightsError, 'No se pudieron obtener los vuelos actuales');

      const incomingFlightIds = new Set();

      for (const flight of changes) {
        const flightPayload = {
          airline: normalizeString(flight.airline),
          flight_category: normalizeString(flight.flight_category),
          baggage_allowance: normalizeString(flight.baggage_allowance),
          flight_cycle: normalizeString(flight.flight_cycle),
          pnr: normalizeString(flight.pnr)
        };

        let flightId = flight.id || null;

        if (flightId) {
          const { error } = await supabaseAdmin
            .from('reservation_flights')
            .update(flightPayload)
            .eq('id', flightId)
            .eq('reservation_id', reservationId);
          ensureSuccess(error, 'No se pudo actualizar el vuelo');
        } else {
          const { data: insertedFlight, error } = await supabaseAdmin
            .from('reservation_flights')
            .insert({
              reservation_id: reservationId,
              ...flightPayload
            })
            .select('id')
            .single();
          ensureSuccess(error, 'No se pudo crear el vuelo');
          flightId = insertedFlight?.id || null;
        }

        if (flightId) {
          incomingFlightIds.add(flightId);

          const itineraries = Array.isArray(flight.reservation_flight_itineraries)
            ? flight.reservation_flight_itineraries
            : [];

          const { data: existingItineraries, error: itinerariesError } = await supabaseAdmin
            .from('reservation_flight_itineraries')
            .select('id')
            .eq('flight_id', flightId);
          ensureSuccess(itinerariesError, 'No se pudieron obtener los itinerarios del vuelo');

          const incomingItineraryIds = new Set();

          for (const itinerary of itineraries) {
            const itineraryPayload = {
              flight_number: normalizeString(itinerary.flight_number),
              departure_time: itinerary.departure_time || null,
              arrival_time: itinerary.arrival_time || null
            };

            let itineraryId = itinerary.id || null;

            if (itineraryId) {
              const { error } = await supabaseAdmin
                .from('reservation_flight_itineraries')
                .update(itineraryPayload)
                .eq('id', itineraryId)
                .eq('flight_id', flightId);
              ensureSuccess(error, 'No se pudo actualizar el itinerario del vuelo');
            } else {
              const { data: insertedItinerary, error } = await supabaseAdmin
                .from('reservation_flight_itineraries')
                .insert({
                  flight_id: flightId,
                  ...itineraryPayload
                })
                .select('id')
                .single();
              ensureSuccess(error, 'No se pudo crear el itinerario del vuelo');
              itineraryId = insertedItinerary?.id || null;
            }

            if (itineraryId) {
              incomingItineraryIds.add(itineraryId);
            }
          }

          const itinerariesToDelete = (existingItineraries || []).filter(
            (itinerary) => !incomingItineraryIds.has(itinerary.id)
          );
          if (itinerariesToDelete.length > 0) {
            const idsToDelete = itinerariesToDelete.map((itinerary) => itinerary.id);
            const { error: deleteItinerariesError } = await supabaseAdmin
              .from('reservation_flight_itineraries')
              .delete()
              .in('id', idsToDelete);
            ensureSuccess(deleteItinerariesError, 'No se pudieron eliminar los itinerarios antiguos');
          }
        }
      }

      const flightsToDelete = (existingFlights || []).filter((flight) => !incomingFlightIds.has(flight.id));
      if (flightsToDelete.length > 0) {
        const flightIdsToDelete = flightsToDelete.map((flight) => flight.id);

        const { error: deleteItinerariesError } = await supabaseAdmin
          .from('reservation_flight_itineraries')
          .delete()
          .in('flight_id', flightIdsToDelete);
        ensureSuccess(deleteItinerariesError, 'No se pudieron eliminar los itinerarios de los vuelos antiguos');

        const { error: deleteFlightsError } = await supabaseAdmin
          .from('reservation_flights')
          .delete()
          .in('id', flightIdsToDelete);
        ensureSuccess(deleteFlightsError, 'No se pudieron eliminar los vuelos antiguos');
      }
    } else if (section === 'hotels') {
      if (!Array.isArray(changes)) {
        return res.status(400).json({ error: 'Los cambios de hoteles deben ser una lista.' });
      }

      const { data: existingHotels, error: hotelsError } = await supabaseAdmin
        .from('reservation_hotels')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(hotelsError, 'No se pudieron obtener los hoteles actuales');

      const incomingHotelIds = new Set();

      for (const hotel of changes) {
        const hotelPayload = {
          name: normalizeString(hotel.name),
          room_category: normalizeString(hotel.room_category),
          meal_plan: normalizeString(hotel.meal_plan)
        };

        let hotelId = hotel.id || null;

        if (hotelId) {
          const { error } = await supabaseAdmin
            .from('reservation_hotels')
            .update(hotelPayload)
            .eq('id', hotelId)
            .eq('reservation_id', reservationId);
          ensureSuccess(error, 'No se pudo actualizar el hotel');
        } else {
          const { data: insertedHotel, error } = await supabaseAdmin
            .from('reservation_hotels')
            .insert({
              reservation_id: reservationId,
              ...hotelPayload
            })
            .select('id')
            .single();
          ensureSuccess(error, 'No se pudo crear el hotel');
          hotelId = insertedHotel?.id || null;
        }

        if (hotelId) {
          incomingHotelIds.add(hotelId);

          const accommodations = Array.isArray(hotel.reservation_hotel_accommodations)
            ? hotel.reservation_hotel_accommodations
            : [];

          const { data: existingAccommodations, error: accommodationsError } = await supabaseAdmin
            .from('reservation_hotel_accommodations')
            .select('id')
            .eq('hotel_id', hotelId);
          ensureSuccess(accommodationsError, 'No se pudieron obtener las acomodaciones del hotel');

          const incomingAccommodationIds = new Set();

          for (const accommodation of accommodations) {
            const accommodationPayload = {
              rooms: normalizeInt(accommodation.rooms, { allowNull: false, defaultValue: 0 }),
              adt: normalizeInt(accommodation.adt, { allowNull: false, defaultValue: 0 }),
              chd: normalizeInt(accommodation.chd, { allowNull: false, defaultValue: 0 }),
              inf: normalizeInt(accommodation.inf, { allowNull: false, defaultValue: 0 })
            };

            let accommodationId = accommodation.id || null;

            if (accommodationId) {
              const { error } = await supabaseAdmin
                .from('reservation_hotel_accommodations')
                .update(accommodationPayload)
                .eq('id', accommodationId)
                .eq('hotel_id', hotelId);
              ensureSuccess(error, 'No se pudo actualizar la acomodacion del hotel');
            } else {
              const { data: insertedAccommodation, error } = await supabaseAdmin
                .from('reservation_hotel_accommodations')
                .insert({
                  hotel_id: hotelId,
                  ...accommodationPayload
                })
                .select('id')
                .single();
              ensureSuccess(error, 'No se pudo crear la acomodacion del hotel');
              accommodationId = insertedAccommodation?.id || null;
            }

            if (accommodationId) {
              incomingAccommodationIds.add(accommodationId);
            }
          }

          const accommodationsToDelete = (existingAccommodations || []).filter(
            (accommodation) => !incomingAccommodationIds.has(accommodation.id)
          );
          if (accommodationsToDelete.length > 0) {
            const idsToDelete = accommodationsToDelete.map((accommodation) => accommodation.id);
            const { error: deleteAccommodationError } = await supabaseAdmin
              .from('reservation_hotel_accommodations')
              .delete()
              .in('id', idsToDelete);
            ensureSuccess(deleteAccommodationError, 'No se pudieron eliminar las acomodaciones antiguas');
          }

          const inclusions = Array.isArray(hotel.reservation_hotel_inclusions)
            ? hotel.reservation_hotel_inclusions
            : [];

          const { data: existingInclusions, error: inclusionsError } = await supabaseAdmin
            .from('reservation_hotel_inclusions')
            .select('id')
            .eq('hotel_id', hotelId);
          ensureSuccess(inclusionsError, 'No se pudieron obtener las inclusiones del hotel');

          const incomingInclusionIds = new Set();

          for (const inclusion of inclusions) {
            const inclusionPayload = {
              inclusion: normalizeString(inclusion.inclusion)
            };

            let inclusionId = inclusion.id || null;

            if (inclusionId) {
              const { error } = await supabaseAdmin
                .from('reservation_hotel_inclusions')
                .update(inclusionPayload)
                .eq('id', inclusionId)
                .eq('hotel_id', hotelId);
              ensureSuccess(error, 'No se pudo actualizar la inclusion del hotel');
            } else {
              const { data: insertedInclusion, error } = await supabaseAdmin
                .from('reservation_hotel_inclusions')
                .insert({
                  hotel_id: hotelId,
                  ...inclusionPayload
                })
                .select('id')
                .single();
              ensureSuccess(error, 'No se pudo crear la inclusion del hotel');
              inclusionId = insertedInclusion?.id || null;
            }

            if (inclusionId) {
              incomingInclusionIds.add(inclusionId);
            }
          }

          const inclusionsToDelete = (existingInclusions || []).filter(
            (inclusion) => !incomingInclusionIds.has(inclusion.id)
          );
          if (inclusionsToDelete.length > 0) {
            const idsToDelete = inclusionsToDelete.map((inclusion) => inclusion.id);
            const { error: deleteInclusionsError } = await supabaseAdmin
              .from('reservation_hotel_inclusions')
              .delete()
              .in('id', idsToDelete);
            ensureSuccess(deleteInclusionsError, 'No se pudieron eliminar las inclusiones antiguas');
          }
        }
      }

      const hotelsToDelete = (existingHotels || []).filter((hotel) => !incomingHotelIds.has(hotel.id));
      if (hotelsToDelete.length > 0) {
        const hotelIdsToDelete = hotelsToDelete.map((hotel) => hotel.id);

        const { error: deleteAccommodationsError } = await supabaseAdmin
          .from('reservation_hotel_accommodations')
          .delete()
          .in('hotel_id', hotelIdsToDelete);
        ensureSuccess(deleteAccommodationsError, 'No se pudieron eliminar las acomodaciones de los hoteles antiguos');

        const { error: deleteInclusionsError } = await supabaseAdmin
          .from('reservation_hotel_inclusions')
          .delete()
          .in('hotel_id', hotelIdsToDelete);
        ensureSuccess(deleteInclusionsError, 'No se pudieron eliminar las inclusiones de los hoteles antiguos');

        const { error: deleteHotelsError } = await supabaseAdmin
          .from('reservation_hotels')
          .delete()
          .in('id', hotelIdsToDelete);
        ensureSuccess(deleteHotelsError, 'No se pudieron eliminar los hoteles antiguos');
      }
    } else if (section === 'tours') {
      if (!Array.isArray(changes)) {
        return res.status(400).json({ error: 'Los cambios de tours deben ser una lista.' });
      }

      const { data: existingTours, error: toursError } = await supabaseAdmin
        .from('reservation_tours')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(toursError, 'No se pudieron obtener los tours actuales');

      const incomingTourIds = new Set();

      for (const tour of changes) {
        const tourPayload = {
          name: normalizeString(tour.name),
          date: tour.date || null,
          cost: normalizeNumber(tour.cost, { allowNull: false })
        };

        let tourId = tour.id || null;

        if (tourId) {
          const { error } = await supabaseAdmin
            .from('reservation_tours')
            .update(tourPayload)
            .eq('id', tourId)
            .eq('reservation_id', reservationId);
          ensureSuccess(error, 'No se pudo actualizar el tour');
        } else {
          const { data: insertedTour, error } = await supabaseAdmin
            .from('reservation_tours')
            .insert({
              reservation_id: reservationId,
              ...tourPayload
            })
            .select('id')
            .single();
          ensureSuccess(error, 'No se pudo crear el tour');
          tourId = insertedTour?.id || null;
        }

        if (tourId) {
          incomingTourIds.add(tourId);
        }
      }

      const toursToDelete = (existingTours || []).filter((tour) => !incomingTourIds.has(tour.id));
      if (toursToDelete.length > 0) {
        const idsToDelete = toursToDelete.map((tour) => tour.id);
        const { error: deleteToursError } = await supabaseAdmin
          .from('reservation_tours')
          .delete()
          .in('id', idsToDelete);
        ensureSuccess(deleteToursError, 'No se pudieron eliminar los tours antiguos');
      }
    } else if (section === 'medicalAssistances') {
      if (!Array.isArray(changes)) {
        return res.status(400).json({ error: 'Los cambios de asistencias medicas deben ser una lista.' });
      }

      const { data: existingAssistances, error: assistancesError } = await supabaseAdmin
        .from('reservation_medical_assistances')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(assistancesError, 'No se pudieron obtener las asistencias medicas actuales');

      const incomingAssistanceIds = new Set();

      for (const assistance of changes) {
        const assistancePayload = {
          plan_type: normalizeString(assistance.plan_type),
          start_date: assistance.start_date || null,
          end_date: assistance.end_date || null
        };

        let assistanceId = assistance.id || null;

        if (assistanceId) {
          const { error } = await supabaseAdmin
            .from('reservation_medical_assistances')
            .update(assistancePayload)
            .eq('id', assistanceId)
            .eq('reservation_id', reservationId);
          ensureSuccess(error, 'No se pudo actualizar la asistencia medica');
        } else {
          const { data: insertedAssistance, error } = await supabaseAdmin
            .from('reservation_medical_assistances')
            .insert({
              reservation_id: reservationId,
              ...assistancePayload
            })
            .select('id')
            .single();
          ensureSuccess(error, 'No se pudo crear la asistencia medica');
          assistanceId = insertedAssistance?.id || null;
        }

        if (assistanceId) {
          incomingAssistanceIds.add(assistanceId);
        }
      }

      const assistancesToDelete = (existingAssistances || []).filter(
        (assistance) => !incomingAssistanceIds.has(assistance.id)
      );
      if (assistancesToDelete.length > 0) {
        const idsToDelete = assistancesToDelete.map((assistance) => assistance.id);
        const { error: deleteAssistancesError } = await supabaseAdmin
          .from('reservation_medical_assistances')
          .delete()
          .in('id', idsToDelete);
        ensureSuccess(deleteAssistancesError, 'No se pudieron eliminar las asistencias medicas antiguas');
      }
    } else if (section === 'payment') {
      const paymentPayload = {};

      ['price_per_adt', 'price_per_chd', 'price_per_inf', 'total_amount'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          paymentPayload[key] = normalizeNumber(changes[key], { allowNull: false });
        }
      });

      if (Object.prototype.hasOwnProperty.call(changes, 'payment_option')) {
        paymentPayload.payment_option = normalizeString(changes.payment_option);
      }

      if (Object.keys(paymentPayload).length > 0) {
        const { error: paymentError } = await supabaseAdmin
          .from('reservations')
          .update(paymentPayload)
          .eq('id', reservationId);
        ensureSuccess(paymentError, 'No se pudo actualizar la informacion de pago');
      }

      if (Array.isArray(changes.reservation_installments)) {
        const installments = changes.reservation_installments
          .filter(Boolean)
          .map((inst) => ({
            reservation_id: reservationId,
            amount: normalizeNumber(inst.amount, { allowNull: false }),
            due_date: inst.due_date || null,
            status: normalizeString(inst.status) || 'pending'
          }));

        const { error: deleteError } = await supabaseAdmin
          .from('reservation_installments')
          .delete()
          .eq('reservation_id', reservationId);
        ensureSuccess(deleteError, 'No se pudieron limpiar las cuotas existentes');

        if (installments.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from('reservation_installments')
            .insert(installments);
          ensureSuccess(insertError, 'No se pudieron registrar las nuevas cuotas de pago');
        }
      }
    } else if (section === 'transfers') {
      if (!changes || typeof changes !== 'object') {
        return res.status(400).json({ error: 'Los cambios de traslados no son validos.' });
      }

      const { data: segmentRows, error: segmentsError } = await supabaseAdmin
        .from('reservation_segments')
        .select('id')
        .eq('reservation_id', reservationId);
      ensureSuccess(segmentsError, 'No se pudieron obtener los segmentos de la reserva');

      const segmentIdByIndex = new Map();
      if (Array.isArray(changes.segments)) {
        changes.segments.forEach((segment, index) => {
          if (segment?.id) {
            segmentIdByIndex.set(index, segment.id);
          }
        });
      }

      if (segmentIdByIndex.size === 0) {
        segmentRows.forEach((segment, index) => {
          segmentIdByIndex.set(index, segment.id);
        });
      }

      const { data: existingTransfers, error: transfersError } = await supabaseAdmin
        .from('reservation_transfers')
        .select('id, segment_id, transfer_type')
        .eq('reservation_id', reservationId);
      ensureSuccess(transfersError, 'No se pudieron obtener los traslados actuales');

      const transferByKey = new Map();
      (existingTransfers || []).forEach((transfer) => {
        transferByKey.set(`${transfer.segment_id}:${transfer.transfer_type}`, transfer);
      });

      for (const [key, value] of Object.entries(changes)) {
        if (key === 'segments') continue;
        const segmentIndex = Number(key);
        if (Number.isNaN(segmentIndex)) continue;

        const segmentId = segmentIdByIndex.get(segmentIndex);
        if (!segmentId) continue;

        const config = value || {};
        const wantsIn = !!config.hasIn;
        const wantsOut = !!config.hasOut;

        const arrivalKey = `${segmentId}:arrival`;
        const departureKey = `${segmentId}:departure`;

        const arrivalTransfer = transferByKey.get(arrivalKey);
        const departureTransfer = transferByKey.get(departureKey);

        if (wantsIn) {
          if (!arrivalTransfer) {
            const { error } = await supabaseAdmin
              .from('reservation_transfers')
              .insert({
                reservation_id: reservationId,
                segment_id: segmentId,
                transfer_type: 'arrival',
                pickup_location: null,
                dropoff_location: null,
                transfer_date: null,
                transfer_time: null,
                cost: 0,
                include_cost: false,
                vehicle_type: null,
                notes: null
              });
            ensureSuccess(error, 'No se pudo registrar el traslado de llegada');
          }
        } else if (arrivalTransfer) {
          const { error } = await supabaseAdmin
            .from('reservation_transfers')
            .delete()
            .eq('id', arrivalTransfer.id);
          ensureSuccess(error, 'No se pudo eliminar el traslado de llegada');
        }

        if (wantsOut) {
          if (!departureTransfer) {
            const { error } = await supabaseAdmin
              .from('reservation_transfers')
              .insert({
                reservation_id: reservationId,
                segment_id: segmentId,
                transfer_type: 'departure',
                pickup_location: null,
                dropoff_location: null,
                transfer_date: null,
                transfer_time: null,
                cost: 0,
                include_cost: false,
                vehicle_type: null,
                notes: null
              });
            ensureSuccess(error, 'No se pudo registrar el traslado de salida');
          }
        } else if (departureTransfer) {
          const { error } = await supabaseAdmin
            .from('reservation_transfers')
            .delete()
            .eq('id', departureTransfer.id);
          ensureSuccess(error, 'No se pudo eliminar el traslado de salida');
        }

        transferByKey.delete(arrivalKey);
        transferByKey.delete(departureKey);
      }
    } else {
      return res.status(400).json({ error: `La seccion ${section} todavia no esta soportada.` });
    }

    const nowIso = new Date().toISOString();

    const { error: statusError } = await supabaseAdmin
      .from('change_requests')
      .update({
        status: 'applied',
        approved_by_id: userId,
        reviewed_at: nowIso,
        applied_at: nowIso
      })
      .eq('id', id);
    ensureSuccess(statusError, 'No se pudo actualizar el estado de la solicitud');

    const invoiceNumber = reservation.invoice_number || reservationId;

    await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: changeRequest.requested_by_id,
        sender_id: userId,
        type: section === 'cancellation' ? 'cancellation_approved' : 'change_approved',
        title: section === 'cancellation' ? 'Cancelacion aprobada' : 'Cambio aprobado',
        message: section === 'cancellation'
          ? `Tu solicitud de cancelacion para la reserva #${invoiceNumber} ha sido aprobada`
          : `Tu solicitud de cambio para la reserva #${invoiceNumber} ha sido aprobada`,
        reference_id: id,
        reference_type: 'change_request',
        metadata: {
          reservation_id: reservationId,
          invoice_number: reservation.invoice_number,
          section
        }
      });

    await supabaseAdmin.rpc('log_reservation_activity', {
      p_reservation_id: reservationId,
      p_activity_type: 'change_request_approved',
      p_performed_by_id: userId,
      p_description: section === 'cancellation'
        ? 'Solicitud de cancelacion aprobada y aplicada'
        : `Solicitud de cambio aprobada y aplicada para la seccion: ${section}`,
      p_changes: changes,
      p_metadata: {
        change_request_id: id,
        section,
        status: 'applied'
      }
    });

    res.json({
      success: true,
      message: 'Solicitud aprobada y cambios aplicados exitosamente'
    });
  } catch (error) {
    console.error('Error in approveChangeRequest:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};



// =====================================================
// RECHAZAR SOLICITUD DE CAMBIO
// =====================================================
const rejectChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Solo gestores y administradores pueden rechazar
    if (!['gestor', 'administrador'].includes(userRole)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({ error: 'Debe proporcionar un motivo de rechazo (mínimo 10 caracteres)' });
    }

    // Obtener la solicitud de cambio
    const { data: changeRequest, error: fetchError } = await supabaseAdmin
      .from('change_requests')
      .select('*, reservations(invoice_number, advisor_id)')
      .eq('id', id)
      .single();

    if (fetchError || !changeRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (changeRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Esta solicitud ya fue procesada' });
    }

    // Actualizar estado de la solicitud
    const { error: updateError } = await supabaseAdmin
      .from('change_requests')
      .update({
        status: 'rejected',
        approved_by_id: userId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating change request:', updateError);
      return res.status(500).json({ error: 'Error al rechazar la solicitud' });
    }

    // Notificar al asesor
    const section = changeRequest.section_to_change;
    await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: changeRequest.requested_by_id,
        sender_id: userId,
        type: section === 'cancellation' ? 'cancellation_rejected' : 'change_rejected',
        title: section === 'cancellation' ? '❌ Cancelación Rechazada' : '❌ Cambio Rechazado',
        message: section === 'cancellation'
          ? `Tu solicitud de cancelación para la reserva #${changeRequest.reservations.invoice_number} fue rechazada: ${rejectionReason}`
          : `Tu solicitud de cambio para la reserva #${changeRequest.reservations.invoice_number} fue rechazada: ${rejectionReason}`,
        reference_id: id,
        reference_type: 'change_request',
        metadata: {
          reservation_id: changeRequest.reservation_id,
          invoice_number: changeRequest.reservations.invoice_number,
          section: section,
          rejection_reason: rejectionReason
        }
      });

    // Registrar en el historial de actividades
    await supabaseAdmin.rpc('log_reservation_activity', {
      p_reservation_id: changeRequest.reservation_id,
      p_activity_type: 'change_request_rejected',
      p_performed_by_id: userId,
      p_description: section === 'cancellation'
        ? `Solicitud de cancelación rechazada: ${rejectionReason}`
        : `Solicitud de cambio rechazada para la sección ${section}: ${rejectionReason}`,
      p_metadata: {
        change_request_id: id,
        section: section,
        status: 'rejected',
        rejection_reason: rejectionReason
      }
    });

    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente'
    });

  } catch (error) {
    console.error('Error in rejectChangeRequest:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// =====================================================
// OBTENER SOLICITUDES PENDIENTES
// =====================================================
const getPendingChangeRequests = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Solo gestores y administradores pueden ver solicitudes pendientes
    if (!['gestor', 'administrador'].includes(userRole)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { data, error } = await supabaseAdmin
      .from('v_change_requests_detailed')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return res.status(500).json({ error: 'Error al obtener solicitudes pendientes' });
    }

    res.json({
      success: true,
      requests: data || []
    });

  } catch (error) {
    console.error('Error in getPendingChangeRequests:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// =====================================================
// OBTENER SOLICITUDES DE UN ASESOR
// =====================================================
const getMyChangeRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    if (process.env.NODE_ENV === 'development') {
      console.log('[getMyChangeRequests] Fetching requests for user:', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('v_change_requests_detailed')
      .select('*')
      .eq('requested_by_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user requests:', error);
      return res.status(500).json({ error: 'Error al obtener tus solicitudes' });
    }

    res.json({
      success: true,
      requests: data || []
    });

  } catch (error) {
    console.error('Error in getMyChangeRequests:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// =====================================================
// OBTENER DETALLE DE UNA SOLICITUD
// =====================================================
const getChangeRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data, error } = await supabaseAdmin
      .from('v_change_requests_detailed')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Verificar permisos
    const isOwner = data.requested_by_id === userId;
    const isManager = ['gestor', 'administrador'].includes(userRole);

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({
      success: true,
      request: data
    });

  } catch (error) {
    console.error('Error in getChangeRequestById:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  createChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
  getPendingChangeRequests,
  getMyChangeRequests,
  getChangeRequestById
};
