import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import ReservationFullDetail from '../Reservations/ReservationFullDetail';
import FulfillmentChecklist from './FulfillmentChecklist';
import ChangeRequestManager from './ChangeRequestManager';

const ReservationManagementPanel = ({ reservation: initialReservation, onBack, onUpdate }) => {
  const [reservation, setReservation] = useState(initialReservation);
  const [activeTab, setActiveTab] = useState('details');

  const refetchReservation = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}`);
      const data = await response.json();
      if (response.ok) {
        // The API returns a transformed object, we need to wrap it in `_original`
        // to match the structure expected by ReservationFullDetail
        const transformedData = {
            ...reservation, // Keep the card-level data
            _original: data // Embed the full detail
        };
        setReservation(transformedData);
        onUpdate(transformedData); // Notify parent component
      } else {
        console.error('Failed to refetch reservation');
      }
    } catch (error) {
      console.error('Error refetching reservation:', error);
    }
  }, [reservation.id, onUpdate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        // ReservationFullDetail expects the full object in `_original`
        return <ReservationFullDetail reservation={reservation} onClose={onBack} />;
      case 'fulfillment':
        return <FulfillmentChecklist reservation={reservation._original} onUpdate={refetchReservation} />;
      case 'changes':
        return <ChangeRequestManager reservation={reservation._original} onUpdate={refetchReservation} />;
      default:
        return null;
    }
  };

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        activeTab === tabName
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-50 rounded-2xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <motion.button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <ArrowLeft className="w-5 h-5" /> Volver
            </motion.button>
            <h2 className="text-2xl font-bold text-gray-900">
                Panel de Gestión: {reservation._original.invoiceNumber || `Reserva #${reservation.id}`}
            </h2>
        </div>
        <motion.button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
        >
            <X className="w-6 h-6" />
        </motion.button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-center gap-4">
          <TabButton tabName="details" label="Detalles Completos" />
          <TabButton tabName="fulfillment" label="Checklist de Cumplimiento" />
          <TabButton tabName="changes" label="Solicitudes de Cambio" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-inner">
        {renderContent()}
      </div>
    </motion.div>
  );
};

export default ReservationManagementPanel;