const { supabaseAdmin } = require('../supabase');

/**
 * Obtener todos los documentos generados
 * Filtrado por rol y permisos del usuario
 */
const getAllDocuments = async (req, res) => {
  const { userId, userRole, officeId, type, reservation_id } = req.query;

  try {
    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        reservations!inner(
          id,
          office_id,
          advisor_id,
          clients(name, last_name)
        )
      `);

    // Filtrar por rol y permisos (similar a reservations)
    if (userRole === 'asesor' && userId) {
      query = query.eq('reservations.advisor_id', userId);
    } else if ((userRole === 'administrador' || userRole === 'gestor') && officeId) {
      query = query.eq('reservations.office_id', officeId);
    }

    // Filtros adicionales
    if (type) {
      query = query.eq('type', type);
    }

    if (reservation_id) {
      query = query.eq('reservation_id', reservation_id);
    }

    const { data, error } = await query.order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents from Supabase:', error);
      return res.status(500).json({ message: 'Error al obtener documentos' });
    }

    // Formatear respuesta con nombre del cliente
    const formattedData = data.map(doc => ({
      ...doc,
      client_name: doc.reservations?.clients
        ? `${doc.reservations.clients.name} ${doc.reservations.clients.last_name}`.trim()
        : null
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error in getAllDocuments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Obtener un documento por ID
 */
const getDocumentById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        reservations(
          *,
          clients(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching document from Supabase:', error);
      return res.status(500).json({ message: 'Error al obtener documento' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Crear un nuevo registro de documento
 */
const createDocument = async (req, res) => {
  const {
    reservation_id,
    type,
    document_number,
    data_snapshot
  } = req.body;

  // Validación
  if (!reservation_id || !type) {
    return res.status(400).json({
      message: 'reservation_id y type son requeridos'
    });
  }

  try {
    // Verificar que la reserva existe
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // Crear el documento
    const documentData = {
      reservation_id,
      type,
      document_number,
      data_snapshot: data_snapshot || {},
      generated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating document in Supabase:', error);
      return res.status(500).json({ message: 'Error al crear documento' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error in createDocument:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Obtener documentos de una reserva específica
 */
const getDocumentsByReservation = async (req, res) => {
  const { reservation_id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('reservation_id', reservation_id)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents from Supabase:', error);
      return res.status(500).json({ message: 'Error al obtener documentos' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in getDocumentsByReservation:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Eliminar un documento
 */
const deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document from Supabase:', error);
      return res.status(500).json({ message: 'Error al eliminar documento' });
    }

    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  getDocumentsByReservation,
  deleteDocument
};
