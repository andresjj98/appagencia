import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Info, CheckSquare, Users, DollarSign, Paperclip, History, FileText } from 'lucide-react';
import InfoWithEditTab from './InfoWithEditTab';
import ServiceConfirmationTab from './ServiceConfirmationTab';
import FinanceViewTab from './FinanceViewTab';
import PassengerManagementTab from './PassengerManagementTab';
import DocumentationTab from './DocumentationTab';
import HistoryTab from './HistoryTab';
import InvoiceViewTab from './InvoiceViewTab';
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
  const [editingSection, setEditingSection] = useState(null);
  const { currentUser } = useAuth();

  // Verificar permisos del usuario
  const canEdit = canEditReservation(currentUser, reservation._original);
  const canApprove = canApproveReservation(currentUser, reservation._original);

  // Manejar edición de sección específica
  const handleEditSection = (sectionName) => {
    setEditingSection(sectionName);
    setActiveTab('info'); // Cambiar a la pestaña de información
  };

  const handleUpdateReservation = async (updatedPayload) => {
    console.log('=== FRONTEND DEBUG ===');
    console.log('handleUpdateReservation called');
    console.log('updatedPayload:', updatedPayload);
    console.log('Has reservation_passengers?', !!updatedPayload.reservation_passengers);
    console.log('Reservation ID:', reservation.id);

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Si el payload contiene reservation_passengers, usar endpoint específico
      if (updatedPayload.reservation_passengers) {
        console.log('Using passengers endpoint');
        console.log('Passengers data:', updatedPayload.reservation_passengers);

        const url = `/api/reservations/${reservation.id}/passengers`;
        const body = {
          passengers: updatedPayload.reservation_passengers
        };

        console.log('Fetching:', url);
        console.log('Body:', body);

        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.message || 'Failed to update passengers');
        }

        const successData = await response.json();
        console.log('Success response:', successData);

        if(onUpdate) {
          onUpdate();
        }

        alert('Pasajeros actualizados con exito');
        return;
      }

      // Para otras actualizaciones, usar el endpoint general
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
      payloadForSql.updateContext = payloadForSql.updateContext || 'general';

      // ⚠️ IMPORTANTE: Eliminar installments para preservar estados de pago
      // Las cuotas solo deben actualizarse desde el módulo de Finanzas
      if (payloadForSql.installments) {
        delete payloadForSql.installments;
      }
      if (payloadForSql.reservation_installments) {
        delete payloadForSql.reservation_installments;
      }

      // Los transfers se envían normalmente ahora (el backend los procesa correctamente)

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers,
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
    { id: 'services', label: 'Gestion de Reserva', icon: CheckSquare },
    { id: 'passengers', label: 'Pasajeros', icon: Users },
    { id: 'finance', label: 'Finanzas y Pagos', icon: DollarSign },
    { id: 'documents', label: 'Documentacion', icon: Paperclip },
    { id: 'invoice', label: 'Factura', icon: FileText },
    { id: 'history', label: 'Actividad y Cambios', icon: History },
  ];

  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (title, message) => {
    setAlertInfo({ title, message });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  const renderContent = () => {
    // A simple loading indicator can be added here based on isSaving state
    if (isSaving) {
      return <div className="flex items-center justify-center py-10 text-sm text-gray-500">Guardando...</div>;
    }

    switch (activeTab) {
      case 'info':
        return (
          <InfoWithEditTab
            reservation={reservation}
            onUpdate={onUpdate}
            readOnly={!canEdit}
            editingSection={editingSection}
            onClearSection={() => setEditingSection(null)}
          />
        );
      case 'services':
        return (
          <ServiceConfirmationTab
            reservation={reservation}
            onUpdate={onUpdate}
            onEditSection={handleEditSection}
            readOnly={!canEdit}
          />
        );
      case 'passengers':
        return <PassengerManagementTab reservation={reservation} onUpdateReservation={handleUpdateReservation} readOnly={!canEdit} />;
      case 'finance':
        return <FinanceViewTab reservation={reservation} />;
      case 'documents':
        return <DocumentationTab reservation={reservation} onUpdate={onUpdate} readOnly={!canEdit} />;
      case 'invoice':
        return <InvoiceViewTab reservation={reservation} />;
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
        {alertInfo && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <h4 className="font-semibold text-blue-900">{alertInfo.title}</h4>
            <p className="text-blue-700">{alertInfo.message}</p>
          </div>
        )}
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
