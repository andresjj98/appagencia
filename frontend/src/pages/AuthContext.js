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
      setCurrentUser(data.user);
      setMockUser(data.user); // Keep mock in sync
      return { user: data.user, error: null };
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
  };

  const value = { currentUser, setCurrentUser, signIn, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);