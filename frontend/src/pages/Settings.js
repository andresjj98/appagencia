import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings as SettingsIcon, 
  Lock, 
  Mail, 
  Image, 
  Save, 
  Palette, 
  Bell, 
  Globe,
  Key,
  CheckCircle,
  XCircle,
  Briefcase // For Business Settings
} from 'lucide-react';
import { currentUser, setCurrentUser } from '../mock/users';
import { USER_ROLES } from '../utils/constants';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'business'

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    newPassword: '',
    confirmNewPassword: ''
  });
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    notificationsEnabled: true,
    defaultCurrency: 'EUR',
    language: 'es',
  });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [appSettingsUpdateSuccess, setAppSettingsUpdateSuccess] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setCurrentUser({ ...currentUser, name: profileData.name, email: profileData.email, avatar: profileData.avatar });
    setProfileUpdateSuccess(true);
    setTimeout(() => setProfileUpdateSuccess(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordChangeSuccess(false);
    setPasswordChangeError('');

    if (profileData.newPassword !== profileData.confirmNewPassword) {
      setPasswordChangeError('Las contraseñas no coinciden. ¡Asegúrate de que tus dedos saben lo que hacen!');
      return;
    }
    if (profileData.newPassword.length < 6) {
      setPasswordChangeError('La contraseña debe tener al menos 6 caracteres. ¡No seas tan fácil!');
      return;
    }

    setCurrentUser({ ...currentUser, password: profileData.newPassword });
    setProfileData(prev => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  const handleAppSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAppSettingsSubmit = (e) => {
    e.preventDefault();
    console.log('App Settings Saved:', appSettings);
    setAppSettingsUpdateSuccess(true);
    setTimeout(() => setAppSettingsUpdateSuccess(false), 3000);
  };

  return (
    <motion.div
      className="p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Navigation Bar for Settings */}
      <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100 flex items-center justify-around">
        <motion.button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <User className="w-5 h-5" />
          Mi Perfil
        </motion.button>
        {['admin', 'manager'].includes(currentUser.role) && (
          <motion.button
            onClick={() => setActiveTab('business')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'business'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Briefcase className="w-5 h-5" />
            Configuración del Negocio
          </motion.button>
        )}
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Profile Settings */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <User className="w-7 h-7 text-blue-600" />
              Información Personal
            </h3>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <img src={profileData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-md" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Avatar
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {profileUpdateSuccess && (
                <motion.p 
                  className="text-green-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle className="w-5 h-5" /> ¡Perfil actualizado con éxito!
                </motion.p>
              )}
              <motion.button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-5 h-5" />
                Guardar Cambios
              </motion.button>
            </form>
          </motion.div>

          {/* Password Change */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Lock className="w-7 h-7 text-purple-600" />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={profileData.confirmNewPassword}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              {passwordChangeError && (
                <motion.p 
                  className="text-red-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <XCircle className="w-5 h-5" /> {passwordChangeError}
                </motion.p>
              )}
              {passwordChangeSuccess && (
                <motion.p 
                  className="text-green-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle className="w-5 h-5" /> ¡Contraseña cambiada con éxito!
                </motion.p>
              )}
              <motion.button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Key className="w-5 h-5" />
                Cambiar Contraseña
              </motion.button>
            </form>
          </motion.div>
        </>
      )}

      {activeTab === 'business' && ['admin', 'manager'].includes(currentUser.role) && (
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-green-600" />
            Configuración General de la Aplicación
          </h3>
          <form onSubmit={handleAppSettingsSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema de la Interfaz
              </label>
              <select
                name="theme"
                value={appSettings.theme}
                onChange={handleAppSettingsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro (¡Próximamente!)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="notificationsEnabled"
                name="notificationsEnabled"
                checked={appSettings.notificationsEnabled}
                onChange={handleAppSettingsChange}
                className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="notificationsEnabled" className="text-sm font-medium text-gray-700">
                Habilitar Notificaciones
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda por Defecto
              </label>
              <select
                name="defaultCurrency"
                value={appSettings.defaultCurrency}
                onChange={handleAppSettingsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar Americano ($)</option>
                <option value="GBP">Libra Esterlina (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select
                name="language"
                value={appSettings.language}
                onChange={handleAppSettingsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="es">Español</option>
                <option value="en">Inglés</option>
              </select>
            </div>
            {appSettingsUpdateSuccess && (
              <motion.p 
                className="text-green-600 font-medium flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle className="w-5 h-5" /> ¡Configuración guardada con éxito!
              </motion.p>
            )}
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-5 h-5" />
              Guardar Configuración
            </motion.button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Settings;