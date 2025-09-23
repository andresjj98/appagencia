import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Edit,
  Users,
  Hotel,
  Plane,
  HeartPulse,
  Sun,
  CreditCard,
  FileText,
  ArrowLeft,
  Upload,
  Paperclip,
  Trash2,
  Package,
  ListChecks,
  PlusCircle
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSettings } from '../../utils/SettingsContext';
import ReservationDetailContent from './ReservationDetailContent';

// Standard form for managing details
const DetailManagement = ({ title, icon, onBack, onSave, children }) => (
    <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                {icon}
                {title}
            </h3>
        </div>
        <div className="space-y-6">
            {children}
        </div>
        <div className="mt-8 flex justify-end">
            <button 
                onClick={onSave}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                Guardar Cambios
            </button>
        </div>
    </div>
);

const PassengerForm = ({ reservation, passengersData, setPassengersData, setViewMode }) => {
  const totalPassengers = (reservation._original.passengers_adt || 0) + (reservation._original.passengers_chd || 0) + (reservation._original.passengers_inf || 0);
  
  const initialPassengers = (passengersData || []).map(pax => ({
    id: pax.id || null,
    firstName: pax.name || '',
    lastName: pax.lastname || '',
    documentType: pax.document_type || '',
    documentNumber: pax.document_number || '',
    birthDate: pax.birth_date ? pax.birth_date.split('T')[0] : '',
    notes: pax.notes || '',
  }));

  const [passengers, setPassengers] = useState(initialPassengers);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '', lastName: '', documentType: '', documentNumber: '', birthDate: '', notes: ''
    }
  });

  const addPassengerToList = (data) => {
    if (passengers.length >= totalPassengers) {
      alert(`No se pueden agregar más pasajeros. El límite para esta reserva es ${totalPassengers}.`);
      return;
    }
    
    if (passengers.some(p => p.documentNumber === data.documentNumber && data.documentNumber)) {
      alert('El número de documento ya existe en la lista de pasajeros.');
      return;
    }

    setPassengers(prev => [...prev, data]);
    reset();
  };

  const removePassengerFromList = (index) => {
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    const numbers = passengers.map(p => p.documentNumber);
    const hasDup = numbers.some((n, i) => n && numbers.indexOf(n) !== i);
    if (hasDup) {
      alert('El número de documento debe ser único por reserva.');
      return;
    }

    const passengersToSave = passengers.map(pax => {
      const passengerData = {        
        name: pax.firstName,
        lastname: pax.lastName,
        document_type: pax.documentType,
        document_number: pax.documentNumber,
        birth_date: pax.birthDate,
        notes: pax.notes,
      };

      if (pax.id) {
        passengerData.id = pax.id;
      }
      
      return passengerData;
    });

    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/passengers/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passengersToSave),
      });

      const savedPassengers = await response.json();

      if (!response.ok) {
        throw new Error(savedPassengers.message || 'Error en el servidor');
      }
      
      setPassengersData(savedPassengers);
      setViewMode('view');
    } catch (error) {
      console.error('Error saving passengers via backend:', error);
      alert(`Error al guardar los pasajeros: ${error.message}`);
    }
  };

  return (
    <DetailManagement
      title="Gestionar Pasajeros"
      icon={<Users className="w-5 h-5" />}
      onBack={() => setViewMode('view')}
      onSave={onSave}
    >
      <form onSubmit={handleSubmit(addPassengerToList)} className="p-4 border border-gray-200 rounded-lg space-y-4 mb-6 bg-gray-50">
        <h4 className="text-md font-semibold text-gray-800">Añadir Nuevo Pasajero</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombres</label>
            <input
              {...register('firstName', { required: true })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellidos</label>
            <input
              {...register('lastName', { required: true })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
            <select
              {...register('documentType', { required: true })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Seleccionar</option>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="TI">TI</option>
              <option value="PAS">PAS</option>
            </select>
            {errors.documentType && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número Documento</label>
            <input
              {...register('documentNumber', { required: true })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
            {errors.documentNumber && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
            <input
              type="date"
              {...register('birthDate', {
                required: true,
                validate: (v) => new Date(v) <= new Date()
              })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
            {errors.birthDate?.type === 'validate' && <p className="text-xs text-red-500 mt-1">No puede ser futura</p>}
            {errors.birthDate?.type === 'required' && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Anotaciones</label>
            <textarea
              {...register('notes')}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
          >
            <PlusCircle className="w-5 h-5" /> Agregar Pasajero
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">
          Lista de Pasajeros ({passengers.length} de {totalPassengers})
        </h4>
        {passengers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {passengers.map((pax, index) => (
              <li key={index} className="py-4 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{pax.firstName} {pax.lastName}</p>
                  <p className="text-sm text-gray-600">{pax.documentType}: {pax.documentNumber}</p>
                  <p className="text-sm text-gray-600">Nacimiento: {pax.birthDate}</p>
                  {pax.notes && <p className="text-sm text-gray-500 mt-1 italic">"{pax.notes}"</p>}
                </div>
                <button
                  type="button"
                  onClick={() => removePassengerFromList(index)}
                  className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aún no se han agregado pasajeros a la lista.</p>
          </div>
        )}
      </div>
    </DetailManagement>
  );
};

const AttachmentForm = ({ reservation, attachmentData, setAttachmentData, setViewMode }) => {
  const { control, register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { attachments: attachmentData }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachments"
  });

  const onFileChange = (index, e) => {
    if (e.target.files.length) {
      setValue(`attachments.${index}.file`, e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    const metadata = [];
    
    for (const attachment of data.attachments) {
        const itemMetadata = {
            id: attachment.id,
            title: attachment.title,
            observation: attachment.observation,
            file_name: attachment.file_name,
            file_url: attachment.file_url,
        };

        if (attachment.file instanceof File) {
            formData.append('files', attachment.file);
            // Use the file's actual name to link it in the backend
            itemMetadata.fileName = attachment.file.name;
        }
        metadata.push(itemMetadata);
    }

    formData.append('metadata', JSON.stringify(metadata));

    try {
        const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/attachments/upsert`, {
            method: 'POST',
            body: formData, // Browser will set Content-Type to multipart/form-data
        });

        const savedAttachments = await response.json();

        if (!response.ok) {
            throw new Error(savedAttachments.message || 'Error en el servidor');
        }

        setAttachmentData(savedAttachments);
        setViewMode('view');
    } catch (error) {
        console.error('Error saving attachments via backend:', error);
        alert(`Error al guardar los adjuntos: ${error.message}`);
    }
  };

  return (
    <DetailManagement
      title="Adjuntar Archivos y Notas"
      icon={<Paperclip className="w-5 h-5" />}
      onBack={() => setViewMode('view')}
      onSave={handleSubmit(onSubmit)}
    >
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                {...register(`attachments.${index}.title`, { required: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Ej: Vouchers de hotel"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                {...register(`attachments.${index}.observation`)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Observaciones sobre el archivo"
              />
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700">Archivo</label>
              <input
                type="file"
                onChange={(e) => onFileChange(index, e)}
                className="w-full mt-1"
              />
              {watch(`attachments.${index}.file_url`) && !(watch(`attachments.${index}.file`) instanceof File) && (
                 <div className="text-sm mt-2">
                    Archivo actual: <a href={watch(`attachments.${index}.file_url`)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{watch(`attachments.${index}.file_name`)}</a>
                 </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600 text-sm flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Eliminar Archivo
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ title: '', observation: '', file: null, file_name: '', file_url: '' })}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded-lg"
      >
        <PlusCircle className="w-4 h-4" /> Agregar Archivo
      </button>
    </DetailManagement>
  );
};

const ReservationFullDetail = ({ reservation, onClose, onUpdateReservation, onEdit, onRequestChange }) => {
  const { formatCurrency, formatDate } = useSettings();
  const [viewMode, setViewMode] = useState('view');

  // Defensive check: If reservation data is not available, show a fallback UI.
  if (!reservation || !reservation._original) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Error al cargar la reserva</h2>
          <p className="text-gray-600 mb-6">Los datos de la reserva no están disponibles. Por favor, intente de nuevo.</p>
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg">Cerrar</button>
        </motion.div>
      </motion.div>
    );
  }
  
  const [passengersData, setPassengersData] = useState(reservation._original.reservation_passengers || []);
  const [hotelData, setHotelData] = useState(reservation._original.reservation_hotels || []);
  const [flightData, setFlightData] = useState(reservation._original.reservation_flights || []);
  const [tourData, setTourData] = useState(reservation._original.reservation_tours || []);
  const [assistanceData, setAssistanceData] = useState(reservation._original.reservation_medical_assistances || []);
  const [attachmentData, setAttachmentData] = useState(reservation._original.reservation_attachments || []);

  const paymentOption = reservation._original.payment_option;
  const installments = reservation._original.installments || reservation._original.reservation_installments || [];
  const totalInstallmentsAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const paidAmount = paymentOption === 'full_payment'
    ? (reservation._original.payment_status === 'paid' ? reservation._original.total_amount : 0)
    : installments.filter(inst => inst.status === 'paid').reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const totalAmount = paymentOption === 'full_payment' ? reservation._original.total_amount : totalInstallmentsAmount;
  const progress = totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Pagada';
      case 'overdue':
      case 'late':
        return 'Atrasada';
      default:
        return 'Pendiente';
    }
  };

  const handleSave = (section) => {
    console.log(`Saving ${section}...`);
    setViewMode('view');
  };

  const handleManagementClick = (mode) => {
    setViewMode(mode);
  };

  const ReadOnlyView = () => (
    <>
      <div className="p-6 overflow-y-auto">
        <ReservationDetailContent reservation={reservation} />
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-4">Información adicional de la reserva</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <Edit className="w-4 h-4" /> Editar Reserva
            </button>
            <button onClick={() => handleManagementClick('passengers')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                <Users className="w-4 h-4" /> Gestionar pasajero(s)
            </button>
            <button onClick={() => setViewMode('attachments')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                <Paperclip className="w-4 h-4" /> Adjuntar Archivos
            </button>
        </div>
      </div>
    </>
  );
  
  const renderContent = () => {
    switch (viewMode) {
      case 'view': return <ReadOnlyView />;
      case 'passengers': return <PassengerForm 
                                  reservation={reservation} 
                                  passengersData={passengersData} 
                                  setPassengersData={setPassengersData} 
                                  setViewMode={setViewMode} 
                                />;
      case 'attachments': return <AttachmentForm 
                                    reservation={reservation}
                                    attachmentData={attachmentData}
                                    setAttachmentData={setAttachmentData}
                                    setViewMode={setViewMode}
                                  />;
      default: return <ReadOnlyView />;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white rounded-t-2xl sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {reservation._original.invoiceNumber || `Detalle de la Reserva #${reservation.id}`}
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
        <div className="overflow-y-auto">
            {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReservationFullDetail;