require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { hashPassword, comparePassword } = require('./passwordUtils');
const { supabaseAdmin } = require('./supabase');
const { apiLimiter, uploadLimiter } = require('./middleware/rateLimiter');

const app = express();

// ========================================
// CORS Configuration - Seguridad contra ataques cross-origin
// ========================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origen permitido
      callback(null, true);
    } else {
      // Origen bloqueado
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  CORS bloqueó petición desde origen no autorizado: ${origin}`);
      }
      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true, // Permite envío de cookies y headers de autenticación
  optionsSuccessStatus: 200, // Para navegadores legacy
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  exposedHeaders: ['Content-Length', 'X-Request-Id'], // Headers expuestos al cliente
  maxAge: 86400 // Cache de preflight requests (24 horas)
};

app.use(cors(corsOptions));

// Logging de configuración CORS en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('🔒 CORS configurado con orígenes permitidos:', allowedOrigins);
}

app.use(express.json());

// Middleware de debugging para CORS (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin);
      console.log(`📡 ${req.method} ${req.path} | Origen: ${origin} | ${isAllowed ? '✅ Permitido' : '❌ Bloqueado'}`);
    }
    next();
  });
}

// ========================================
// Rate Limiting - Protección contra abuso y fuerza bruta
// ========================================
// Rate limiter general para toda la API
// Límite: 100 requests por 15 minutos por IP
app.use('/api/', apiLimiter);

if (process.env.NODE_ENV === 'development') {
  console.log('🛡️  Rate limiting activado: 100 requests/15min (general), 5 intentos/15min (login)');
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

const formatTimeToTimestamp = (timeStr) => {
  if (!timeStr) return null;
  if (/\d{4}-\d{2}-\d{2}T/.test(timeStr)) return timeStr;
  return `1970-01-01T${timeStr}:00Z`;
};

// Import routes
const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const airportRoutes = require('./routes/airports');
const airlineRoutes = require('./routes/airlines');
const businessSettingsRoutes = require('./routes/businessSettings');
const usersRoutes = require('./routes/users');
const officesRoutes = require('./routes/offices');
const installmentsRoutes = require('./routes/installments');
const notificationsRoutes = require('./routes/notifications');
const transfersRoutes = require('./routes/transfers');
const documentsRoutes = require('./routes/documents');
const changeRequestsRoutes = require('./routes/changeRequests');

// Use routes
app.use('/api', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reservations', transfersRoutes);
app.use('/api/airports', airportRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api/business-settings', businessSettingsRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/offices', officesRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api', changeRequestsRoutes);

// ... (POST /api/reservations, PUT /api/reservations/:id, etc. remain the same) ...

app.post('/api/reservations/:reservation_id/attachments/upsert', uploadLimiter, upload.array('files'), async (req, res) => {
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
// Importar middleware de autenticación
const { authenticateToken } = require('./middleware/auth');

app.post('/api/files/get-secure-url', authenticateToken, async (req, res) => {
    const { path } = req.body;

    // Obtener userId del token JWT autenticado (NO del body)
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!path) {
        return res.status(400).json({ message: 'File path is required.' });
    }

    try {
        // Sanitize the path: if it's a full URL, extract the path from it.
        let cleanPath = path;
        const bucketIdentifier = '/arch_pax/';
        if (path.includes(bucketIdentifier)) {
            cleanPath = path.substring(path.indexOf(bucketIdentifier) + bucketIdentifier.length);
        }

        let hasPermission = false;

        // Admins and managers have automatic permission
        if (userRole === 'administrador' || userRole === 'gestor') {
            hasPermission = true;
        } else {
            // For other roles, check if they are the advisor on the reservation
            const reservationId = cleanPath.split('/')[0];
            if (reservationId && !isNaN(reservationId)) {
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

        // If permission is granted, create signed URL
        if (hasPermission) {
            const { data, error } = await supabaseAdmin
                .storage
                .from('arch_pax')
                .createSignedUrl(cleanPath, 60); // URL valid for 60 seconds

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
  console.log(`Servidor ejecutÃ¡ndose en el puerto ${PORT}`);
});



