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
import supabase from '../../utils/supabaseClient';
import { useSettings } from '../../utils/SettingsContext';

// Read-only Section
const InfoSection = ({ title, icon, children }) => (
  <div className="py-5 px-6 border-b border-gray-200 last:border-b-0">
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-4">
      {icon}
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
      {children}
    </div>
  </div>
);

const InfoItem = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-full' : ''}>
    <p className="text-gray-500 font-medium">{label}</p>
    <p className="text-gray-900">{value || 'No especificado'}</p>
  </div>
);

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
    files: pax.documents || []
  }));

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ defaultValues: { passengers: initialPassengers } });
  const { fields, append, remove } = useFieldArray({ control, name: 'passengers' });
  const watchPassengers = watch('passengers');

  const onFileChange = (idx, files) => {
    const existing = watchPassengers[idx]?.files || [];
    setValue(`passengers.${idx}.files`, [...existing, ...Array.from(files)]);
  };

  const removeFile = (pIdx, fIdx) => {
    const updated = (watchPassengers[pIdx]?.files || []).filter((_, i) => i !== fIdx);
    setValue(`passengers.${pIdx}.files`, updated);
  };

  const addPassenger = () => {
    if (fields.length < totalPassengers) {
      append({ firstName: '', lastName: '', documentType: '', documentNumber: '', birthDate: '', notes: '', files: [] });
    } else {
      alert(`No se pueden agregar más pasajeros. El límite para esta reserva es ${totalPassengers}.`);
    }
  };

  const onSubmit = async (data) => {
    const numbers = data.passengers.map(p => p.documentNumber);
    const hasDup = numbers.some((n, i) => numbers.indexOf(n) !== i);
    if (hasDup) {
      alert('El número de documento debe ser único por reserva.');
      return;
    }

    const passengersToSave = [];
    for (let i = 0; i < data.passengers.length; i++) {
      const pax = data.passengers[i];
      const uploadedFiles = [];
      for (const file of pax.files || []) {
        if (file instanceof File) {
          const filePath = `${reservation.id}/passenger_${i + 1}/${file.name}`;
          const { error } = await supabase.storage.from('arch_pax').upload(filePath, file);
          if (!error) {
            const { data: publicUrl } = supabase.storage.from('arch_pax').getPublicUrl(filePath);
            uploadedFiles.push({ name: file.name, type: file.type, url: publicUrl.publicUrl });
          }
        } else {
          uploadedFiles.push(file);
        }
      }

      passengersToSave.push({
        id: pax.id,
        reservation_id: reservation.id,
        name: pax.firstName,
        lastname: pax.lastName,
        document_type: pax.documentType,
        document_number: pax.documentNumber,
        birth_date: pax.birthDate,
        notes: pax.notes,
        documents: uploadedFiles
      });
    }

    const { error } = await supabase.from('reservation_passengers').upsert(passengersToSave);
    if (error) {
      console.error('Error saving passengers', error);
      return;
    }
    setPassengersData(passengersToSave);
    setViewMode('view');
  };

  return (
    <DetailManagement
      title="Gestionar Pasajeros"
      icon={<Users className="w-5 h-5" />}
      onBack={() => setViewMode('view')}
      onSave={handleSubmit(onSubmit)}
    >
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombres</label>
              <input
                {...register(`passengers.${index}.firstName`, { required: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
              {errors.passengers?.[index]?.firstName && (
                <p className="text-xs text-red-500 mt-1">Requerido</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellidos</label>
              <input
                {...register(`passengers.${index}.lastName`, { required: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
              {errors.passengers?.[index]?.lastName && (
                <p className="text-xs text-red-500 mt-1">Requerido</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
              <select
                {...register(`passengers.${index}.documentType`, { required: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">Seleccionar</option>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="TI">TI</option>
                <option value="PAS">PAS</option>
              </select>
              {errors.passengers?.[index]?.documentType && (
                <p className="text-xs text-red-500 mt-1">Requerido</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número Documento</label>
              <input
                {...register(`passengers.${index}.documentNumber`, { required: true })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
              {errors.passengers?.[index]?.documentNumber && (
                <p className="text-xs text-red-500 mt-1">Requerido</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
              <input
                type="date"
                {...register(`passengers.${index}.birthDate`, {
                  required: true,
                  validate: (v) => new Date(v) <= new Date()
                })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
              {errors.passengers?.[index]?.birthDate?.type === 'validate' && (
                <p className="text-xs text-red-500 mt-1">No puede ser futura</p>
              )}
              {errors.passengers?.[index]?.birthDate?.type === 'required' && (
                <p className="text-xs text-red-500 mt-1">Requerido</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Anotaciones</label>
              <textarea
                {...register(`passengers.${index}.notes`)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Documentos</label>
            <input type="file" multiple onChange={(e) => onFileChange(index, e.target.files)} className="mb-2" />
            <ul className="space-y-1">
              {(watchPassengers[index]?.files || []).map((file, fIdx) => (
                <li key={fIdx} className="flex justify-between items-center text-sm bg-gray-100 p-2 rounded">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index, fIdx)}
                    className="text-red-600 text-xs"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600 text-sm flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Eliminar pasajero
            </button>
          </div>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={addPassenger}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 border rounded-lg"
        >
          <PlusCircle className="w-4 h-4" /> Agregar pasajero
        </button>
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
    const attachmentsToSave = [];
    for (let i = 0; i < data.attachments.length; i++) {
      const attachment = data.attachments[i];
      let fileUrl = attachment.file_url; // Keep existing URL if file is not changed

      if (attachment.file instanceof File) {
        const file = attachment.file;
        const filePath = `${reservation.id}/attachments/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('arch_pax')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue; // Or handle error appropriately
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('arch_pax')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrlData.publicUrl;
      }

      attachmentsToSave.push({
        id: attachment.id,
        reservation_id: reservation.id,
        title: attachment.title,
        observation: attachment.observation,
        file_name: attachment.file instanceof File ? attachment.file.name : attachment.file_name,
        file_url: fileUrl,
      });
    }

    const { data: savedAttachments, error } = await supabase
      .from('reservation_attachments')
      .upsert(attachmentsToSave)
      .select();

    if (error) {
      console.error('Error saving attachments', error);
      return;
    }
    setAttachmentData(savedAttachments);
    setViewMode('view');
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
  
  const [passengersData, setPassengersData] = useState(reservation._original.passengers || []);
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
        <InfoSection title="Información Básica" icon={<FileText className="w-5 h-5 text-blue-600" />}>
          <InfoItem label="Cliente" value={reservation.clientName} />
          <InfoItem label="Destino" value={reservation.destination} />
          <InfoItem label="Fecha de Salida" value={formatDate(reservation.departureDate)} />
          <InfoItem label="Fecha de Regreso" value={formatDate(reservation.returnDate)} />
          <InfoItem label="Estado" value={reservation.status} />
          <InfoItem label="Asesor" value={reservation.advisorName} />
        </InfoSection>

        <InfoSection title="Pasajeros" icon={<Users className="w-5 h-5 text-green-600" />}>
            <InfoItem label="Adultos" value={reservation._original.passengers_adt} />
            <InfoItem label="Niños" value={reservation._original.passengers_chd} />
            <InfoItem label="Infantes" value={reservation._original.passengers_inf} />
            <div className="col-span-full">
                {(passengersData || []).map((pax, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded-md mt-2">{pax.name} {pax.lastname} ({pax.document_type}: {pax.document_number})</div>
                ))}
            </div>
        </InfoSection>

        <InfoSection title="Itinerario y Vuelos" icon={<Plane className="w-5 h-5 text-indigo-600" />}>
            {(flightData || []).length > 0 ? flightData.map((flight, index) => (
                <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                    <p><strong>Aerolínea:</strong> {flight.airline}</p>
                    <p><strong>PNR:</strong> {flight.pnr || 'No especificado'}</p>
                </div>
            )) : <InfoItem label="Vuelos" value="No hay vuelos registrados." />}
        </InfoSection>

        <InfoSection title="Hoteles" icon={<Hotel className="w-5 h-5 text-yellow-600" />}>
            {(hotelData || []).length > 0 ? hotelData.map((hotel, index) => (
                <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg space-y-1">
                    <p><strong>Nombre:</strong> {hotel.name}</p>
                    {hotel.room_category && <p><strong>Categoría:</strong> {hotel.room_category}</p>}
                    {hotel.meal_plan && <p><strong>Plan de Comidas:</strong> {hotel.meal_plan}</p>}
                    {hotel.check_in_date && <p><strong>Check-in:</strong> {formatDate(hotel.check_in_date)}</p>}
                    {hotel.check_out_date && <p><strong>Check-out:</strong> {formatDate(hotel.check_out_date)}</p>}
                    {(hotel.accommodation || hotel.reservation_hotel_accommodations)?.length > 0 && (
                        <div className="pl-4">
                            {(hotel.accommodation || hotel.reservation_hotel_accommodations).map((acc, i) => (
                                <p key={i}>Habitaciones: {acc.rooms}, ADT {acc.adt}, CHD {acc.chd}, INF {acc.inf}</p>
                            ))}
                        </div>
                    )}
                    {(hotel.hotelInclusions || hotel.reservation_hotel_inclusions)?.length > 0 && (
                        <ul className="pl-6 list-disc">
                            {(hotel.hotelInclusions || hotel.reservation_hotel_inclusions).map((inc, i) => (
                                <li key={i}>{typeof inc === 'string' ? inc : inc.inclusion}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )) : <InfoItem label="Hoteles" value="No hay hoteles registrados." />}
        </InfoSection>

        <InfoSection title="Tours" icon={<Sun className="w-5 h-5 text-orange-600" />}>
            {(tourData || []).length > 0 ? tourData.map((tour, index) => (
                <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                    <p><strong>Nombre:</strong> {tour.name}</p>
                    {tour.date && <p><strong>Fecha:</strong> {formatDate(tour.date)}</p>}
                    {tour.cost && <p><strong>Costo:</strong> {formatCurrency(tour.cost)}</p>}
                </div>
            )) : <InfoItem label="Tours" value="No hay tours registrados." />}
        </InfoSection>

        <InfoSection title="Asistencias Médicas" icon={<HeartPulse className="w-5 h-5 text-red-600" />}>
            {(assistanceData || []).length > 0 ? assistanceData.map((med, index) => (
                <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                    <p><strong>Plan:</strong> {med.plan_type || med.planType}</p>
                    <p><strong>Vigencia:</strong> {formatDate(med.start_date || med.startDate)} - {formatDate(med.end_date || med.endDate)}</p>
                </div>
            )) : <InfoItem label="Asistencias" value="No hay asistencias médicas." />}
        </InfoSection>

        <InfoSection title="Pago" icon={<CreditCard className="w-5 h-5 text-purple-600" />}>
            <InfoItem label="Precio ADT" value={formatCurrency(reservation._original.price_per_adt)} />
            <InfoItem label="Precio CHD" value={formatCurrency(reservation._original.price_per_chd)} />
            <InfoItem label="Precio INF" value={formatCurrency(reservation._original.price_per_inf)} />
            <InfoItem label="Total" value={formatCurrency(reservation._original.total_amount)} />
            <InfoItem label="Opción" value={reservation._original.payment_option === 'full_payment' ? 'Pago completo' : 'Cuotas'} />
            {(reservation._original.installments || []).map((inst, index) => (
                <InfoItem key={index} label={`Cuota ${index + 1}`} value={`${formatCurrency(inst.amount)} - ${formatDate(inst.due_date || inst.dueDate)}`} fullWidth />
            ))}
        </InfoSection>
        <InfoSection title="Plan de pagos (Cuotas)" icon={<ListChecks className="w-5 h-5 text-emerald-600" />}>
          {paymentOption === 'full_payment' ? (
            <>
              <InfoItem label="Fecha de pago" value={formatDate(reservation._original.payment_date)} />
              <InfoItem label="Valor" value={formatCurrency(reservation._original.total_amount)} />
              <InfoItem label="Estado" value={getStatusLabel(reservation._original.payment_status)} />
            </>
          ) : (
            <div className="col-span-full overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-1 pr-4">#</th>
                    <th className="py-1 pr-4">Vencimiento</th>
                    <th className="py-1 pr-4">Valor</th>
                    <th className="py-1 pr-4">Estado</th>
                    <th className="py-1 pr-4">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-1 pr-4">{idx + 1}</td>
                      <td className="py-1 pr-4">{formatDate(inst.due_date || inst.dueDate)}</td>
                      <td className="py-1 pr-4">{formatCurrency(inst.amount)}</td>
                      <td className="py-1 pr-4">{getStatusLabel(inst.status)}</td>
                      <td className="py-1 pr-4">{inst.payment_date ? formatDate(inst.payment_date) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="col-span-full mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Pagado: {formatCurrency(paidAmount)}</span>
              <span>Total: {formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </InfoSection>
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
            Detalle de la Reserva #{reservation.id}
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