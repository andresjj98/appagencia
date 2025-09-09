export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Parse a date value (Date instance or "YYYY-MM-DD" string) in the local timezone.
// Returns `null` when the input is falsy or invalid.
const parseLocalDate = (value) => {
  if (!value) return null;

  // If it's already a Date instance, validate and return it
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a string (e.g. "YYYY-MM-DD") parse it manually to avoid timezone issues
  if (typeof value === 'string') {
    const parts = value.split('-').map(Number);
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  // Unsupported type
  return null;
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Parse a date value (Date instance or "YYYY-MM-DD" string) in the local timezone.
// Returns `null` when the input is falsy or invalid.
const parseLocalDate = (value) => {
  if (!value) return null;

  // If it's already a Date instance, validate and return it
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a string, try parsing it directly first
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Fallback for "YYYY-MM-DD" format if direct parsing fails
    const parts = value.split('-').map(Number);
    if (parts.length >= 3) {
      const [year, month, day] = parts;
      const fallbackDate = new Date(year, month - 1, day);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }
  }

  // Unsupported type
  return null;
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

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Parse a date value (Date instance or "YYYY-MM-DD" string) in the local timezone.
// Returns `null` when the input is falsy or invalid.
const parseLocalDate = (value) => {
  if (!value) return null;

  // If it's already a Date instance, validate and return it
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a string, try parsing it directly first
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Fallback for "YYYY-MM-DD" format if direct parsing fails
    const parts = value.split('-').map(Number);
    if (parts.length >= 3) {
      const [year, month, day] = parts;
      const fallbackDate = new Date(year, month - 1, day);
      return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }
  }

  // Unsupported type
  return null;
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

