import React, { createContext, useState, useContext, useEffect } from 'react';
import { setCurrentUser as setMockUser } from '../mock/users';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay un token almacenado al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Aquí podrías hacer una petición para obtener el usuario actual
      // Por ahora solo marcamos que terminó de cargar
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      // Usar axios en lugar de fetch - este endpoint NO requiere token
      const response = await api.post('/login', { email, password });
      const data = response.data;

      // Guardar el token JWT en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Mapear el usuario del backend al formato del frontend
      const mappedUser = {
        id: data.user.id,
        name: data.user.last_name
          ? `${data.user.name} ${data.user.last_name}`
          : data.user.name,
        lastName: data.user.last_name,
        idCard: data.user.id_card,
        username: data.user.username,
        email: data.user.email,
        role: data.user.role,
        active: data.user.active,
        avatar: data.user.avatar,
        officeId: data.user.office_id,
        isSuperAdmin: data.user.is_super_admin || false
      };

      setCurrentUser(mappedUser);
      setMockUser(mappedUser); // Keep mock in sync
      return { user: mappedUser, error: null };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error en el inicio de sesión';
      return { user: null, error: new Error(errorMessage) };
    }
  };

  const login = (user) => {
    setCurrentUser(user);
    setMockUser(user); // Mantenemos el mock sincronizado si se usa en otro lugar
  };

  const logout = () => {
    setCurrentUser(null);
    setMockUser(null); // Sincronizamos el mock
    localStorage.removeItem('token'); // Limpiar el token JWT
  };

  const value = { currentUser, setCurrentUser, signIn, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);