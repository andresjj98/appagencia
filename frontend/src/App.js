import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import UserManagement from './pages/Users'; 
import OfficeManagement from './pages/Offices'; 
import SalesPointManagement from './pages/SalesPoints'; 
import Settings from './pages/Settings'; 
import ClientManagement from './pages/Clients'; 
import Notifications from './pages/Notifications'; 
import Reports from './pages/Reports'; 
import Analytics from './pages/Analytics'; 
import Login from './pages/Login';
import { mockUsers } from './mock/users'; 
import { setCurrentUser } from './mock/users'; 

const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loggedInUser, setLoggedInUser] = useState(null); 

  const handleLogin = (user) => {
    setLoggedInUser(user);
    setCurrentUser(user); 
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentUser(null); 
    setActiveSection('dashboard'); 
  };

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'reservations':
        return <Reservations />;
      case 'clients':
        return <ClientManagement />; 
      case 'salesPoints':
        return <SalesPointManagement />; 
      case 'documentation':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentación</h2>
            <p className="text-gray-600">Módulo de documentación en desarrollo...</p>
          </div>
        );
      case 'offices':
        return <OfficeManagement />; 
      case 'finance':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Finanzas</h2>
            <p className="text-gray-600">Módulo de finanzas en desarrollo...</p>
          </div>
        );
      case 'reports':
        return <Reports />; 
      case 'analytics':
        return <Analytics />; 
      case 'notifications':
        return <Notifications />; 
      case 'users':
        return <UserManagement />; 
      case 'settings':
        return <Settings />; 
      default:
        return <Dashboard />;
    }
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      reservations: 'Gestión de Reservas',
      clients: 'Gestión de Clientes',
      salesPoints: 'Puntos de Venta',
      documentation: 'Documentación',
      offices: 'Oficinas',
      finance: 'Finanzas',
      reports: 'Reportes',
      analytics: 'Análisis y Reportes',
      notifications: 'Notificaciones',
      users: 'Gestión de Usuarios',
      settings: 'Configuración'
    };
    return titles[activeSection] || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        onLogout={handleLogout} 
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