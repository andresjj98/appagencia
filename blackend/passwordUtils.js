const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Genera un hash bcrypt a partir de una contraseña en texto plano.
 * @param {string} password - Contraseña en texto plano.
 * @returns {Promise<string>} - Hash generado.
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compara una contraseña en texto plano con un hash bcrypt.
 * @param {string} password - Contraseña en texto plano.
 * @param {string} hash - Hash almacenado.
 * @returns {Promise<boolean>} - true si coincide, false en caso contrario.
 */
function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};