require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { hashPassword, comparePassword } = require('./passwordUtils');
const { supabaseAdmin } = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

// Multer setup for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to ensure time strings include a date for timestamp fields
const formatTimeToTimestamp = (timeStr) => {
  if (!timeStr) return null;
  // If value already contains a date portion, assume it's a valid timestamp
  if (/\d{4}-\d{2}-\d{2}T/.test(timeStr)) return timeStr;
  // Attach a dummy date so Postgres can parse the time correctly
  return `1970-01-01T${timeStr}:00Z`;
};

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, id_card, username, email, role, password, active, avatar')
      .eq('email', email)
      .single();

    if (error || !user) {
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user from Supabase:', error);
        return res.status(500).json({ message: 'Error del servidor' });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    delete user.password;
    const userResponse = {
      id: user.id,
      name: user.name,
      lastName: user.last_name,
      idCard: user.id_card,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      avatar: user.avatar,
    };
    res.json({ user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



app.get('/api/usuarios', async (req, res) => {
  try {
    const { data: supabaseData, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, id_card, username, email, role, active, avatar');
    if (supabaseError) {
      console.error('Error al obtener usuarios de Supabase:', supabaseError);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    const usuarios = (supabaseData || []).map((row) => ({
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      idCard: row.id_card,
      username: row.username,
      email: row.email,
      role: row.role,
      active: row.active,
      avatar: row.avatar,
    }));

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  if (!name || !lastName || !idCard || !username || !email || !role || !password) {
    return res.status(400).json({ message: 'Faltan datos del usuario' });
  }
  try {
    const hashedPassword = await hashPassword(password);
    const { data, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .insert({
          name,
          last_name: lastName,
          id_card: idCard,
          username,
          email,
          role,
          password: hashedPassword,
          active,
          avatar,
        })
      .select('id, name, last_name, id_card, username, email, role, active, avatar')
      .single();

    if (supabaseError) {
      console.error('Error al insertar en Supabase:', supabaseError);
      if (supabaseError.code === '23505') {
        return res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }
    const newUser = {
      id: data.id,
      name: data.name,
      lastName: data.last_name,
      idCard: data.id_card,
      username: data.username,
      email: data.email,
      role: data.role,
      active: data.active,
      avatar: data.avatar,
    };
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  try {
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('usuarios')
      .select('name, last_name, id_card, username, email, role, active, avatar')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user from Supabase:', fetchError);
        return res.status(500).json({ message: 'Error del servidor' });
      }
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (
      existingUser.name === name &&
      existingUser.last_name === lastName &&
      existingUser.id_card === idCard &&
      existingUser.username === username &&
      existingUser.email === email &&
      existingUser.role === role &&
      existingUser.active === active &&
      existingUser.avatar === avatar &&
      !password
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    const supabaseUpdate = {
      name,
      last_name: lastName,
      id_card: idCard,
      username,
      email,
      role,
      active,
      avatar,
    };
    if (password) {
      supabaseUpdate.password = await hashPassword(password);
    }

    const { data, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .update(supabaseUpdate)
      .eq('id', id)
      .select('id, name, last_name, id_card, username, email, role, active, avatar')
      .single();

    if (supabaseError) {
      console.error('Error al actualizar en Supabase:', supabaseError);
      if (supabaseError.code === '23505') {
        return res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json({
      id: data.id,
      name: data.name,
      lastName: data.last_name,
      idCard: data.id_card,
      username: data.username,
      email: data.email,
      role: data.role,
      active: data.active,
      avatar: data.avatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/unassociated-users', async (req, res) => {
  try {
    const { data: associatedUserData, error: associatedUserError } = await supabaseAdmin
      .from('sales_point_users')
      .select('user_id');

    if (associatedUserError) {
      throw associatedUserError;
    }

    const associatedUserIds = associatedUserData.map(u => u.user_id);

    let query = supabaseAdmin.from('usuarios').select('*');

    if (associatedUserIds.length > 0) {
      query = query.not('id', 'in', `(${associatedUserIds.join(',')})`);
    }
    
    const { data: unassociatedUsers, error: unassociatedUsersError } = await query;

    if (unassociatedUsersError) {
      throw unassociatedUsersError;
    }

    res.json(unassociatedUsers);
  } catch (error) {
    console.error('Error fetching unassociated users:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/offices', async (req, res) => {
  try {
    const { data: officesData, error } = await supabaseAdmin
      .from('offices')
      .select('*, sales_point_users(usuarios(id, name, last_name, email, avatar))');

    if (error) {
      console.error('Error al obtener oficinas de Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    const offices = officesData.map((office) => ({
      id: office.id,
      name: office.name,
      address: office.address,
      phone: office.phone,
      email: office.email,
      manager: office.manager,
      active: office.active,
      associatedUsers: office.sales_point_users.map((spu) => ({
        id: spu.usuarios.id,
        name: spu.usuarios.name,
        lastName: spu.usuarios.last_name,
        email: spu.usuarios.email,
        avatar: spu.usuarios.avatar,
      })),
    }));

    res.json(offices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/offices', async (req, res) => {
  const { name, address, phone, email, manager, active } = req.body;
  if (!name || !address) {
    return res.status(400).json({ message: 'Faltan datos de la oficina' });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('offices')
      .insert({ name, address, phone, email, manager, active })
      .select()
      .single();

    if (error) {
      console.error('Error al insertar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, manager, active } = req.body;
  try {
    const { data: existingOffice, error: fetchError } = await supabaseAdmin
      .from('offices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching office from Supabase:', fetchError);
      return res.status(500).json({ message: 'Error del servidor' });
    }
    
    if (!existingOffice) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }

    if (
      existingOffice.name === name &&
      existingOffice.address === address &&
      existingOffice.phone === phone &&
      existingOffice.email === email &&
      existingOffice.manager === manager &&
      existingOffice.active === active
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    const { data, error } = await supabaseAdmin
      .from('offices')
      .update({ name, address, phone, email, manager, active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('offices')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id/usuarios', async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds debe ser un arreglo' });
  }
  try {
    // Eliminar asociaciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('sales_point_users')
      .delete()
      .eq('office_id', id);

    if (deleteError) throw deleteError;

    // Insertar nuevas asociaciones si las hay
    if (userIds.length > 0) {
      const newAssociations = userIds.map((userId) => ({
        office_id: id,
        user_id: userId,
      }));
      const { error: insertError } = await supabaseAdmin
        .from('sales_point_users')
        .insert(newAssociations);

      if (insertError) throw insertError;
    }

    // Obtener la lista actualizada de usuarios asociados
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('sales_point_users')
      .select('usuarios(id, name, last_name, email, avatar)')
      .eq('office_id', id);

    if (usersError) throw usersError;

    const users = usersData.map((item) => ({
      id: item.usuarios.id,
      name: item.usuarios.name,
      lastName: item.usuarios.last_name,
      email: item.usuarios.email,
      avatar: item.usuarios.avatar,
    }));
    res.json({ officeId: id, associatedUsers: users });
  } catch (error) {
    console.error('Error al actualizar usuarios de oficina en Supabase:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/reservations', async (req, res) => {
  const { userId, userRole } = req.query; // Obtener el rol y el ID del usuario desde la query
  try {
    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        clients(*),
        advisor:usuarios!reservations_advisor_id_fkey(name),
        reservation_segments(*),
        reservation_flights(*, reservation_flight_itineraries(*)),
        reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
        reservation_tours(*),
        reservation_medical_assistances(*),
        reservation_installments(*),
        change_requests(*),
        reservation_passengers(*),
        reservation_attachments(*)
      `);

    // Si el usuario es un asesor, filtrar por su ID
    if (userRole === 'advisor' && userId) {
      query = query.eq('advisor_id', userId);
    } 

    const { data, error } = await query.order('created_at', { ascending: false }); // Ordenar por fecha de creación

    if (error) {
      console.error('Error fetching reservations from Supabase:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    const transformedData = data.map(reservation => {
      const mainSegment = reservation.reservation_segments && reservation.reservation_segments.length > 0
        ? reservation.reservation_segments[0]
        : null;

      return {
        ...reservation,
        invoiceNumber: reservation.invoice_number,
        clientName: reservation.clients?.name,
        clientId: reservation.clients?.id_card,
        clientEmail: reservation.clients?.email,
        clientPhone: reservation.clients?.phone,
        clientAddress: reservation.clients?.address,
        advisorName: reservation.advisor?.name,
        emergencyContact: {
          name: reservation.clients?.emergency_contact_name,
          phone: reservation.clients?.emergency_contact_phone,
        },
        changeRequests: reservation.change_requests?.map(req => ({
          id: req.id,
          description: req.description,
          field: req.field,
          value: req.value,
        })),
        createdAt: reservation.created_at,
        updatedAt: reservation.updated_at,
        departureDate: mainSegment?.departure_date,
        returnDate: mainSegment?.return_date,
      };
    });

    res.json(transformedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reservations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        clients(*),
        advisor:usuarios!reservations_advisor_id_fkey(name),
        reservation_segments(*),
        reservation_flights(*, reservation_flight_itineraries(*)),
        reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
        reservation_tours(*),
        reservation_medical_assistances(*),
        reservation_installments(*),
        change_requests(*),
        reservation_passengers(*),
        reservation_attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reservation from Supabase:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const transformedData = {
      ...data,
      invoiceNumber: data.invoice_number,
      clientName: data.clients?.name,
      clientId: data.clients?.id_card,
      clientEmail: data.clients?.email,
      clientPhone: data.clients?.phone,
      clientAddress: data.clients?.address,
      advisorName: data.advisor?.name,
      emergencyContact: {
        name: data.clients?.emergency_contact_name,
        phone: data.clients?.emergency_contact_phone,
      },
      changeRequests: data.change_requests?.map(req => ({
        id: req.id,
        description: req.description,
        field: req.field,
        value: req.value,
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      departureDate: data.reservation_segments && data.reservation_segments.length > 0
        ? data.reservation_segments[0].departure_date
        : null,
      returnDate: data.reservation_segments && data.reservation_segments.length > 0
        ? data.reservation_segments[0].return_date
        : null,
    };

    res.json(transformedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reservations', async (req, res) => {
  const {
    clientName,
    clientId,
    clientEmail,
    clientPhone,
    clientAddress,
    emergencyContact,
    tripType,
    advisorId, // Asumimos que el frontend envía el ID del asesor logueado
    segments,
    passengersADT,
    passengersCHD,
    passengersINF,
    flights,
    hotels,
    tours,
    medicalAssistances,
    pricePerADT,
    pricePerCHD,
    pricePerINF,
    totalAmount,
    paymentOption,
    installments,
    notes,
    status,
  } = req.body;

  try {
    // Step 1: Find or create the client
    let client;
    const { data: existingClient, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', clientEmail)
      .single();

    if (existingClient) {
      client = existingClient;
    } else {
      const { data: newClient, error: newClientError } = await supabaseAdmin
        .from('clients')
        .insert({
          name: clientName,
          id_card: clientId,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
          emergency_contact_name: emergencyContact?.name,
          emergency_contact_phone: emergencyContact?.phone,
        })
        .select('id')
        .single();
      if (newClientError) throw newClientError;
      client = newClient;
    }

    // Step 2: Create the reservation
    const reservationToInsert = {
        client_id: client.id,
        advisor_id: advisorId,
        trip_type: tripType,
        passengers_adt: passengersADT,
        passengers_chd: passengersCHD,
        passengers_inf: passengersINF,
        price_per_adt: pricePerADT,
        price_per_chd: pricePerCHD,
        price_per_inf: pricePerINF,
        total_amount: totalAmount,
        payment_option: paymentOption,
        notes: notes,
        status: status,
    };

    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .insert(reservationToInsert)
      .select('id')
      .single();

    if (reservationError) {
        console.error('Error inserting reservation into Supabase:', reservationError);
        return res.status(500).json({ message: reservationError.message, code: reservationError.code, details: reservationError.details, hint: reservationError.hint });
    }

    const reservationId = reservation.id;

    // Step 3: Insert related data
    if (segments && segments.length > 0) {
      const segmentData = segments.map(s => ({
        origin: s.origin,
        destination: s.destination,
        departure_date: s.departureDate || null,
        return_date: s.returnDate || null,
        reservation_id: reservationId
      }));
      const { error } = await supabaseAdmin.from('reservation_segments').insert(segmentData);
      if (error) throw error;
    }

    if (flights && flights.length > 0) {
      for (const flight of flights) {
        const { itineraries, ...flightData } = flight;
        const flightToInsert = {
            airline: flightData.airline,
            flight_category: flightData.flightCategory,
            baggage_allowance: flightData.baggageAllowance,
            flight_cycle: flightData.flightCycle,
            pnr: flightData.trackingCode,
            reservation_id: reservationId
        };
        const { data: newFlight, error: flightError } = await supabaseAdmin
          .from('reservation_flights')
          .insert(flightToInsert)
          .select('id')
          .single();
        if (flightError) throw flightError;

        if (itineraries && itineraries.length > 0) {
          const itineraryData = itineraries.map(i => ({
            flight_number: i.flightNumber,
            departure_time: formatTimeToTimestamp(i.departureTime),
            arrival_time: formatTimeToTimestamp(i.arrivalTime),
            flight_id: newFlight.id
          }));
          const { error: itineraryError } = await supabaseAdmin.from('reservation_flight_itineraries').insert(itineraryData);
          if (itineraryError) throw itineraryError;
        }
      }
    }

    if (hotels && hotels.length > 0) {
        for (const hotel of hotels) {
            const { accommodation, hotelInclusions, ...hotelData } = hotel;
            const hotelToInsert = {
                name: hotelData.name,
                room_category: hotelData.roomCategory,
                meal_plan: hotelData.mealPlan,
                reservation_id: reservationId
            };
            const { data: newHotel, error: hotelError } = await supabaseAdmin
                .from('reservation_hotels')
                .insert(hotelToInsert)
                .select('id')
                .single();
            if (hotelError) throw hotelError;

            if (accommodation && accommodation.length > 0) {
                const accommodationData = accommodation.map(a => ({ ...a, hotel_id: newHotel.id }));
                const { error: accommodationError } = await supabaseAdmin.from('reservation_hotel_accommodations').insert(accommodationData);
                if (accommodationError) throw accommodationError;
            }

            if (hotelInclusions && hotelInclusions.length > 0) {
                const inclusionData = hotelInclusions.map(i => ({ inclusion: i, hotel_id: newHotel.id }));
                const { error: inclusionError } = await supabaseAdmin.from('reservation_hotel_inclusions').insert(inclusionData);
                if (inclusionError) throw inclusionError;
            }
        }
    }

    if (tours && tours.length > 0) {
      const tourData = tours.map(t => ({
        name: t.name,
        date: t.date || null,
        cost: t.cost,
        reservation_id: reservationId
      }));
      const { error } = await supabaseAdmin.from('reservation_tours').insert(tourData);
      if (error) throw error;
    }

    if (medicalAssistances && medicalAssistances.length > 0) {
      const medicalAssistanceData = medicalAssistances.map(m => ({
        plan_type: m.planType,
        start_date: m.startDate || null,
        end_date: m.endDate || null,
        reservation_id: reservationId
      }));
      const { error } = await supabaseAdmin.from('reservation_medical_assistances').insert(medicalAssistanceData);
      if (error) throw error;
    }

    if (installments && installments.length > 0) {
      const installmentData = installments.map(i => ({
        amount: i.amount,
        due_date: i.dueDate || null,
        reservation_id: reservationId
      }));
      const { error } = await supabaseAdmin.from('reservation_installments').insert(installmentData);
      if (error) throw error;
    }

    // Fetch the newly created reservation to return it
    const { data: newReservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        clients(*),
        advisor:usuarios!reservations_advisor_id_fkey(name),
        reservation_segments(*),
        reservation_flights(*, reservation_flight_itineraries(*)),
        reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
        reservation_tours(*),
        reservation_medical_assistances(*),
        reservation_installments(*)
      `)
      .eq('id', reservationId)
      .single();

    if (fetchError) {
      console.error('Error fetching new reservation:', fetchError);
      // Even if fetching fails, the reservation was created, so we can return the ID.
      return res.status(201).json({ id: reservationId });
    }

    res.status(201).json(newReservation);

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const {
        clients, // Expecting the client object
        reservation_segments, // Expecting the segments array
        // Other top-level reservation fields can be added here for update
        notes, 
        status,
    } = req.body;

    try {
        // Start a transaction
        // Note: Supabase JS client doesn't directly support transactions in the same way as a raw SQL client.
        // We will perform operations sequentially and handle errors.

        // 1. Update Client Info if provided
        if (clients) {
            const { id: clientId, ...clientData } = clients;
            // Map frontend keys to DB keys if they are different
            const clientUpdateData = {
                name: clientData.name,
                id_card: clientData.id_card,
                email: clientData.email,
                phone: clientData.phone,
                address: clientData.address,
                emergency_contact_name: clientData.emergency_contact_name,
                emergency_contact_phone: clientData.emergency_contact_phone,
            };
            const { error: clientError } = await supabaseAdmin
                .from('clients')
                .update(clientUpdateData)
                .eq('id', clientId);
            if (clientError) throw { message: 'Error actualizando el cliente', details: clientError };
        }

        // 2. Upsert Segments if provided
        if (reservation_segments) {
            const segmentsToUpsert = reservation_segments.map(s => ({
                id: s.id, // Important for upsert
                reservation_id: id,
                origin: s.origin,
                destination: s.destination,
                departure_date: s.departure_date,
                return_date: s.return_date,
            }));
            
            const { error: segmentsError } = await supabaseAdmin
                .from('reservation_segments')
                .upsert(segmentsToUpsert);

            if (segmentsError) throw { message: 'Error actualizando los segmentos', details: segmentsError };
        }

        // 3. Update main reservation fields if provided
        const reservationUpdateData = {};
        if (notes !== undefined) reservationUpdateData.notes = notes;
        if (status !== undefined) reservationUpdateData.status = status;
        
        if (Object.keys(reservationUpdateData).length > 0) {
            const { error: reservationError } = await supabaseAdmin
                .from('reservations')
                .update(reservationUpdateData)
                .eq('id', id);
            if (reservationError) throw { message: 'Error actualizando la reserva principal', details: reservationError };
        }

        res.status(200).json({ message: 'Reserva actualizada con éxito' });

    } catch (error) {
        console.error('Error en la actualización parcial de la reserva:', error);
        res.status(500).json({ message: error.message || 'Error interno del servidor', details: error.details });
    }
});

app.put('/api/reservations/:id/service-status', async (req, res) => {
  const { id } = req.params;
  const { service, status } = req.body;

  const allowedServices = ['hotel_status_ok', 'flight_status_ok', 'tours_status_ok', 'assistance_status_ok'];
  if (!allowedServices.includes(service)) {
    return res.status(400).json({ message: 'Servicio no válido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ [service]: status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating service ${service}:`, error);
      return res.status(500).json({ message: 'Error del servidor al actualizar el servicio.' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/reservations/:reservationId/flights/upsert', async (req, res) => {
    const { reservationId } = req.params;
    const flights = req.body;

    if (!Array.isArray(flights)) {
        return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un arreglo de vuelos.' });
    }

    try {
        // Get current flights and itineraries to calculate deletions later
        const { data: currentFlights, error: currentFlightsError } = await supabaseAdmin
            .from('reservation_flights')
            .select('id, reservation_flight_itineraries(id)')
            .eq('reservation_id', reservationId);

        if (currentFlightsError) throw currentFlightsError;

        const submittedFlightIds = new Set(flights.map(f => f.id).filter(Boolean));
        const flightsToDelete = currentFlights.filter(f => !submittedFlightIds.has(f.id));

        // --- Deletion Phase ---
        if (flightsToDelete.length > 0) {
            const idsToDelete = flightsToDelete.map(f => f.id);
            // Deleting flights will cascade and delete their itineraries
            const { error: deleteError } = await supabaseAdmin.from('reservation_flights').delete().in('id', idsToDelete);
            if (deleteError) throw { message: 'Error eliminando vuelos antiguos.', details: deleteError };
        }

        // --- Upsert Phase ---
        for (const flight of flights) {
            const { reservation_flight_itineraries: itineraries, ...flightData } = flight;
            flightData.reservation_id = reservationId;

            // Upsert the flight itself
            const { data: upsertedFlight, error: flightError } = await supabaseAdmin
                .from('reservation_flights')
                .upsert(flightData)
                .select('id')
                .single();

            if (flightError) throw { message: `Error guardando el vuelo ${flightData.airline}.`, details: flightError };

            const flightId = upsertedFlight.id;

            if (itineraries && itineraries.length > 0) {
                const currentItineraryIds = currentFlights
                    .find(f => f.id === flightId)?.reservation_flight_itineraries.map(i => i.id) || [];
                
                const submittedItineraryIds = new Set(itineraries.map(i => i.id).filter(Boolean));
                const itinerariesToDelete = currentItineraryIds.filter(id => !submittedItineraryIds.has(id));

                if (itinerariesToDelete.length > 0) {
                    const { error: deleteItinError } = await supabaseAdmin.from('reservation_flight_itineraries').delete().in('id', itinerariesToDelete);
                    if (deleteItinError) throw { message: 'Error eliminando itinerarios antiguos.', details: deleteItinError };
                }

                const itinerariesToUpsert = itineraries.map(itin => ({ ...itin, flight_id: flightId }));
                const { error: itinError } = await supabaseAdmin.from('reservation_flight_itineraries').upsert(itinerariesToUpsert);
                if (itinError) throw { message: 'Error guardando itinerarios.', details: itinError };
            }
        }

        res.status(200).json({ message: 'Vuelos actualizados con éxito.' });

    } catch (error) {
        console.error('Error en el proceso de upsert de vuelos:', error);
        res.status(500).json({ message: error.message || 'Error interno del servidor.', details: error.details });
    }
});

app.post('/api/reservations/:reservationId/hotels/upsert', async (req, res) => {
    const { reservationId } = req.params;
    const hotels = req.body;

    if (!Array.isArray(hotels)) {
        return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un arreglo de hoteles.' });
    }

    try {
        const { data: currentHotels, error: currentHotelsError } = await supabaseAdmin
            .from('reservation_hotels')
            .select('id, reservation_hotel_accommodations(id), reservation_hotel_inclusions(id)')
            .eq('reservation_id', reservationId);

        if (currentHotelsError) throw currentHotelsError;

        const submittedHotelIds = new Set(hotels.map(h => h.id).filter(Boolean));
        const hotelsToDelete = currentHotels.filter(h => !submittedHotelIds.has(h.id));

        if (hotelsToDelete.length > 0) {
            const idsToDelete = hotelsToDelete.map(h => h.id);
            const { error: deleteError } = await supabaseAdmin.from('reservation_hotels').delete().in('id', idsToDelete);
            if (deleteError) throw { message: 'Error eliminando hoteles antiguos.', details: deleteError };
        }

        for (const hotel of hotels) {
            const { reservation_hotel_accommodations: accommodations, reservation_hotel_inclusions: inclusions, ...hotelData } = hotel;
            hotelData.reservation_id = reservationId;

            const { data: upsertedHotel, error: hotelError } = await supabaseAdmin
                .from('reservation_hotels')
                .upsert(hotelData)
                .select('id')
                .single();

            if (hotelError) throw { message: `Error guardando el hotel ${hotelData.name}.`, details: hotelError };

            const hotelId = upsertedHotel.id;

            // Handle Accommodations
            if (accommodations) {
                const currentAccommIds = currentHotels.find(h => h.id === hotelId)?.reservation_hotel_accommodations.map(a => a.id) || [];
                const submittedAccommIds = new Set(accommodations.map(a => a.id).filter(Boolean));
                const accommsToDelete = currentAccommIds.filter(id => !submittedAccommIds.has(id));
                if (acommsToDelete.length > 0) {
                    await supabaseAdmin.from('reservation_hotel_accommodations').delete().in('id', acommsToDelete);
                }
                const accommsToUpsert = accommodations.map(acc => ({ ...acc, hotel_id: hotelId }));
                await supabaseAdmin.from('reservation_hotel_accommodations').upsert(acommsToUpsert);
            }

            // Handle Inclusions
            if (inclusions) {
                const currentInclusionIds = currentHotels.find(h => h.id === hotelId)?.reservation_hotel_inclusions.map(i => i.id) || [];
                const submittedInclusionIds = new Set(inclusions.map(i => i.id).filter(Boolean));
                const inclusionsToDelete = currentInclusionIds.filter(id => !submittedInclusionIds.has(id));
                if (inclusionsToDelete.length > 0) {
                    await supabaseAdmin.from('reservation_hotel_inclusions').delete().in('id', inclusionsToDelete);
                }
                const inclusionsToUpsert = inclusions.map(inc => ({ ...inc, hotel_id: hotelId }));
                await supabaseAdmin.from('reservation_hotel_inclusions').upsert(inclusionsToUpsert);
            }
        }

        res.status(200).json({ message: 'Hoteles actualizados con éxito.' });

    } catch (error) {
        console.error('Error en el proceso de upsert de hoteles:', error);
        res.status(500).json({ message: error.message || 'Error interno del servidor.', details: error.details });
    }
});

app.delete('/api/reservations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error deleting reservation from Supabase:', error);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/reservations/:id/change-requests', async (req, res) => {
  const { id } = req.params;
  const { section, changes, reason, userId } = req.body; // Se espera el ID del usuario desde el frontend

  // Validar que todos los datos necesarios, incluyendo el userId, están presentes
  if (!section || !changes || !reason || !userId) {
    return res.status(400).json({ message: 'Faltan datos para la solicitud de cambio (sección, cambios, motivo, ID de usuario).' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('change_requests')
      .insert({
        reservation_id: id,
        requested_by_id: userId, // Usar el ID del usuario enviado desde el frontend
        section_to_change: section,
        requested_changes: changes, // Asume que la columna es de tipo JSONB
        request_reason: reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating change request in Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor al crear la solicitud de cambio.' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/change-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Estado no válido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('change_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating change request status:`, error);
      return res.status(500).json({ message: 'Error del servidor al actualizar la solicitud.' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.post('/api/reservations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { managerId } = req.body; // El frontend debe enviar el ID del gestor que aprueba
  try {
    // Llamar a la función RPC para obtener el nuevo número de factura de forma segura
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_and_increment_invoice_number');

    if (rpcError) {
      console.error('Error calling get_and_increment_invoice_number RPC:', rpcError);
      return res.status(500).json({ message: 'Error del servidor al obtener el número de factura.' });
    }

    const newInvoiceNumber = rpcData;

    if (!newInvoiceNumber) {
      return res.status(500).json({ message: 'No se pudo generar un nuevo número de factura desde la configuración.' });
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ 
        status: 'confirmed', 
        invoice_number: newInvoiceNumber,
        manager_id: managerId,
        confirmed_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving reservation:', error);
      if (error.code === '23505') { // Error de clave duplicada
        return res.status(409).json({ message: 'Conflicto al generar el número de factura debido a concurrencia. Por favor, inténtelo de nuevo.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json({ ...data, invoiceNumber: data.invoice_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Upsert passengers for a reservation
app.post('/api/reservations/:reservation_id/passengers/upsert', async (req, res) => {
  const { reservation_id } = req.params;
  const passengers = req.body; // Expecting an array of passengers

  if (!Array.isArray(passengers)) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un arreglo de pasajeros.' });
  }

  try {
    // Add reservation_id to each passenger object
    const passengersToSave = passengers.map(p => ({ ...p, reservation_id: reservation_id }));

    const { data, error } = await supabaseAdmin
      .from('reservation_passengers')
      .upsert(passengersToSave)
      .select();

    if (error) {
      console.error('Error upserting passengers in Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor al guardar los pasajeros.', details: error.message });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor.', details: error.message });
  }
});

// Upsert attachments for a reservation
app.post('/api/reservations/:reservation_id/attachments/upsert', upload.array('files'), async (req, res) => {
  const { reservation_id } = req.params;
  const metadataString = req.body.metadata;

  if (!metadataString) {
    return res.status(400).json({ message: 'Falta la metadata de los adjuntos.' });
  }

  try {
    const metadata = JSON.parse(metadataString);
    const filesMap = new Map((req.files || []).map(f => [f.originalname, f]));
    const attachmentsToUpsert = [];
    const submittedIds = new Set();

    for (const item of metadata) {
      const attachmentData = {
        reservation_id: reservation_id,
        title: item.title,
        observation: item.observation,
      };

      // If it's an existing item, add its ID to the upsert object and the tracking set
      if (item.id) {
        attachmentData.id = item.id;
        submittedIds.add(item.id);
      }

      // Check if a new file was uploaded for this item
      if (item.fileName && filesMap.has(item.fileName)) {
        const file = filesMap.get(item.fileName);
        const filePath = `${reservation_id}/attachments/${Date.now()}-${file.originalname}`;
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('arch_pax') // Make sure this is the correct bucket name
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading file to Supabase Storage:', uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage.from('arch_pax').getPublicUrl(filePath);
          attachmentData.file_name = file.originalname;
          attachmentData.file_url = urlData.publicUrl;
        }
      } else {
        // If no new file, retain the old file info
        attachmentData.file_name = item.file_name;
        attachmentData.file_url = item.file_url;
      }
      
      attachmentsToUpsert.push(attachmentData);
    }

    // --- Deletion Logic ---
    const { data: currentAttachments, error: fetchError } = await supabaseAdmin
      .from('reservation_attachments')
      .select('id')
      .eq('reservation_id', reservation_id);

    if (fetchError) throw fetchError;

    const attachmentsToDelete = currentAttachments.filter(att => !submittedIds.has(att.id));

    if (attachmentsToDelete.length > 0) {
      const idsToDelete = attachmentsToDelete.map(att => att.id);
      // Note: This doesn't delete files from storage, only the DB record.
      // A more robust solution would also delete from storage.
      await supabaseAdmin.from('reservation_attachments').delete().in('id', idsToDelete);
    }
    
    // --- Upsert Logic ---
    const { data, error } = await supabaseAdmin.from('reservation_attachments').upsert(attachmentsToUpsert).select();
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Server error in attachment upsert:', error);
    res.status(500).json({ message: 'Error del servidor.', details: error.message });
  }
});

// --- Business Settings Endpoints ---

// Helper to map frontend camelCase to DB snake_case
const mapToDbSchema = (settings) => ({
  agency_name: settings.agencyName,
  legal_name: settings.legalName,
  logo_url: settings.logoUrl,
  contact_info: settings.contactInfo,
  tax_id_number: settings.taxIdNumber,
  tax_registry: settings.taxRegistry,
  legal_representative_name: settings.legalRepresentativeName,
  legal_representative_id: settings.legalRepresentativeId,
  tax_regime: settings.taxRegime,
  operating_city: settings.operatingCity,
  operating_country: settings.operatingCountry,
  tourism_registry_number: settings.tourismRegistryNumber,
  terms_and_conditions: settings.termsAndConditions,
  travel_contract: settings.travelContract,
  cancellation_policies: settings.cancellationPolicies,
  voucher_info: settings.voucherInfo,
  voucher_header: settings.voucherHeader,
  contract_header: settings.contractHeader,
  default_footer: settings.defaultFooter,
  digital_signature: settings.digitalSignature,
  secondary_logo_url: settings.secondaryLogoUrl,
  invoice_message: settings.invoiceMessage,
  voucher_message: settings.voucherMessage,
  contract_message: settings.contractMessage,
  next_invoice_number: settings.nextInvoiceNumber,
  invoice_format: settings.invoiceFormat,
  currency: settings.currency,
  timezone: settings.timezone,
  tax_rate: settings.taxRate,
  preferred_date_format: settings.preferredDateFormat,
});

// Helper to map DB snake_case to frontend camelCase
const mapFromDbSchema = (settings) => ({
  id: settings.id,
  agencyName: settings.agency_name,
  legalName: settings.legal_name,
  logoUrl: settings.logo_url,
  contactInfo: settings.contact_info,
  taxIdNumber: settings.tax_id_number,
  taxRegistry: settings.tax_registry,
  legalRepresentativeName: settings.legal_representative_name,
  legalRepresentativeId: settings.legal_representative_id,
  taxRegime: settings.tax_regime,
  operatingCity: settings.operating_city,
  operatingCountry: settings.operating_country,
  tourismRegistryNumber: settings.tourism_registry_number,
  termsAndConditions: settings.terms_and_conditions,
  travelContract: settings.travel_contract,
  cancellationPolicies: settings.cancellation_policies,
  voucherInfo: settings.voucher_info,
  voucherHeader: settings.voucher_header,
  contractHeader: settings.contract_header,
  defaultFooter: settings.default_footer,
  digitalSignature: settings.digital_signature,
  secondaryLogoUrl: settings.secondary_logo_url,
  invoiceMessage: settings.invoice_message,
  voucherMessage: settings.voucher_message,
  contractMessage: settings.contract_message,
  nextInvoiceNumber: settings.next_invoice_number,
  invoiceFormat: settings.invoice_format,
  currency: settings.currency,
timezone: settings.timezone,
  taxRate: settings.tax_rate,
  preferredDateFormat: settings.preferred_date_format,
});

app.get('/api/business-settings', async (req, res) => {
  try {
    let { data, error } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();

    // If no settings row exists (e.g., first run), create one with defaults.
    if (error && error.code === 'PGRST116') { // PGRST116: "queried range not satisfiable"
      console.log('No business settings found, creating a default entry.');
      const { data: newData, error: insertError } = await supabaseAdmin
        .from('business_settings')
        .insert({}) // Insert an empty object to trigger DB defaults.
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default business settings:', insertError);
        // Re-throw to be caught by the main catch block
        throw insertError;
      }
      
      data = newData; // Use the newly created data
    } else if (error) {
      // For any other database error, throw it.
      throw error;
    }

    res.json(mapFromDbSchema(data));
  } catch (error) {
    console.error('Error fetching/creating business settings:', error);
    res.status(500).json({ message: 'Error del servidor al obtener la configuración.', details: error.message });
  }
});

app.put('/api/business-settings', async (req, res) => {
  try {
    const settingsFromClient = req.body;
    const settingsId = settingsFromClient.id; // Get ID from the body

    if (!settingsId) {
      return res.status(400).json({ message: 'Falta el ID de la configuración en la solicitud.' });
    }

    const settingsForDb = mapToDbSchema(settingsFromClient);
    const { data, error } = await supabaseAdmin.from('business_settings').update(settingsForDb).eq('id', settingsId).select().single();
    
    if (error) throw error;

    res.json(mapFromDbSchema(data));
  } catch (error) {
    console.error('Error updating business settings:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar la configuración.' });
  }
});

app.post('/api/reservations/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting reservation:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json({ ...data, invoiceNumber: data.invoice_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



// --- Reservation Passengers Endpoints ---

// Get all passengers for a reservation
app.get('/api/reservations/:reservation_id/passengers', async (req, res) => {
  const { reservation_id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('reservation_passengers')
      .select('*')
      .eq('reservation_id', reservation_id);

    if (error) {
      console.error('Error fetching passengers from Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Add a passenger to a reservation
app.post('/api/reservations/:reservation_id/passengers', upload.array('documents'), async (req, res) => {
  const { reservation_id } = req.params;
  const { name, lastname, document_type, document_number, birth_date, notes } = req.body;

  if (!name || !lastname || !document_type || !document_number || !birth_date) {
    return res.status(400).json({ message: 'Faltan datos del pasajero' });
  }

  try {
    let documents_metadata = [];
    if (req.files) {
      for (const file of req.files) {
        const filePath = `${reservation_id}/${document_number}/${file.originalname}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('arch_pax')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading file to Supabase Storage:', uploadError);
          // Continue without this file or return an error? For now, let's continue
        } else {
          const { data: urlData } = supabaseAdmin.storage.from('arch_pax').getPublicUrl(filePath);
          documents_metadata.push({
            name: file.originalname,
            url: urlData.publicUrl,
            type: file.mimetype,
            path: filePath,
          });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('reservation_passengers')
      .insert({
        reservation_id,
        name,
        lastname,
        document_type,
        document_number,
        birth_date,
        notes,
        documents: documents_metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting passenger into Supabase:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Un pasajero con este número de documento ya existe en esta reserva.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Update a passenger
app.put('/api/passengers/:passenger_id', upload.array('documents'), async (req, res) => {
    const { passenger_id } = req.params;
    const { name, lastname, document_type, document_number, birth_date, notes, existing_documents } = req.body;

    try {
        // First, get the existing passenger to get reservation_id and old documents
        const { data: existingPassenger, error: fetchError } = await supabaseAdmin
            .from('reservation_passengers')
            .select('reservation_id, documents')
            .eq('id', passenger_id)
            .single();

        if (fetchError || !existingPassenger) {
            return res.status(404).json({ message: 'Pasajero no encontrado' });
        }

        const { reservation_id } = existingPassenger;
        let documents_metadata = existingPassenger.documents || [];
        
        // If existing_documents is a string, parse it. It might come as a JSON string from form-data
        let clientExistingDocs = [];
        if (typeof existing_documents === 'string') {
            try {
                clientExistingDocs = JSON.parse(existing_documents);
            } catch(e) {
                // ignore if parsing fails
            }
        } else if (Array.isArray(existing_documents)) {
            clientExistingDocs = existing_documents;
        }

        // Find and remove documents that are no longer in the list
        const docsToRemove = documents_metadata.filter(doc => !clientExistingDocs.some(ed => ed.path === doc.path));
        if (docsToRemove.length > 0) {
            const pathsToRemove = docsToRemove.map(doc => doc.path);
            await supabaseAdmin.storage.from('arch_pax').remove(pathsToRemove);
            documents_metadata = documents_metadata.filter(doc => !pathsToRemove.includes(doc.path));
        }

        // Upload new files
        if (req.files) {
            for (const file of req.files) {
                const filePath = `${reservation_id}/${document_number}/${file.originalname}`;
                const { error: uploadError } = await supabaseAdmin.storage
                    .from('arch_pax')
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true,
                    });

                if (uploadError) {
                    console.error('Error uploading file to Supabase Storage:', uploadError);
                } else {
                    const { data: urlData } = supabaseAdmin.storage.from('arch_pax').getPublicUrl(filePath);
                    documents_metadata.push({
                        name: file.originalname,
                        url: urlData.publicUrl,
                        type: file.mimetype,
                        path: filePath,
                    });
                }
            }
        }

        const updateData = {
            name,
            lastname,
            document_type,
            document_number,
            birth_date,
            notes,
            documents: documents_metadata,
        };

        const { data, error } = await supabaseAdmin
            .from('reservation_passengers')
            .update(updateData)
            .eq('id', passenger_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating passenger in Supabase:', error);
            return res.status(500).json({ message: 'Error del servidor' });
        }

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});


// Delete a passenger
app.delete('/api/passengers/:passenger_id', async (req, res) => {
  const { passenger_id } = req.params;
  try {
    // Before deleting the passenger, get their documents to delete them from storage
    const { data: passenger, error: fetchError } = await supabaseAdmin
        .from('reservation_passengers')
        .select('documents')
        .eq('id', passenger_id)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is ok if passenger doesn't exist
        console.error('Error fetching passenger for deletion:', fetchError);
        return res.status(500).json({ message: 'Error del servidor' });
    }

    if (passenger && passenger.documents && passenger.documents.length > 0) {
        const pathsToRemove = passenger.documents.map(doc => doc.path).filter(Boolean);
        if (pathsToRemove.length > 0) {
            const { error: storageError } = await supabaseAdmin.storage.from('arch_pax').remove(pathsToRemove);
            if (storageError) {
                console.error('Error deleting files from Supabase Storage:', storageError);
                // Decide if you should proceed with DB deletion or not.
                // For now, we'll log the error and continue.
            }
        }
    }

    const { data, error } = await supabaseAdmin
      .from('reservation_passengers')
      .delete()
      .eq('id', passenger_id)
      .select();

    if (error) {
      console.error('Error deleting passenger from Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Pasajero no encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Endpoint to update installment status
app.put('/api/installments/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'El estado es requerido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reservation_installments')
      .update({ status: status, payment_date: status === 'paid' ? new Date() : null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating installment status:', error);
      return res.status(500).json({ message: 'Error del servidor al actualizar la cuota.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Cuota no encontrada.' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Endpoint to upload a receipt for an installment
app.post('/api/installments/:id/receipt', upload.single('receipt'), async (req, res) => {
  const { id } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }

  try {
    // 1. Get the reservation_id from the installment
    const { data: installment, error: fetchError } = await supabaseAdmin
      .from('reservation_installments')
      .select('reservation_id')
      .eq('id', id)
      .single();

    if (fetchError || !installment) {
      return res.status(404).json({ message: 'La cuota no fue encontrada.' });
    }

    const { reservation_id } = installment;
    const filePath = `reservations/${reservation_id}/installments/${id}/${req.file.originalname}`;

    // 2. Upload file to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true, // Overwrite if file already exists
      });

    if (uploadError) {
      console.error('Error uploading file to Supabase Storage:', uploadError);
      return res.status(500).json({ message: 'Error al subir el archivo.' });
    }

    // 3. Get public URL and update the database
    const { data: urlData } = supabaseAdmin.storage.from('receipts').getPublicUrl(filePath);
    
    const { data: updatedInstallment, error: updateError } = await supabaseAdmin
      .from('reservation_installments')
      .update({ receipt_url: urlData.publicUrl })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating installment with receipt URL:', updateError);
      return res.status(500).json({ message: 'Error al guardar la URL del recibo.' });
    }

    res.status(200).json(updatedInstallment);

  } catch (error) {
    console.error('Error processing receipt upload:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});


// Download a passenger document
app.get('/api/passengers/documents/download', async (req, res) => {
    const { path } = req.query;
    if (!path) {
        return res.status(400).json({ message: 'File path is required' });
    }
    try {
        const { data, error } = await supabaseAdmin.storage.from('arch_pax').download(path);
        if (error) {
            console.error('Error downloading file:', error);
            return res.status(404).json({ message: 'File not found' });
        }
        // To get the content type, we can look it up or just set a generic one
        const { data: fileData, error: fileError } = await supabaseAdmin.storage.from('arch_pax').getPublicUrl(path);
        
        // This is a bit of a hack. Supabase JS client v2 doesn't easily expose metadata on download.
        // We'll try to infer from the name, or you could store mimetype in the DB.
        const fileName = path.split('/').pop();
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        data.pipe(res);

    } catch (error) {
        console.error('Error processing file download:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});