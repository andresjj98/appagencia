const { supabaseAdmin } = require('../supabase');
const { ensureInstallmentAccess } = require('../utils/accessControl');

const respondAccessError = (res, error, fallbackMessage) => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({
    message: fallbackMessage,
    details: error?.message || fallbackMessage,
  });
};

const uploadReceipt = async (req, res) => {
  const { installment_id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    const { installment } = await ensureInstallmentAccess(installment_id, req.user);
    const installmentId = Number(installment.id);
    const filePath = `receipts/${installmentId}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading receipt to Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('receipts')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || null;

    const { data, error: updateError } = await supabaseAdmin
      .from('reservation_installments')
      .update({ receipt_url: publicUrl })
      .eq('id', installmentId)
      .select();

    if (updateError) {
      console.error('Error updating installment with receipt URL:', updateError);
      throw new Error('Failed to update installment with receipt URL.');
    }

    res.status(200).json({ message: 'Receipt uploaded successfully.', data });
  } catch (error) {
    respondAccessError(res, error, 'Error del servidor al subir el comprobante.');
  }
};

const updateInstallmentStatus = async (req, res) => {
  const { installment_id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    const { installment } = await ensureInstallmentAccess(installment_id, req.user);
    const currentRole = (req.user.role || '').toLowerCase();

    if (installment.status === 'paid' && currentRole !== 'superadmin') {
      return res.status(403).json({
        message:
          'No tienes permisos para modificar una cuota que ya ha sido pagada. Solo los superadministradores pueden realizar esta accion.',
      });
    }

    const reservationId = installment.reservation_id;

    const { data: reservationData, error: reservationFetchError } = await supabaseAdmin
      .from('reservations')
      .select('payment_option')
      .eq('id', reservationId)
      .single();

    if (reservationFetchError) {
      console.error('Error fetching reservation:', reservationFetchError);
    }

    const updateData = { status };

    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString().split('T')[0];
    }

    if (status !== 'paid' && installment.status === 'paid' && currentRole === 'superadmin') {
      updateData.payment_date = null;
    }

    const { data, error } = await supabaseAdmin
      .from('reservation_installments')
      .update(updateData)
      .eq('id', installment.id)
      .select();

    if (error) {
      throw error;
    }

    if (reservationData && reservationData.payment_option === 'full_payment') {
      const reservationUpdateData = { payment_status: status };

      if (status === 'paid') {
        reservationUpdateData.payment_date = new Date().toISOString().split('T')[0];
      }

      const { error: reservationError } = await supabaseAdmin
        .from('reservations')
        .update(reservationUpdateData)
        .eq('id', reservationId);

      if (reservationError) {
        console.error('Error updating reservation payment status:', reservationError);
      } else {
        console.log(`Payment status updated for reservation ${reservationId}: ${status}`);
      }
    }

    res.status(200).json({ message: 'Installment status updated successfully.', data });
  } catch (error) {
    respondAccessError(res, error, 'Error al actualizar el estado de la cuota.');
  }
};

const updateInstallmentDetails = async (req, res) => {
  const { installment_id } = req.params;
  const { amount, due_date, status, payment_date } = req.body;
  const userRole = (req.user?.role || '').toLowerCase();

  if (userRole !== 'superadmin') {
    return res.status(403).json({
      message:
        'No tienes permisos para modificar los detalles de las cuotas. Solo los superadministradores pueden realizar esta accion.',
    });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  try {
    await ensureInstallmentAccess(installment_id, req.user);

    const updateData = {};

    if (amount !== undefined) updateData.amount = amount;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (status !== undefined) updateData.status = status;
    if (payment_date !== undefined) updateData.payment_date = payment_date;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar.' });
    }

    const { data, error } = await supabaseAdmin
      .from('reservation_installments')
      .update(updateData)
      .eq('id', Number(installment_id))
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Installment not found.' });
    }

    res.status(200).json({
      message: 'Detalles de la cuota actualizados exitosamente.',
      data: data[0],
    });
  } catch (error) {
    respondAccessError(res, error, 'Error al actualizar los detalles de la cuota.');
  }
};

module.exports = {
  uploadReceipt,
  updateInstallmentStatus,
  updateInstallmentDetails,
};
