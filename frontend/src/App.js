import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Gestion from './pages/Gestion';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Finance from './pages/Finance';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import { useAuth } from './pages/AuthContext';
import { canAccessModule } from './utils/constants';

const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { currentUser, login, logout } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const renderAccessDenied = () => (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
      <p className="text-gray-600 mt-2">No tienes permisos para acceder a este módulo.</p>
    </div>
  );

  const renderContent = () => {
    // Verificar acceso al módulo
    if (!canAccessModule(currentUser, activeSection)) {
      return renderAccessDenied();
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'reservations':
        return <Reservations />;
      case 'gestion':
        return <Gestion />;
      case 'documentation':
        return <Documentation />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <Analytics />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      reservations: 'Gestión de Reservas',
      gestion: 'Gestión de Reservas',
      documentation: 'Documentación',
      finance: 'Finanzas',
      reports: 'Reportes',
      analytics: 'Análisis y Reportes',
      notifications: 'Notificaciones',
      settings: 'Configuración',
      profile: 'Mi Perfil'
    };
    return titles[activeSection] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        onLogout={() => {
          logout();
          setActiveSection('dashboard');
        }} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getSectionTitle()}
          onNewReservation={activeSection === 'reservations' ? () => {
            // This will be handled by the Reservations component
          } : null}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default App;