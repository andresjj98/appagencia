import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MailOpen, Mail, Trash2, Eye, EyeOff, CheckCircle, XCircle, Info } from 'lucide-react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentUser } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/notifications/user/${currentUser.id}`);
      // Transform dates from ISO strings to Date objects
      const transformedData = response.data.map(n => ({
        ...n,
        date: new Date(n.created_at),
        read: n.read
      }));
      setNotifications(transformedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const toggleReadStatus = async (id, currentReadStatus) => {
    try {
      const endpoint = currentReadStatus
        ? `/notifications/${id}/unread`
        : `/notifications/${id}/read`;

      await api.put(endpoint);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: !currentReadStatus } : n)
      );
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await api.put(`/notifications/user/${currentUser.id}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reservation_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'reservation_rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'reservation_created':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (notification) => {
    if (notification.read) return 'bg-white';

    switch (notification.type) {
      case 'reservation_approved':
        return 'bg-green-50';
      case 'reservation_rejected':
        return 'bg-red-50';
      case 'reservation_created':
        return 'bg-blue-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getNotificationBorderColor = (notification) => {
    if (notification.read) return '';

    switch (notification.type) {
      case 'reservation_approved':
        return 'border border-green-200';
      case 'reservation_rejected':
        return 'border border-red-200';
      case 'reservation_created':
        return 'border border-blue-200';
      default:
        return 'border border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>

        <div className="relative">
          <motion.button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Notificaciones Recientes</h3>
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={markAllAsRead}
                      className="text-blue-600 text-sm hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Marcar todas como leídas
                    </motion.button>
                  )}
                </div>
                <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map(notification => (
                      <motion.li
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1">
                              <p className={`font-semibold text-sm ${notification.read ? 'text-gray-800' : 'text-blue-800'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.date)} atrás</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <motion.button
                              onClick={() => toggleReadStatus(notification.id, notification.read)}
                              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title={notification.read ? "Marcar como no leída" : "Marcar como leída"}
                            >
                              {notification.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                            </motion.button>
                            <motion.button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.li>
                    ))
                  ) : (
                    <li className="p-4 text-center text-gray-500">No hay notificaciones.</li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content for notifications page */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Todas las Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {unreadCount} sin leer
            </span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No tienes notificaciones</p>
            <p className="text-gray-400 mt-2">Las notificaciones sobre tus reservas aparecerán aquí</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {notifications.map(n => (
              <motion.li
                key={n.id}
                className={`p-4 rounded-lg shadow-sm flex items-start justify-between ${getNotificationBgColor(n)} ${getNotificationBorderColor(n)}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(n.type)}
                  <div className="flex-1">
                    <p className={`font-semibold ${n.read ? 'text-gray-800' : 'text-blue-800'}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(n.date).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => toggleReadStatus(n.id, n.read)}
                    className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={n.read ? "Marcar como no leída" : "Marcar como leída"}
                  >
                    {n.read ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                  <motion.button
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Eliminar notificación"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;
