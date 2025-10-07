import React, { createContext, useState, useContext } from 'react';
import { setCurrentUser as setMockUser } from '../mock/users';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const signIn = async ({ email, password }) => {
    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en el inicio de sesión');
      }

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
      return { user: null, error };
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

  const value = { currentUser, setCurrentUser, signIn, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);