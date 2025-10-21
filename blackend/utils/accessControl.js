const { supabaseAdmin } = require('../supabase');

const normalizeRole = (role) => {
  if (!role) return '';
  const lower = role.toLowerCase();

  if (lower === 'admin') return 'administrador';
  if (lower === 'manager') return 'gestor';
  if (lower === 'advisor') return 'asesor';

  return lower;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureReservationAccess = async (reservationId, user) => {
  const numericId = Number(reservationId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError(400, 'ID de reserva invalido.');
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('id, advisor_id, office_id')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    console.error('Error fetching reservation for access control:', error);
    throw createHttpError(404, 'Reserva no encontrada.');
  }

  if (user?.isSuperAdmin) {
    return data;
  }

  const normalizedRole = normalizeRole(user?.role);

  if (normalizedRole === 'superadmin') {
    return data;
  }
  const userId = user?.id;
  const officeId = user?.officeId ?? null;

  if (normalizedRole === 'gestor') {
    return data;
  }

  if (normalizedRole === 'administrador') {
    if (!officeId || !data.office_id || data.office_id === officeId) {
      return data;
    }
    throw createHttpError(403, 'No tienes permisos para esta reserva.');
  }

  if (normalizedRole === 'asesor' && data.advisor_id === userId) {
    return data;
  }

  throw createHttpError(403, 'No tienes permisos para esta reserva.');
};

const ensureInstallmentAccess = async (installmentId, user) => {
  const numericId = Number(installmentId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createHttpError(400, 'ID de cuota invalido.');
  }

  const { data, error } = await supabaseAdmin
    .from('reservation_installments')
    .select('id, reservation_id, status, payment_date')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    console.error('Error fetching installment for access control:', error);
    throw createHttpError(404, 'Cuota no encontrada.');
  }

  const reservation = await ensureReservationAccess(data.reservation_id, user);

  return {
    installment: data,
    reservation,
  };
};

module.exports = {
  ensureReservationAccess,
  ensureInstallmentAccess,
};
