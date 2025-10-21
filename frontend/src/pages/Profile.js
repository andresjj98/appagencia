import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Lock, Key, CheckCircle, XCircle, Upload, Trash2, Camera, Shield, Activity, Edit, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { currentUser, login } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    lastName: '',
    idCard: '',
    username: '',
    email: '',
    avatar: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  const [avatarMessage, setAvatarMessage] = useState({ text: '', type: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        lastName: currentUser.lastName || '',
        idCard: currentUser.idCard || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser.email}`,
        newPassword: '',
        confirmNewPassword: ''
      });
      setAvatarPreview(currentUser.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser.email}`);
    }
  }, [currentUser]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAvatarMessage({ text: 'Solo se permiten imágenes JPG, PNG o WEBP', type: 'error' });
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setAvatarMessage({ text: 'La imagen no debe superar los 2MB', type: 'error' });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatarMessage({ text: '', type: '' });
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) {
      setAvatarMessage({ text: 'Selecciona una imagen primero', type: 'error' });
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await api.put(`/api/usuarios/${currentUser.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      login(response.data.user);
      setSelectedFile(null);
      setAvatarMessage({ text: '¡Avatar actualizado con éxito!', type: 'success' });
    } catch (error) {
      setAvatarMessage({ text: error.response?.data?.message || error.message, type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => setAvatarMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('¿Estás seguro de eliminar tu foto de perfil?')) {
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarMessage({ text: '', type: '' });

    try {
      const response = await api.delete(`/api/usuarios/${currentUser.id}/avatar`);

      login(response.data.user);
      setSelectedFile(null);
      setAvatarPreview(response.data.user.avatar);
      setAvatarMessage({ text: '¡Avatar eliminado con éxito!', type: 'success' });
    } catch (error) {
      setAvatarMessage({ text: error.response?.data?.message || error.message, type: 'error' });
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => setAvatarMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const response = await api.put(`/api/usuarios/${currentUser.id}`, {
        name: profileData.name,
        lastName: profileData.lastName,
        idCard: profileData.idCard,
        username: profileData.username,
        email: profileData.email,
        role: currentUser.role, // Mantener el rol actual
      });

      login(response.data);
      setProfileMessage({ text: '¡Perfil actualizado con éxito!', type: 'success' });
      setIsEditingProfile(false); // Cerrar el modo de edición
    } catch (error) {
      setProfileMessage({ text: error.response?.data?.message || error.message, type: 'error' });
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
      await api.put(`/api/usuarios/${currentUser.id}/change-password`, {
        password: profileData.newPassword
      });

      setProfileData((prev) => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
      setPasswordMessage({ text: '¡Contraseña cambiada con éxito!', type: 'success' });
    } catch (error) {
      setPasswordMessage({ text: error.response?.data?.message || error.message, type: 'error' });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setPasswordMessage({ text: '', type: '' }), 4000);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-red-100 text-red-800', icon: Shield },
      manager: { label: 'Gerente', color: 'bg-blue-100 text-blue-800', icon: User },
      advisor: { label: 'Asesor', color: 'bg-green-100 text-green-800', icon: User },
    };

    const config = roleConfig[role] || roleConfig.advisor;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getActiveBadge = (active) => {
    return active ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <Activity className="w-4 h-4" />
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        <Activity className="w-4 h-4" />
        Inactivo
      </span>
    );
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
      {/* Foto de Perfil */}
      <motion.div
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Camera className="w-7 h-7 text-purple-600" />
          Foto de Perfil
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover shadow-lg ring-4 ring-purple-100"
            />
          </div>

          <div className="flex-1 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
            />

            <div className="flex flex-wrap gap-3">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-5 h-5" />
                Seleccionar Imagen
              </motion.button>

              {selectedFile && (
                <motion.button
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={isUploadingAvatar}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Save className="w-5 h-5" />
                  {isUploadingAvatar ? 'Subiendo...' : 'Guardar Foto'}
                </motion.button>
              )}

              <motion.button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={isUploadingAvatar}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trash2 className="w-5 h-5" />
                Eliminar Foto
              </motion.button>
            </div>

            <p className="text-sm text-gray-500">
              Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 2MB
            </p>

            {avatarMessage.text && (
              <motion.p
                className={`${avatarMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} font-medium flex items-center gap-2`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {avatarMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {avatarMessage.text}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Información Personal */}
      <motion.div
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-7 h-7 text-blue-600" />
            Información Personal
          </h2>

          {!isEditingProfile ? (
            <motion.button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit className="w-5 h-5" />
              Editar
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={() => {
                setIsEditingProfile(false);
                // Restaurar datos originales
                setProfileData({
                  name: currentUser.name || '',
                  lastName: currentUser.lastName || '',
                  idCard: currentUser.idCard || '',
                  username: currentUser.username || '',
                  email: currentUser.email || '',
                  avatar: currentUser.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${currentUser.email}`,
                  newPassword: '',
                  confirmNewPassword: ''
                });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              Cancelar
            </motion.button>
          )}
        </div>

        {/* Campos de Solo Lectura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Rol</label>
            {getRoleBadge(currentUser.role)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
            {getActiveBadge(currentUser.active)}
          </div>
        </div>

        {!isEditingProfile ? (
          /* Vista de Solo Lectura */
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                <p className="text-lg font-medium text-gray-900">{profileData.name || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
                <p className="text-lg font-medium text-gray-900">{profileData.lastName || 'No especificado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cédula/ID</label>
                <p className="text-lg font-medium text-gray-900">{profileData.idCard || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de Usuario</label>
                <p className="text-lg font-medium text-gray-900">{profileData.username}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <p className="text-lg font-medium text-gray-900">{profileData.email}</p>
            </div>
          </div>
        ) : (
          /* Formulario de Edición */
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula/ID
                </label>
                <input
                  type="text"
                  name="idCard"
                  value={profileData.idCard}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
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
        )}
      </motion.div>

      {/* Cambiar Contraseña */}
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
