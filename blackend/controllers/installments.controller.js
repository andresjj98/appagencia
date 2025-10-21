const { supabaseAdmin } = require('../supabase');

const uploadReceipt = async (req, res) => {
  const { installment_id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    const filePath = `receipts/${installment_id}/${Date.now()}-${file.originalname}`;
    
    const { error: uploadError } = await supabaseAdmin.storage.from('receipts').upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) {
      console.error('Error uploading receipt to Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabaseAdmin.storage.from('receipts').getPublicUrl(filePath);
    
    const { data, error: updateError } = await supabaseAdmin
      .from('reservation_installments')
      .update({ receipt_url: urlData.publicUrl })
      .eq('id', installment_id)
      .select();

    if (updateError) {
      console.error('Error updating installment with receipt URL:', updateError);
      throw new Error('Failed to update installment with receipt URL.');
    }

    res.status(200).json({ message: 'Receipt uploaded successfully.', data });

  } catch (error) {
    console.error('Server error in receipt upload:', error);
    res.status(500).json({ message: 'Server error.', details: error.message });
  }
};

const updateInstallmentStatus = async (req, res) => {
    const { installment_id } = req.params;
    const { status } = req.body;
    const userRole = req.user?.role || null; // Puede ser null si no hay autenticación

    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }

    try {
        // Primero obtener la cuota para verificar su estado actual
        const { data: installmentData, error: fetchError } = await supabaseAdmin
            .from('reservation_installments')
            .select('reservation_id, status, payment_date')
            .eq('id', installment_id)
            .single();

        if (fetchError || !installmentData) {
            console.error('Error fetching installment:', fetchError);
            return res.status(404).json({ message: 'Installment not found.' });
        }

        // VALIDACIÓN: Solo superadmin puede editar cuotas ya pagadas
        // Si no hay usuario autenticado (userRole = null), se trata como usuario sin permisos especiales
        if (installmentData.status === 'paid' && userRole !== 'superadmin') {
            return res.status(403).json({
                message: 'No tienes permisos para modificar una cuota que ya ha sido pagada. Solo los superadministradores pueden realizar esta acción.'
            });
        }

        const reservationId = installmentData.reservation_id;

        // Obtener la información de la reserva
        const { data: reservationData, error: reservationFetchError } = await supabaseAdmin
            .from('reservations')
            .select('payment_option')
            .eq('id', reservationId)
            .single();

        if (reservationFetchError) {
            console.error('Error fetching reservation:', reservationFetchError);
        }

        // Actualizar el estado de la cuota
        const updateData = { status: status };

        // Si se marca como pagado, agregar la fecha de pago actual
        if (status === 'paid') {
            updateData.payment_date = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }

        // Si se cambia de pagado a otro estado, limpiar la fecha de pago (solo superadmin puede hacer esto)
        if (status !== 'paid' && installmentData.status === 'paid' && userRole === 'superadmin') {
            updateData.payment_date = null;
        }

        const { data, error } = await supabaseAdmin
            .from('reservation_installments')
            .update(updateData)
            .eq('id', installment_id)
            .select();

        if (error) {
            throw error;
        }

        // Si la reserva es de pago completo, actualizar el payment_status de la reserva
        if (reservationData && reservationData.payment_option === 'full_payment') {
            const reservationUpdateData = {
                payment_status: status
            };

            // Si se marca como pagado, actualizar también la fecha de pago de la reserva
            if (status === 'paid') {
                reservationUpdateData.payment_date = new Date().toISOString().split('T')[0];
            }

            const { error: reservationError } = await supabaseAdmin
                .from('reservations')
                .update(reservationUpdateData)
                .eq('id', reservationId);

            if (reservationError) {
                console.error('Error updating reservation payment status:', reservationError);
                // No lanzamos error aquí para no fallar la actualización de la cuota
            } else {
                console.log(`Payment status updated for reservation ${reservationId}: ${status}`);
            }
        }

        res.status(200).json({ message: 'Installment status updated successfully.', data });
    } catch (error) {
        console.error('Error updating installment status:', error);
        res.status(500).json({ message: 'Server error.', details: error.message });
    }
};

/**
 * Actualizar detalles completos de una cuota (monto, fecha de vencimiento, etc.)
 * Solo para superadministradores
 */
const updateInstallmentDetails = async (req, res) => {
    const { installment_id } = req.params;
    const { amount, due_date, status, payment_date } = req.body;
    const userRole = req.user?.role;

    // Validar que solo superadmin puede acceder a esta función
    if (userRole !== 'superadmin') {
        return res.status(403).json({
            message: 'No tienes permisos para modificar los detalles de las cuotas. Solo los superadministradores pueden realizar esta acción.'
        });
    }

    try {
        // Construir objeto de actualización con solo los campos proporcionados
        const updateData = {};

        if (amount !== undefined) updateData.amount = amount;
        if (due_date !== undefined) updateData.due_date = due_date;
        if (status !== undefined) updateData.status = status;
        if (payment_date !== undefined) updateData.payment_date = payment_date;

        // Validar que hay al menos un campo para actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
        }

        const { data, error } = await supabaseAdmin
            .from('reservation_installments')
            .update(updateData)
            .eq('id', installment_id)
            .select();

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Installment not found.' });
        }

        res.status(200).json({
            message: 'Detalles de la cuota actualizados exitosamente.',
            data: data[0]
        });
    } catch (error) {
        console.error('Error updating installment details:', error);
        res.status(500).json({ message: 'Server error.', details: error.message });
    }
};

module.exports = {
  uploadReceipt,
  updateInstallmentStatus,
  updateInstallmentDetails,
};