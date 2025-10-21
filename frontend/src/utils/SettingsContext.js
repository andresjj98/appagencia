import React, { createContext, useState, useEffect, useContext } from 'react';
import api from './api';

const SettingsContext = createContext();

const defaultSettings = {
  currency: 'EUR',
  preferredDateFormat: 'DD/MM/AAAA',
  timezone: 'Europe/Madrid',
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/api/business-settings');
        setSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch business settings:", error.response?.data?.message || error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: settings.currency || 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '';

    const formatOptions = {
      'DD/MM/AAAA': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'MM/DD/AAAA': { month: '2-digit', day: '2-digit', year: 'numeric' },
      'AAAA-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' },
    };

    const options = formatOptions[settings.preferredDateFormat] || {
      year: 'numeric', month: 'long', day: 'numeric',
    };

    options.timeZone = settings.timezone || undefined;

    return new Intl.DateTimeFormat('es-ES', options).format(date);
  };

  const value = { settings, isLoading, formatCurrency, formatDate };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);