export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Parse a "YYYY-MM-DD" date string in the local timezone.
// Returns `null` when the input is falsy or invalid.
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('-').map(Number);
  if (parts.length < 3) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
};

export const formatDate = (date) => {
  const d = parseLocalDate(date);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
 }).format(d);
};

export const formatShortDate = (date) => {
  const d = parseLocalDate(date);
  if (!d) return '';
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric'
   }).format(d);
};

export const generateReservationId = () => {
  return 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

export const calculateDays = (startDate, endDate) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return 0;
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusBadge = (status, type = 'reservation') => {
  const statusConfig = type === 'reservation' ? 
    require('./constants').RESERVATION_STATUS : 
    require('./constants').PAYMENT_STATUS;
  
  return statusConfig[status] || statusConfig.pending;
};