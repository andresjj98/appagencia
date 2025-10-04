import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  Globe,
  Plane,
  Hotel,
  Ticket,
  HeartPulse,
  Info
} from 'lucide-react';
import { calculateDays } from '../../utils/helpers';
import { RESERVATION_STATUS, PAYMENT_STATUS, canEditReservation } from '../../utils/constants';
import { useSettings } from '../../utils/SettingsContext';
import { useAuth } from '../../pages/AuthContext';
import { formatUserName } from '../../utils/nameFormatter';

// Helper component to display an icon based on reservation type
const ReservationTypeIcon = ({ type }) => {
  const iconProps = { className: "w-6 h-6 text-white" }; // Slightly smaller icon
  let IconComponent;
  let bgColor = 'bg-gray-400';

  switch (type) {
    case 'all_inclusive':
      IconComponent = Globe;
      bgColor = 'bg-blue-500';
      break;
    case 'flights_only':
      IconComponent = Plane;
      bgColor = 'bg-sky-500';
      break;
    case 'hotel_only':
      IconComponent = Hotel;
      bgColor = 'bg-purple-500';
      break;
    case 'tours_only':
      IconComponent = Ticket;
      bgColor = 'bg-amber-500';
      break;
    case 'medical_assistance':
      IconComponent = HeartPulse;
      bgColor = 'bg-red-500';
      break;
    default:
      IconComponent = Info;
      bgColor = 'bg-gray-500';
      break;
  }

  return (
    <div className={`p-2 rounded-full ${bgColor}`}>
      <IconComponent {...iconProps} />
    </div>
  );
};

// Helper component for rendering status badges
const StatusBadge = ({ config }) => {
  if (!config) {
    return null;
  }
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {Icon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </div>
  );
};

const ReservationCard = ({ reservation, index = 0, onEdit, onDelete, onView }) => {
  const formatCOP = (value) => {
    const numeric = Number(value) || 0;
    return `COP ${numeric.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const { formatDate } = useSettings();
  const { currentUser } = useAuth();

  // Verificar si el usuario puede editar esta reserva
  const canEdit = canEditReservation(currentUser, reservation._original);

  if (!reservation) {
    return null;
  }

  const statusConfig = RESERVATION_STATUS[reservation?.status] || { label: reservation?.status || 'Desconocido', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  const paymentConfig = PAYMENT_STATUS[reservation?.paymentStatus] || { label: reservation?.paymentStatus || 'Desconocido', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  const reservationType = reservation._original?.reservation_type || 'other';
  const invoiceNumber =
    reservation.invoiceNumber ??
    reservation.invoice_number ??
    reservation._original?.invoiceNumber ??
    reservation._original?.invoice_number;
  const formattedInvoiceNumber =
    invoiceNumber !== null && invoiceNumber !== undefined && invoiceNumber !== ''
      ? String(invoiceNumber)
      : 'No asignada';
  const shouldShowInvoiceNumber = reservation.status === 'confirmed';

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ transform: 'translateY(-5px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <ReservationTypeIcon type={reservationType} />
          {shouldShowInvoiceNumber && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Factura</span>
              <span className="text-lg font-bold text-blue-600 font-mono">{formattedInvoiceNumber}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <motion.button onClick={() => onView?.(reservation)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Ver Detalles">
            <Eye className="w-5 h-5" />
          </motion.button>
          {canEdit && (
            <>
              <motion.button onClick={() => onEdit?.(reservation)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Editar">
                <Edit className="w-5 h-5" />
              </motion.button>
              <motion.button onClick={() => onDelete?.(reservation)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Eliminar">
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 flex-grow">
        <div className="mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID: {reservation.id}</p>
            <h3 className="text-lg font-bold text-gray-900 truncate" title={reservation.clientName}>
              {reservation.clientName}
            </h3>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <p className="font-semibold text-gray-800 truncate" title={reservation.destination}>{reservation.destination}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Salida</p>
              <p className="font-medium text-gray-900">{formatDate(reservation.departureDate) || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Regreso</p>
              <p className="font-medium text-gray-900">{formatDate(reservation.returnDate) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="font-medium text-gray-600">{reservation.passengers} {reservation.passengers === 1 ? 'pasajero' : 'pasajeros'}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Estado Reserva</p>
            <p className="text-xs text-gray-500">Estado Pago</p>
        </div>
        <div className="flex items-center justify-between mb-3">
          <StatusBadge config={statusConfig} />
          <StatusBadge config={paymentConfig} />
        </div>
        <div className="flex items-end justify-between">
            <div>
                <p className="text-xs text-gray-500">Asesor</p>
                <p className="text-sm font-medium text-gray-700">{formatUserName(reservation.advisorName)}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 text-right">Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCOP(reservation.totalAmount)}</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReservationCard;



