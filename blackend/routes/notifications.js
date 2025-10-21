const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notifications.controller');

// GET all notifications for a user - requiere autenticación
// Query params: unreadOnly (boolean), limit (number), offset (number)
router.get('/user/:userId', authenticateToken, getUserNotifications);

// GET unread count for a user - requiere autenticación
router.get('/user/:userId/unread-count', authenticateToken, getUnreadCount);

// PUT mark notification as read - requiere autenticación
router.put('/:id/read', authenticateToken, markAsRead);

// PUT mark notification as unread - requiere autenticación
router.put('/:id/unread', authenticateToken, markAsUnread);

// PUT mark all notifications as read for a user - requiere autenticación
router.put('/user/:userId/read-all', authenticateToken, markAllAsRead);

// DELETE a notification - requiere autenticación
router.delete('/:id', authenticateToken, deleteNotification);

// POST create a manual notification - solo administradores y gestores
router.post('/', authenticateToken, requireRole('administrador', 'gestor'), createNotification);

module.exports = router;
