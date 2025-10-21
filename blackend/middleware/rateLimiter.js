const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter para Login
 * Protege contra ataques de fuerza bruta
 *
 * Configuración:
 * - 5 intentos por ventana de 15 minutos
 * - Bloqueo por IP
 * - Mensajes claros al usuario
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    message: 'Has excedido el límite de intentos de login. Por favor, intenta nuevamente en 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: false, // Cuenta también requests exitosos
  skipFailedRequests: false, // Cuenta también requests fallidos
  // Handler personalizado para cuando se excede el límite
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit excedido en /login desde IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión',
      message: 'Has excedido el límite de intentos de login. Por favor, intenta nuevamente en 15 minutos.',
      retryAfter: '15 minutos'
    });
  }
});

/**
 * Rate Limiter General para la API
 * Protege contra abuso general del API
 *
 * Configuración:
 * - 100 requests por ventana de 15 minutos
 * - Bloqueo por IP
 * - Más permisivo que el de login
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes a la API. Por favor, intenta nuevamente más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit general excedido desde IP: ${req.ip} | Path: ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: 'Has excedido el límite de solicitudes a la API. Por favor, intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

/**
 * Rate Limiter Estricto para operaciones sensibles
 * Para endpoints de creación/modificación/eliminación
 *
 * Configuración:
 * - 20 requests por ventana de 15 minutos
 * - Para operaciones POST/PUT/DELETE
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 requests
  message: {
    error: 'Demasiadas operaciones',
    message: 'Has excedido el límite de operaciones permitidas. Por favor, intenta nuevamente más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit estricto excedido desde IP: ${req.ip} | ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas operaciones',
      message: 'Has excedido el límite de operaciones permitidas. Por favor, intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

/**
 * Rate Limiter para Upload de Archivos
 * Previene abuso de endpoints de upload
 *
 * Configuración:
 * - 10 uploads por ventana de 15 minutos
 * - Muy restrictivo debido al costo de procesamiento
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 uploads
  message: {
    error: 'Demasiados uploads',
    message: 'Has excedido el límite de subida de archivos. Por favor, intenta nuevamente más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit de uploads excedido desde IP: ${req.ip} | Path: ${req.path}`);
    res.status(429).json({
      error: 'Demasiados uploads',
      message: 'Has excedido el límite de subida de archivos. Por favor, intenta nuevamente más tarde.',
      retryAfter: '15 minutos'
    });
  }
});

module.exports = {
  loginLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter
};
