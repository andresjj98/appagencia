require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { hashPassword, comparePassword } = require('./passwordUtils');
const { supabaseAdmin } = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

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
  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select(`
        *,
        clients(*),
        reservation_segments(*),
        reservation_flights(*, reservation_flight_itineraries(*)),
        reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
        reservation_tours(*),
        reservation_medical_assistances(*),
        reservation_installments(*),
        change_requests(*)
      `);

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
        // Assuming destination is part of the main reservation object or can be derived
        // For now, let's assume it's directly on the reservation object or needs to be added
        // destination: reservation.destination, // Add this if 'destination' exists in 'reservations' table
        // passengers: calculate total passengers if needed, otherwise use existing field
        // advisorName: reservation.advisorName, // Add this if 'advisorName' exists in 'reservations' table
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
        reservation_segments(*),
        reservation_flights(*, reservation_flight_itineraries(*)),
        reservation_hotels(*, reservation_hotel_accommodations(*), reservation_hotel_inclusions(*)),
        reservation_tours(*),
        reservation_medical_assistances(*),
        reservation_installments(*),
        change_requests(*)
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
            departure_time: i.departureTime || null,
            arrival_time: i.arrivalTime || null,
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

    res.status(201).json({ id: reservationId });

  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Error creating reservation' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const {
        clientName,
        clientId,
        clientEmail,
        clientPhone,
        clientAddress,
        emergencyContact,
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

        // Step 2: Update the reservation
        const reservationToUpdate = {
            client_id: client.id,
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
            updated_at: new Date(),
        };

        const { data: reservation, error: reservationError } = await supabaseAdmin
            .from('reservations')
            .update(reservationToUpdate)
            .eq('id', id)
            .select('id')
            .single();

        if (reservationError) {
            console.error('Error updating reservation in Supabase:', reservationError);
            return res.status(500).json({ message: reservationError.message, code: reservationError.code, details: reservationError.details, hint: reservationError.hint });
        }
        if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

        const reservationId = reservation.id;

        // Step 3: Delete old related data
        await supabaseAdmin.from('reservation_segments').delete().eq('reservation_id', reservationId);
        await supabaseAdmin.from('reservation_flights').delete().eq('reservation_id', reservationId); // This will cascade to itineraries
        await supabaseAdmin.from('reservation_hotels').delete().eq('reservation_id', reservationId); // This will cascade to accommodations and inclusions
        await supabaseAdmin.from('reservation_tours').delete().eq('reservation_id', reservationId);
        await supabaseAdmin.from('reservation_medical_assistances').delete().eq('reservation_id', reservationId);
        await supabaseAdmin.from('reservation_installments').delete().eq('reservation_id', reservationId);


        // Step 4: Insert new related data
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
                        departure_time: i.departureTime || null,
                        arrival_time: i.arrivalTime || null,
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

        res.status(200).json({ id: reservationId });

    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ message: 'Error updating reservation' });
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
  // TODO: Reemplazar con el ID del usuario autenticado desde el middleware de autenticación
  const requested_by_id = 'a0e0f8b0-5c2a-4d3d-8e7f-9b1c2d3e4f5a'; // ID de usuario de ejemplo
  const { section, changes, reason } = req.body;

  if (!section || !changes || !reason) {
    return res.status(400).json({ message: 'Faltan datos para la solicitud de cambio (sección, cambios, motivo).' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('change_requests')
      .insert({
        reservation_id: id,
        requested_by_id: requested_by_id,
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

app.post('/api/reservations/:id/approve', async (req, res) => {
  const { id } = req.params;
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
      .update({ status: 'confirmed', invoice_number: newInvoiceNumber })
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


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});