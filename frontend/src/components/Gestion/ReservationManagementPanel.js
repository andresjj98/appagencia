import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, CheckSquare, Users, DollarSign, Paperclip, History } from 'lucide-react';
import GeneralInfoPanel from './GeneralInfoPanel';
import ReservationFinanceTab from './ReservationFinanceTab';
import ServiceManagementTab from './ServiceManagementTab';
import PassengerManagementTab from './PassengerManagementTab';
import DocumentationTab from './DocumentationTab';
import HistoryTab from './HistoryTab';

const ReservationManagementPanel = ({ reservation, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');

  const tabs = [
    { id: 'info', label: 'Información General', icon: Info },
    { id: 'services', label: 'Gestión de Servicios', icon: CheckSquare },
    { id: 'passengers', label: 'Pasajeros', icon: Users },
    { id: 'finance', label: 'Finanzas y Pagos', icon: DollarSign },
    { id: 'documents', label: 'Documentación', icon: Paperclip },
    { id: 'history', label: 'Actividad y Cambios', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return <GeneralInfoPanel reservation={reservation} />;
      case 'services':
        return <ServiceManagementTab reservation={reservation} onUpdate={onUpdate} />;
      case 'passengers':
        return <PassengerManagementTab reservation={reservation} onUpdate={onUpdate} />;
      case 'finance':
        return <ReservationFinanceTab reservation={reservation._original} onUpdate={onUpdate} />;
      case 'documents':
        return <DocumentationTab reservation={reservation} onUpdate={onUpdate} />;
      case 'history':
        return <HistoryTab reservation={reservation} onUpdate={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 flex"
    >
      {/* Sidebar / Tabs */}
      <div className="w-1/4 bg-gray-50 rounded-l-2xl border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <motion.button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Panel de Gestión</h2>
            <p className="text-sm text-gray-500 font-mono">{reservation._original.invoiceNumber}</p>
          </div>
        </div>
        <nav className="flex flex-col space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${ 
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="w-3/4 p-8 overflow-y-auto" style={{maxHeight: '90vh'}}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ReservationManagementPanel;