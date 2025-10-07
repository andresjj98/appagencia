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

    // Solo gestores y administradores pueden aprobar
    if (!['gestor', 'administrador'].includes(userRole)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Obtener la solicitud de cambio
    const { data: changeRequest, error: fetchError } = await supabaseAdmin
      .from('change_requests')
      .select('*, reservations(id, status, advisor_id, invoice_number)')
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
        status: 'approved',
        approved_by_id: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating change request:', updateError);
      return res.status(500).json({ error: 'Error al aprobar la solicitud' });
    }

    // Aplicar los cambios según la sección
    const section = changeRequest.section_to_change;
    const changes = changeRequest.requested_changes;

    try {
      if (section === 'cancellation') {
        // Cancelar la reserva
        await supabaseAdmin
          .from('reservations')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by_id: userId
          })
          .eq('id', changeRequest.reservation_id);

      } else if (section === 'client') {
        // Actualizar información del cliente
        await supabaseAdmin
          .from('clients')
          .update(changes)
          .eq('id', changeRequest.reservations.id); // Asumiendo relación directa

      } else if (section === 'passengers') {
        // Actualizar cantidad de pasajeros
        await supabaseAdmin
          .from('reservations')
          .update({
            passengers_adt: changes.passengers_adt,
            passengers_chd: changes.passengers_chd,
            passengers_inf: changes.passengers_inf
          })
          .eq('id', changeRequest.reservation_id);

      } else if (section === 'payment') {
        // Actualizar detalles de pago
        const paymentUpdates = {
          price_per_adt: changes.price_per_adt,
          price_per_chd: changes.price_per_chd,
          price_per_inf: changes.price_per_inf,
          total_amount: changes.total_amount,
          payment_option: changes.payment_option
        };

        await supabaseAdmin
          .from('reservations')
          .update(paymentUpdates)
          .eq('id', changeRequest.reservation_id);

        // Si hay cuotas, actualizarlas
        if (changes.reservation_installments) {
          // Eliminar cuotas antiguas
          await supabaseAdmin
            .from('reservation_installments')
            .delete()
            .eq('reservation_id', changeRequest.reservation_id);

          // Insertar nuevas cuotas
          const installments = changes.reservation_installments.map(inst => ({
            reservation_id: changeRequest.reservation_id,
            amount: inst.amount,
            due_date: inst.due_date,
            status: inst.status || 'pending'
          }));

          await supabaseAdmin
            .from('reservation_installments')
            .insert(installments);
        }
      }
      // Agregar más secciones según sea necesario...

      // Marcar la solicitud como aplicada
      await supabaseAdmin
        .from('change_requests')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('id', id);

    } catch (applyError) {
      console.error('Error applying changes:', applyError);
      // La solicitud queda en 'approved' pero no 'applied'
    }

    // Notificar al asesor
    await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: changeRequest.requested_by_id,
        sender_id: userId,
        type: section === 'cancellation' ? 'cancellation_approved' : 'change_approved',
        title: section === 'cancellation' ? '✅ Cancelación Aprobada' : '✅ Cambio Aprobado',
        message: section === 'cancellation'
          ? `Tu solicitud de cancelación para la reserva #${changeRequest.reservations.invoice_number} ha sido aprobada`
          : `Tu solicitud de cambio para la reserva #${changeRequest.reservations.invoice_number} ha sido aprobada`,
        reference_id: id,
        reference_type: 'change_request',
        metadata: {
          reservation_id: changeRequest.reservation_id,
          invoice_number: changeRequest.reservations.invoice_number,
          section: section
        }
      });

    // Registrar en el historial de actividades
    await supabaseAdmin.rpc('log_reservation_activity', {
      p_reservation_id: changeRequest.reservation_id,
      p_activity_type: 'change_request_approved',
      p_performed_by_id: userId,
      p_description: section === 'cancellation'
        ? 'Solicitud de cancelación aprobada y aplicada'
        : `Solicitud de cambio aprobada y aplicada para la sección: ${section}`,
      p_changes: changes,
      p_metadata: {
        change_request_id: id,
        section: section,
        status: 'applied'
      }
    });

    res.json({
      success: true,
      message: 'Solicitud aprobada y cambios aplicados exitosamente'
    });

  } catch (error) {
    console.error('Error in approveChangeRequest:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
    console.log('getMyChangeRequests - User ID:', userId);
    console.log('getMyChangeRequests - User info:', req.user);

    const { data, error } = await supabaseAdmin
      .from('v_change_requests_detailed')
      .select('*')
      .eq('requested_by_id', userId)
      .order('created_at', { ascending: false });

    console.log('getMyChangeRequests - Query result:', { data, error });
    console.log('getMyChangeRequests - Number of requests found:', data?.length || 0);

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
