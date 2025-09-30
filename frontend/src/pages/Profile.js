import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Save, 
  Key,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';

const Profile = () => {
  const { currentUser, setCurrentUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

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

    // In a real app, you'd call an API to update the password.
    // For this mock, we'll just update the context.
    setCurrentUser({ ...currentUser, password: profileData.newPassword });
    setProfileData(prev => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  return (
    <motion.div
      className="p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:.border-blue-500"
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
    </motion.div>
  );
};

export default Profile;
