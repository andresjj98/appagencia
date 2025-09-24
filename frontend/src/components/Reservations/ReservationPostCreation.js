import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Users, FileText } from 'lucide-react';
import PassengerManagementTab from '../Gestion/PassengerManagementTab';
import DocumentationTab from '../Gestion/DocumentationTab';

const ReservationPostCreation = ({ reservation, onClose, onUpdateReservation }) => {
  const [activeTab, setActiveTab] = useState('passengers');

  if (!reservation) {
    return null;
  }

  const TabButton = ({ tabName, currentTab, setTab, children, icon: Icon }) => (
    <button
      onClick={() => setTab(tabName)}
      className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium transition-colors 
        ${currentTab === tabName 
          ? 'bg-white border-gray-200 border-l border-t border-r -mb-px text-blue-600' 
          : 'bg-gray-50 text-gray-600 hover:bg-gray-200'}`
      }
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Detalles Adicionales de la Reserva
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <p className="font-medium">¡Reserva creada con éxito! Ahora puedes añadir los detalles de pasajeros y documentación.</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <TabButton tabName="passengers" currentTab={activeTab} setTab={setActiveTab} icon={Users}>
              Gestionar Pasajeros
            </TabButton>
            <TabButton tabName="documentation" currentTab={activeTab} setTab={setActiveTab} icon={FileText}>
              Gestionar Documentación
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="bg-white p-6 rounded-b-lg rounded-r-lg border-gray-200 border-l border-r border-b">
            {activeTab === 'passengers' && (
              <PassengerManagementTab reservation={reservation} onUpdate={onUpdateReservation} />
            )}
            {activeTab === 'documentation' && (
              <DocumentationTab reservation={reservation} onUpdate={onUpdateReservation} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <motion.button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Finalizar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationPostCreation;