import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Globe, Plane, Hotel, Ticket, BriefcaseMedical, Euro, ArrowLeft, X, Save, Info, MinusCircle, PlusCircle } from 'lucide-react';
import { currentUser as user } from '../../mock/users';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const SectionForm = ({ children, onBack, title }) => (
  <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
    <div className="flex items-center mb-6">
      <motion.button onClick={onBack} className="p-2 mr-4 rounded-full hover:bg-gray-100" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </motion.button>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">{children}</div>
  </motion.div>
);

const ClientForm = ({ data, onChange }) => {
  const handleChange = (e) => onChange({ ...data, [e.target.name]: e.target.value });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-sm font-medium mb-1">Nombre</label><input type="text" name="name" value={data.name} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Identificación</label><input type="text" name="id_card" value={data.id_card} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" value={data.email} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Teléfono</label><input type="tel" name="phone" value={data.phone} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Dirección</label><input type="text" name="address" value={data.address} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Contacto Emergencia</label><input type="text" name="emergency_contact_name" value={data.emergency_contact_name} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Teléfono Emergencia</label><input type="tel" name="emergency_contact_phone" value={data.emergency_contact_phone} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
    </div>
  );
};

const PassengersForm = ({ data, onChange }) => {
  const handleChange = (e) => onChange({ ...data, [e.target.name]: parseInt(e.target.value, 10) || 0 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div><label className="block text-sm font-medium mb-1">Adultos (ADT)</label><input type="number" name="passengers_adt" value={data.passengers_adt} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Niños (CHD)</label><input type="number" name="passengers_chd" value={data.passengers_chd} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
      <div><label className="block text-sm font-medium mb-1">Infantes (INF)</label><input type="number" name="passengers_inf" value={data.passengers_inf} onChange={handleChange} min="0" className="w-full border rounded px-3 py-2" /></div>
    </div>
  );
};

const ItineraryForm = ({ data, onChange }) => {
  const handleSegmentChange = (index, e) => {
    const newSegments = [...(data || [])];
    newSegments[index] = { ...newSegments[index], [e.target.name]: e.target.value };
    onChange(newSegments);
  };
  const addSegment = () => onChange([...(data || []), { origin: '', destination: '', departure_date: getTodayDate(), return_date: getTodayDate() }]);
  const removeSegment = (index) => onChange((data || []).filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      {(data || []).map((segment, index) => (
        <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
          <h5 className="font-bold text-gray-900 mb-3">Segmento {index + 1}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Origen</label><input type="text" name="origin" value={segment.origin} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Destino</label><input type="text" name="destination" value={segment.destination} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Salida</label><input type="date" name="departure_date" value={segment.departure_date} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Regreso</label><input type="date" name="return_date" value={segment.return_date} onChange={(e) => handleSegmentChange(index, e)} className="w-full border rounded px-3 py-2" /></div>
          </div>
          {(data || []).length > 1 && (
            <motion.button type="button" onClick={() => removeSegment(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><MinusCircle className="w-5 h-5" /></motion.button>
          )}
        </div>
      ))}
      <motion.button type="button" onClick={addSegment} className="flex items-center gap-1 text-blue-600 font-medium" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><PlusCircle className="w-5 h-5" /> Agregar Segmento</motion.button>
    </div>
  );
};

const ChangeRequestModal = ({ reservation, onClose }) => {
  
  // Defensive check
  if (!reservation) {
    return null;
  }

  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sections = useMemo(() => [
    { id: 'client', label: 'Información del Titular', icon: User, isPresent: !!reservation.clients, description: 'Modificar datos del cliente principal.' },
    { id: 'passengers', label: 'Cantidad de Pasajeros', icon: Users, isPresent: true, description: 'Ajustar el número de adultos, niños e infantes.' },
    { id: 'itinerary', label: 'Detalles del Itinerario', icon: Globe, isPresent: reservation.reservation_segments?.length > 0, description: 'Cambiar orígenes, destinos y fechas de los segmentos.' },
    { id: 'flights', label: 'Detalles de Vuelos', icon: Plane, isPresent: reservation.reservation_flights?.length > 0, description: 'Editar información de aerolíneas, equipaje, etc.' },
    { id: 'hotels', label: 'Detalles de Hoteles', icon: Hotel, isPresent: reservation.reservation_hotels?.length > 0, description: 'Modificar hoteles, habitaciones o planes de comida.' },
    { id: 'tours', label: 'Tours y Actividades', icon: Ticket, isPresent: reservation.reservation_tours?.length > 0, description: 'Añadir, eliminar o cambiar tours contratados.' },
    { id: 'medicalAssistances', label: 'Asistencias Médicas', icon: BriefcaseMedical, isPresent: reservation.reservation_medical_assistances?.length > 0, description: 'Ajustar planes o fechas de cobertura médica.' },
    { id: 'payment', label: 'Detalles de Pago', icon: Euro, isPresent: true, description: 'Cambiar precios, forma de pago o plan de cuotas.' },
  ], [reservation]);

  const getSectionData = (sectionId) => {
    switch (sectionId) {
      case 'client': return { ...reservation.clients };
      case 'passengers': return { passengers_adt: reservation.passengers_adt, passengers_chd: reservation.passengers_chd, passengers_inf: reservation.passengers_inf };
      case 'itinerary': return [...(reservation.reservation_segments || [])];
      // Agrega casos para las otras secciones aquí
      default: return {};
    }
  };

  const handleSelectSection = (sectionId) => {
    const data = getSectionData(sectionId);
    setFormData(data);
    setOriginalData(data);
    setEditingSection(sectionId);
  };

  const handleBack = () => {
    setEditingSection(null);
    setFormData(null);
    setOriginalData(null);
    setReason('');
  };

  const hasChanges = useMemo(() => {
    if (!originalData || !formData) return false;
    return JSON.stringify(originalData) !== JSON.stringify(formData);
  }, [originalData, formData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:4000/api/reservations/${reservation.id}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: editingSection, changes: formData, reason, userId: user?.id })
      });
      alert('Solicitud de cambio enviada con éxito.');
      onClose();
    } catch (error) {
      console.error('Error sending change request:', error);
      alert('Error al enviar la solicitud de cambio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSectionForm = () => {
    if (!editingSection) return null;
    switch (editingSection) {
      case 'client': return <ClientForm data={formData} onChange={setFormData} />;
      case 'passengers': return <PassengersForm data={formData} onChange={setFormData} />;
      case 'itinerary': return <ItineraryForm data={formData} onChange={setFormData} />;
      default: return <p className="text-center text-gray-500 p-8">El formulario para esta sección aún no ha sido implementado.</p>;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            {editingSection ? (
              <motion.div key="form">
                <SectionForm onBack={handleBack} title={`Editar ${sections.find(s => s.id === editingSection)?.label}`}>
                  {renderSectionForm()}
                </SectionForm>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del cambio</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Explica brevemente por qué se necesita este cambio..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <motion.button onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Cancelar
                    </motion.button>
                    <motion.button
                      onClick={handleSubmit}
                      disabled={!hasChanges || !reason || isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    >
                      <Save className="w-5 h-5" />
                      {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Solicitud de Cambio</h2>
                  <motion.button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
                <p className="text-center text-gray-600 mb-8">Selecciona la sección de la reserva que deseas modificar.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.filter(s => s.isPresent).map(section => {
                    const Icon = section.icon;
                    return (
                      <motion.button
                        key={section.id}
                        onClick={() => handleSelectSection(section.id)}
                        className="text-left p-4 bg-gray-50 rounded-xl border hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                        whileHover={{ scale: 1.03, y: -5 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-md font-semibold text-gray-800 group-hover:text-blue-800">{section.label}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{section.description}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChangeRequestModal;