import React from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Plane,
  LogOut,
  User,
  FileText,
  DollarSign,
  ClipboardList,
  Bell
} from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';
import { USER_ROLES, hasPermission } from '../../utils/constants';

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const { currentUser } = useAuth();
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'reservations', label: 'Reservas', icon: Calendar, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'gestion', label: 'Gestion', icon: Users, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'documentation', label: 'Documentación', icon: FileText, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'finance', label: 'Finanzas', icon: DollarSign, roles: ['administrador', 'gestor'] },
    { id: 'reports', label: 'Reportes', icon: ClipboardList, roles: ['administrador', 'gestor'] },
    { id: 'analytics', label: 'Análisis', icon: BarChart3, roles: ['administrador', 'gestor'] },
    { id: 'notifications', label: 'Notificaciones', icon: Bell, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'profile', label: 'Mi Perfil', icon: User, roles: ['administrador', 'gestor', 'asesor'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['administrador', 'gestor'] }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    hasPermission(currentUser, item.roles)
  );

  return (
    <motion.div 
      className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-lg"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TravelBooking</h1>
            <p className="text-sm text-gray-500">Gestión de Reservas</p>
          </div>
        </motion.div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover"
            key={currentUser.avatar}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500">
              {USER_ROLES[currentUser.role].label}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <motion.li key={item.id}>
                <motion.button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <motion.button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;