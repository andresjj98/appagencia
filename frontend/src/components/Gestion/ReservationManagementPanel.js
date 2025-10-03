import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, CheckSquare, Users, DollarSign, Paperclip, History } from 'lucide-react';
import GeneralInfoPanel from './GeneralInfoPanel';
import ReservationFinanceTab from './ReservationFinanceTab';
import ServiceManagementTab from './ServiceManagementTab';
import PassengerManagementTab from './PassengerManagementTab';
import DocumentationTab from './DocumentationTab';
import HistoryTab from './HistoryTab';
import { useAuth } from '../../pages/AuthContext';
import { canEditReservation, canApproveReservation } from '../../utils/constants';

const panelContainerClasses = 'w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 flex overflow-hidden';
const sidebarClasses = 'w-72 bg-gradient-to-b from-blue-600 via-blue-700 to-purple-700 text-white p-6 flex flex-col';
const tabButtonBase = 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200';
const tabButtonActive = 'bg-white text-blue-600 shadow-lg';
const tabButtonInactive = 'text-white/80 hover:bg-white/10';

const ReservationManagementPanel = ({ reservation, onBack, onUpdate, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const { currentUser } = useAuth();

  // Verificar permisos del usuario
  const canEdit = canEditReservation(currentUser, reservation._original);
  const canApprove = canApproveReservation(currentUser, reservation._original);

  const handleUpdateReservation = async (updatedPayload) => {
    setIsSaving(true);

    const payloadForSql = {
        ...updatedPayload,
        // Client data mapping
        clientName: updatedPayload.clients.name,
        clientEmail: updatedPayload.clients.email,
        clientPhone: updatedPayload.clients.phone,
        clientId: updatedPayload.clients.id_card,
        clientAddress: updatedPayload.clients.address,
        emergencyContact: {
            name: updatedPayload.clients.emergency_contact_name,
            phone: updatedPayload.clients.emergency_contact_phone,
        },
        // Reservation data mapping (snake_case to camelCase)
        tripType: updatedPayload.trip_type,
        passengersADT: updatedPayload.passengers_adt,
        passengersCHD: updatedPayload.passengers_chd,
        passengersINF: updatedPayload.passengers_inf,
        pricePerADT: updatedPayload.price_per_adt,
        pricePerCHD: updatedPayload.price_per_chd,
        pricePerINF: updatedPayload.price_per_inf,
        totalAmount: updatedPayload.total_amount,
        paymentOption: updatedPayload.payment_option,
    };

    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadForSql),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update reservation');
      }
      
      if(onUpdate) {
        onUpdate();
      }
      
      alert('Reserva actualizada con exito');

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Informacion General', icon: Info },
    { id: 'services', label: 'Gestion de Servicios', icon: CheckSquare },
    { id: 'passengers', label: 'Pasajeros', icon: Users },
    { id: 'finance', label: 'Finanzas y Pagos', icon: DollarSign },
    { id: 'documents', label: 'Documentacion', icon: Paperclip },
    { id: 'history', label: 'Actividad y Cambios', icon: History },
  ];

  const renderContent = () => {
    // A simple loading indicator can be added here based on isSaving state
    if (isSaving) {
      return <div className="flex items-center justify-center py-10 text-sm text-gray-500">Guardando...</div>;
    }

    switch (activeTab) {
      case 'info':
        return <GeneralInfoPanel reservation={reservation} onUpdate={onUpdate} readOnly={!canEdit} />;
      case 'services':
        return <ServiceManagementTab reservation={reservation} onUpdate={onUpdate} readOnly={!canEdit} />;
      case 'passengers':
        return <PassengerManagementTab reservation={reservation} onUpdateReservation={handleUpdateReservation} readOnly={!canEdit} />;
      case 'finance':
        return <ReservationFinanceTab reservation={reservation._original} onUpdate={onUpdate} readOnly={!canEdit} />;
      case 'documents':
        return <DocumentationTab reservation={reservation} onUpdate={onUpdate} readOnly={!canEdit} />;
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
      className={panelContainerClasses}
    >
      {/* Sidebar / Tabs */}
      <div className={sidebarClasses}>
        <div className="flex items-center gap-3 mb-8">
          <motion.button
            onClick={onBack}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h2 className="text-lg font-bold text-white">Panel de Gestion</h2>
            <p className="text-4xl font-bold text-yellow-300 font-mono uppercase tracking-wide">{reservation._original.invoiceNumber}</p>
          </div>
        </div>
        <nav className="flex flex-col space-y-2">
          {reservation._original.status === 'pending' && (
            <div className="flex items-center justify-between mb-6 gap-3">
              <motion.button
                onClick={() => onApprove(reservation.id)}
                disabled={!canApprove}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-emerald-600 hover:bg-emerald-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                whileHover={{ scale: canApprove ? 1.05 : 1 }}
                whileTap={{ scale: canApprove ? 0.95 : 1 }}
              >
                Aprobar
              </motion.button>
              <motion.button
                onClick={() => onReject(reservation.id)}
                disabled={!canApprove}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-red-600 hover:bg-red-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                whileHover={{ scale: canApprove ? 1.05 : 1 }}
                whileTap={{ scale: canApprove ? 0.95 : 1 }}
              >
                Rechazar
              </motion.button>
            </div>
          )}
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${tabButtonBase} ${activeTab === tab.id ? tabButtonActive : tabButtonInactive}`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto bg-white" style={{ maxHeight: '90vh' }}>
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