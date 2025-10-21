const express = require('express');
const multer = require('multer');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  deleteAvatar,
} = require('../controllers/users.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todos los endpoints de usuarios requieren autenticación
router.get('/', authenticateToken, getAllUsers);
router.get('/:id', authenticateToken, getUserById);

// Solo administradores y gestores pueden crear usuarios
router.post('/', authenticateToken, requireRole('administrador', 'gestor'), createUser);

// Solo administradores y gestores pueden actualizar usuarios
router.put('/:id', authenticateToken, requireRole('administrador', 'gestor'), updateUser);

// Solo administradores pueden eliminar usuarios
router.delete('/:id', authenticateToken, requireRole('administrador'), deleteUser);

// Los usuarios pueden actualizar su propio avatar (con rate limiting)
router.put('/:id/avatar', uploadLimiter, authenticateToken, upload.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', authenticateToken, deleteAvatar);

module.exports = router;
