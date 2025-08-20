import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MailOpen, Mail, Trash2, Eye, EyeOff } from 'lucide-react';

// Mock data for notifications
const mockNotifications = [
  {
    id: '1',
    title: 'Nueva Reserva Confirmada',
    message: 'La reserva #INV-2025-001 para París ha sido confirmada.',
    date: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    type: 'reservation'
  },
  {
    id: '2',
    title: 'Documento Pendiente',
    message: 'El cliente Juan Pérez tiene un documento pendiente de subir para la reserva #INV-2025-002.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    type: 'document'
  },
  {
    id: '3',
    title: 'Pago Recibido',
    message: 'Se ha recibido un pago parcial para la reserva #INV-2025-003.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    type: 'payment'
  },
  {
    id: '4',
    title: 'Recordatorio de Vuelo',
    message: 'El vuelo para la reserva #INV-2025-004 sale en 24 horas.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: false,
    type: 'flight'
  },
  {
    id: '5',
    title: 'Nueva Solicitud de Cliente',
    message: 'El cliente María García ha enviado una nueva consulta.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    read: true,
    type: 'client'
  },
  {
    id: '6',
    title: 'Actualización de Política',
    message: 'Se han actualizado las políticas de cancelación. Revisa los cambios.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    read: false,
    type: 'system'
  },
  {
    id: '7',
    title: 'Reserva Cancelada',
    message: 'La reserva #INV-2025-005 ha sido cancelada por el cliente.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    read: true,
    type: 'reservation'
  },
  {
    id: '8',
    title: 'Alerta de Seguridad',
    message: 'Se detectó un intento de inicio de sesión sospechoso en tu cuenta.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    read: false,
    type: 'security'
  },
  {
    id: '9',
    title: 'Promoción Especial',
    message: '¡Nuevas ofertas de verano disponibles! No te las pierdas.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    read: false,
    type: 'marketing'
  },
  {
    id: '10',
    title: 'Mantenimiento Programado',
    message: 'La plataforma estará en mantenimiento el 25 de enero a las 3 AM.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
    read: true,
    type: 'system'
  },
  {
    id: '11',
    title: 'Reserva Completada',
    message: 'La reserva #INV-2025-006 ha finalizado con éxito.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9), // 9 days ago
    read: false,
    type: 'reservation'
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  const toggleReadStatus = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: !n.read } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
                key={unreadCount} // Key for animation on count change
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
                          <div>
                            <p className={`font-semibold ${notification.read ? 'text-gray-800' : 'text-blue-800'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.date)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <motion.button
                              onClick={() => toggleReadStatus(notification.id)}
                              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {notification.read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                            </motion.button>
                            <motion.button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
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
                <div className="p-4 border-t border-gray-200 text-center">
                  <motion.button
                    onClick={() => setShowDropdown(false)}
                    className="text-blue-600 font-medium hover:underline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ver todas las notificaciones (próximamente)
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main content for notifications page (e.g., full list, filters, etc.) */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Todas las Notificaciones</h3>
        <p className="text-gray-600">Aquí se mostrará una lista completa de todas tus notificaciones con opciones de filtrado y búsqueda.</p>
        {/* This section would be expanded with a full table/list of notifications */}
        <ul className="mt-6 space-y-4">
          {notifications.map(n => (
            <li key={n.id} className={`p-4 rounded-lg shadow-sm flex items-center justify-between ${n.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}>
              <div>
                <p className={`font-semibold ${n.read ? 'text-gray-800' : 'text-blue-800'}`}>{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => toggleReadStatus(n.id)}
                  className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {n.read ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
                <motion.button
                  onClick={() => deleteNotification(n.id)}
                  className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default Notifications;