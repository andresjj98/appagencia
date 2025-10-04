/**
 * Formatea un nombre completo para mostrar solo el primer nombre y primer apellido
 * @param {string} fullName - Nombre completo del usuario
 * @returns {string} - Primer nombre y primer apellido
 */
export const formatUserName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  // Primer nombre y primer apellido
  return `${parts[0]} ${parts[1]}`;
};
