const express = require('express');
const router = express.Router();

const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  createNotification
} = require('../controllers/notifications.controller');

// GET all notifications for a user
// Query params: unreadOnly (boolean), limit (number), offset (number)
router.get('/user/:userId', getUserNotifications);

// GET unread count for a user
router.get('/user/:userId/unread-count', getUnreadCount);

// PUT mark notification as read
router.put('/:id/read', markAsRead);

// PUT mark notification as unread
router.put('/:id/unread', markAsUnread);

// PUT mark all notifications as read for a user
router.put('/user/:userId/read-all', markAllAsRead);

// DELETE a notification
router.delete('/:id', deleteNotification);

// POST create a manual notification
router.post('/', createNotification);

module.exports = router;
