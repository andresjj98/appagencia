import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Euro,
  FileText,
  Upload,
  Download,
  Edit,
  Save,
  Info,
  Hotel,
  Plane,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { RESERVATION_STATUS, PAYMENT_STATUS } from '../../utils/constants';
import { useSettings } from '../../utils/SettingsContext';
import MyChangeRequestsPanel from './MyChangeRequestsPanel';

const ReservationDetail = ({ reservation, onBack, onUpdateReservation }) => {
  // Defensive check
  if (!reservation) {
    return <div>Cargando detalles de la reserva...</div>; // Or a more sophisticated loading/error component
  }

  const { formatCurrency, formatDate } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editedReservation, setEditedReservation] = useState(reservation);
  const [uploadMessage, setUploadMessage] = useState('');
  const [requestDocMessage, setRequestDocMessage] = useState('');

  // Provide safe fallbacks in case status or paymentStatus are undefined
  const statusConfig =
    RESERVATION_STATUS[editedReservation?.status] || {
      label: editedReservation?.status || 'Sin estado',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    };
  const paymentConfig =
    PAYMENT_STATUS[editedReservation?.paymentStatus] || {
      label: editedReservation?.paymentStatus || 'Sin estado',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) { // If just entered edit mode, reset edited data
      setEditedReservation(reservation);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedReservation(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // In a real app, send editedReservation to backend
    onUpdateReservation(editedReservation);
    setIsEditing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadMessage(`Subiendo ${file.name}...`);
      // Simulate upload
      setTimeout(() => {
        const newDoc = {
          name: file.name,
          type: file.type || 'documento',
          url: URL.createObjectURL(file)
        };
        setEditedReservation(prev => ({
          ...prev,
          documents: [...(prev.documents || []), newDoc]
        }));
        setUploadMessage(`¡${file.name} subido con éxito!`);
      }, 1500);
    }
  };

  const handleGenerateInvoice = () => {
    alert(`Factura generada para la reserva ${reservation.invoiceNumber}`);
  };

  const handleGenerateVoucher = () => {
    alert(`Voucher generado para la reserva ${reservation.invoiceNumber}`);
  };

  const handleApproveRequest = (req) => {
    const updated = {
      ...editedReservation,
      [req.field]: req.value,
      changeRequests: (editedReservation.changeRequests || []).filter(r => r.id !== req.id)
    };
    setEditedReservation(updated);
    onUpdateReservation(updated);
  };

  const handleRejectRequest = (reqId) => {
    const updated = {
      ...editedReservation,
      changeRequests: (editedReservation.changeRequests || []).filter(r => r.id !== reqId)
    };
    setEditedReservation(updated);
    onUpdateReservation(updated);
  };

  const handleRequestDocument = () => {
    const docName = prompt("¿Qué documento necesitas solicitar al cliente?");
    if (docName) {
      setRequestDocMessage(`Solicitando documento: "${docName}" al cliente.`);
      // In a real app, send a notification/email to the client
      setTimeout(() => {
        setRequestDocMessage('');
        alert(`Documento "${docName}" solicitado.`);
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Reserva #{reservation.invoiceNumber ?? reservation.id}
        </h2>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" /> Volver a Reservas
          </motion.button>
          <motion.button
            onClick={handleEditToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isEditing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isEditing ? <XCircle className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            {isEditing ? 'Cancelar Edición' : 'Editar Reserva'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Client Info */}
        <div className="bg-gray-50 p-6 rounded-xl space-y-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" /> Información del Cliente
          </h3>
          <p><strong>Nombre:</strong> {editedReservation.clientName}</p>
          <p><strong>Email:</strong> {editedReservation.clientEmail}</p>
          <p><strong>Teléfono:</strong> {editedReservation.clientPhone}</p>
          <p><strong>Dirección:</strong> {editedReservation.clientAddress || 'N/A'}</p>
          <p><strong>Contacto de Emergencia:</strong> {editedReservation.emergencyContactName || 'N/A'} ({editedReservation.emergencyContactPhone || 'N/A'})</p>
        </div>

        {/* Reservation Summary */}
        <div className="bg-gray-50 p-6 rounded-xl space-y-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" /> Resumen de la Reserva
          </h3>
          
          <p><strong>Destino:</strong> {editedReservation.destination}</p>
          <p><strong>Fechas:</strong> {formatDate(editedReservation.departureDate)} - {formatDate(editedReservation.returnDate)}</p>
          <p><strong>Pasajeros:</strong> ADT: {editedReservation.passengersADT}, CHD: {editedReservation.passengersCHD}, INF: {editedReservation.passengersINF}</p>
          <p><strong>Total:</strong> {formatCurrency(editedReservation.totalAmount)}</p>
          <p>
            <strong>Estado:</strong> 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </p>
          <p>
            <strong>Pago:</strong> 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}>
              {paymentConfig.label}
            </span>
          </p>
        </div>
      </div>

      {/* Editable Fields (simplified for this example) */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 p-6 rounded-xl mb-8 space-y-4"
        >
          <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
            <Edit className="w-5 h-5" /> Modificar Datos de la Reserva
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado de la Reserva</label>
              <select
                name="status"
                value={editedReservation.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.keys(RESERVATION_STATUS).map(key => (
                  <option key={key} value={key}>{RESERVATION_STATUS[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Pago</label>
              <select
                name="paymentStatus"
                value={editedReservation.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.keys(PAYMENT_STATUS).map(key => (
                  <option key={key} value={key}>{PAYMENT_STATUS[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales</label>
              <textarea
                name="notes"
                value={editedReservation.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <motion.button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="w-5 h-5" /> Guardar Cambios
          </motion.button>
        </motion.div>
      )}

      {/* Change Requests */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
        <MyChangeRequestsPanel reservationId={reservation.id} />
      </div>

      {/* Document Management */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <FileText className="w-7 h-7 text-orange-600" />
          Gestión de Documentos
        </h3>
        <div className="flex gap-4 mb-6">
          <motion.button
            onClick={handleGenerateInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText className="w-5 h-5" /> Generar Factura
          </motion.button>
          <motion.button
            onClick={handleGenerateVoucher}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-5 h-5" /> Generar Voucher
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Subir Documento
            </label>
            <div className="flex items-center gap-3">
              <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <motion.button
                onClick={() => document.getElementById('file-upload').click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Upload className="w-5 h-5" /> Subir
              </motion.button>
            </div>
            {uploadMessage && <p className="mt-2 text-sm text-gray-600">{uploadMessage}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solicitar Documento
            </label>
            <motion.button
              onClick={handleRequestDocument}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-5 h-5" /> Solicitar
            </motion.button>
            {requestDocMessage && <p className="mt-2 text-sm text-gray-600">{requestDocMessage}</p>}
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Documentos Existentes:</h4>
          {(editedReservation.documents || []).length > 0 ? (
            <ul className="list-disc list-inside ml-4 space-y-2">
              {(editedReservation.documents || []).map((doc, index) => (
                <li key={index} className="flex items-center justify-between text-gray-700">
                  <span>{doc.name} ({doc.type})</span>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ver</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay documentos asociados a esta reserva.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReservationDetail;