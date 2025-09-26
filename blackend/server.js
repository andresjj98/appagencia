require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { hashPassword, comparePassword } = require('./passwordUtils');
const { supabaseAdmin } = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const formatTimeToTimestamp = (timeStr) => {
  if (!timeStr) return null;
  if (/\d{4}-\d{2}-\d{2}T/.test(timeStr)) return timeStr;
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
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// ... (other user, office endpoints remain the same) ...

app.get('/api/reservations', async (req, res) => {
  const { userId, userRole, reservation_type } = req.query;
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
});

app.get('/api/reservations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let { data, error } = await supabaseAdmin
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

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... (POST /api/reservations, PUT /api/reservations/:id, etc. remain the same) ...

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
      const attachmentData = { reservation_id, title: item.title, observation: item.observation };
      if (item.id) {
        attachmentData.id = item.id;
        submittedIds.add(item.id);
      }

      if (item.fileName && filesMap.has(item.fileName)) {
        const file = filesMap.get(item.fileName);
        const filePath = `${reservation_id}/attachments/${Date.now()}-${file.originalname}`;
        
        const { error: uploadError } = await supabaseAdmin.storage.from('arch_pax').upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });
        if (uploadError) {
          console.error('Error uploading file to Supabase Storage:', uploadError);
        } else {
          attachmentData.file_name = file.originalname;
          attachmentData.file_url = filePath; // Store path instead of public URL
        }
      } else {
        attachmentData.file_name = item.file_name;
        attachmentData.file_url = item.file_url; // Keep old path
      }
      
      attachmentsToUpsert.push(attachmentData);
    }

    const { data: currentAttachments, error: fetchError } = await supabaseAdmin.from('reservation_attachments').select('id').eq('reservation_id', reservation_id);
    if (fetchError) throw fetchError;

    const attachmentsToDelete = currentAttachments.filter(att => !submittedIds.has(att.id));
    if (attachmentsToDelete.length > 0) {
      const idsToDelete = attachmentsToDelete.map(att => att.id);
      await supabaseAdmin.from('reservation_attachments').delete().in('id', idsToDelete);
    }
    
    const { data, error } = await supabaseAdmin.from('reservation_attachments').upsert(attachmentsToUpsert).select();
    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Server error in attachment upsert:', error);
    res.status(500).json({ message: 'Error del servidor.', details: error.message });
  }
});

// NEW SECURE URL ENDPOINT
app.post('/api/files/get-secure-url', async (req, res) => {
    const { path, userId } = req.body;

    if (!path || !userId) {
        return res.status(400).json({ message: 'File path and user ID are required.' });
    }

    try {
        // 1. Get user role
        const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('role')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userRole = userData.role;
        let hasPermission = false;

        // Admins and managers have automatic permission
        if (userRole === 'admin' || userRole === 'manager') {
            hasPermission = true;
        } else {
            // 2. For other roles, check if they are the advisor on the reservation
            const reservationId = path.split('/')[0];
            if (!isNaN(reservationId)) {
                const { data: reservationData, error: reservationError } = await supabaseAdmin
                    .from('reservations')
                    .select('advisor_id')
                    .eq('id', reservationId)
                    .single();

                if (reservationData && reservationData.advisor_id === userId) {
                    hasPermission = true;
                }
            }
        }

        // 3. If permission is granted, create signed URL
        if (hasPermission) {
            const { data, error } = await supabaseAdmin
                .storage
                .from('arch_pax')
                .createSignedUrl(path, 60); // URL valid for 60 seconds

            if (error) {
                throw new Error('Could not create signed URL.');
            }
            return res.json({ signedUrl: data.signedUrl });
        } else {
            return res.status(403).json({ message: 'You do not have permission to access this file.' });
        }
    } catch (error) {
        console.error('Error generating secure URL:', error);
        res.status(500).json({ message: error.message });
    }
});

// ... (the rest of the endpoints remain the same) ...

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});