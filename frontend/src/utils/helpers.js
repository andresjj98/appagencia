export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const generateReservationId = () => {
  return 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

export const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusBadge = (status, type = 'reservation') => {
  const statusConfig = type === 'reservation' ? 
    require('./constants').RESERVATION_STATUS : 
    require('./constants').PAYMENT_STATUS;
  
  return statusConfig[status] || statusConfig.pending;
};