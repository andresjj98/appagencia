import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Lock, Key, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const Profile = () => {
  const { currentUser, login } = useAuth(); // Usamos el contexto de autenticación
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser.email}`,
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [currentUser]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const response = await fetch(`http://localhost:4000/api/usuarios/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          avatar: profileData.avatar,
        }),
      });

      const updatedUser = await response.json();

      if (!response.ok) {
        throw new Error(updatedUser.message || 'Error al actualizar el perfil.');
      }

      login(updatedUser); // Actualiza el usuario en el contexto global
      setProfileMessage({ text: '¡Perfil actualizado con éxito!', type: 'success' });
    } catch (error) {
      setProfileMessage({ text: error.message, type: 'error' });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 4000);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (profileData.newPassword !== profileData.confirmNewPassword) {
      setPasswordMessage({ text: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }

    if (profileData.newPassword.length < 8) {
      setPasswordMessage({ text: 'La contraseña debe tener al menos 8 caracteres.', type: 'error' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch(`http://localhost:4000/api/usuarios/${currentUser.id}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: profileData.newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar la contraseña.');
      }

      setProfileData((prev) => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
      setPasswordMessage({ text: '¡Contraseña cambiada con éxito!', type: 'success' });
    } catch (error) {
      setPasswordMessage({ text: error.message, type: 'error' });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setPasswordMessage({ text: '', type: '' }), 4000);
    }
  };

  if (!currentUser) {
    return <div>Cargando perfil...</div>;
  }

  return (
    <motion.div
      className="p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <User className="w-7 h-7 text-blue-600" />
          Información Personal
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="flex items-center gap-4">
            <img
              src={profileData.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover shadow-md"
            />
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
          {profileMessage.text && (
            <motion.p
              className={`${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} font-medium flex items-center gap-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {profileMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {profileMessage.text}
            </motion.p>
          )}
          <motion.button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="w-5 h-5" />
            {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
          </motion.button>
        </form>
      </motion.div>

      <motion.div
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Lock className="w-7 h-7 text-purple-600" />
          Cambiar Contraseña
        </h2>
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
          {passwordMessage.text && (
            <motion.p
              className={`${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} font-medium flex items-center gap-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {passwordMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {passwordMessage.text}
            </motion.p>
          )}
          <motion.button
            type="submit"
            disabled={isSavingPassword}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Key className="w-5 h-5" />
            {isSavingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
