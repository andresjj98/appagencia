import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Hash, Edit, Save, X } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, children, isEditing, value, onChange, type = 'text' }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value}
          onChange={onChange}
          className="text-md font-semibold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
        />
      ) : (
        <p className="text-md font-semibold text-gray-800">{children}</p>
      )}
    </div>
  </div>
);

const Section = ({ title, children, onEdit, isEditing, onSave, onCancel }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 relative">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button onClick={onSave} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><Save size={18} /></button>
            <button onClick={onCancel} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><X size={18} /></button>
          </>
        ) : (
          <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Edit size={18} /></button>
        )}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const GeneralInfoPanel = ({ reservation, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    if (reservation?._original) {
      setEditedData({
        clientName: reservation._original.clients?.name || '',
        clientEmail: reservation._original.clients?.email || '',
        clientPhone: reservation._original.clients?.phone || '',
        clientIdCard: reservation._original.clients?.id_card || '',
        segments: reservation._original.reservation_segments?.map(s => ({...s})) || [],
      });
    }
  }, [reservation, isEditing]);

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...editedData.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setEditedData(prev => ({ ...prev, segments: newSegments }));
  };

  const handleSave = () => {
    const updatedReservation = {
      ...reservation,
      _original: {
        ...reservation._original,
        clients: {
          ...reservation._original.clients,
          name: editedData.clientName,
          email: editedData.clientEmail,
          phone: editedData.clientPhone,
          id_card: editedData.clientIdCard,
        },
        reservation_segments: editedData.segments,
      }
    };
    onUpdate(updatedReservation);
    setIsEditing(false);
  };

  if (!reservation?._original) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <Section 
        title="Información del Titular" 
        isEditing={isEditing} 
        onEdit={() => setIsEditing(true)} 
        onSave={handleSave} 
        onCancel={() => setIsEditing(false)}
      >
        <DetailItem 
          icon={User} 
          label="Nombre" 
          isEditing={isEditing} 
          value={editedData.clientName}
          onChange={(e) => handleFieldChange('clientName', e.target.value)}
        >
          {reservation._original.clients?.name || 'N/A'}
        </DetailItem>
        <DetailItem 
          icon={Mail} 
          label="Email" 
          isEditing={isEditing} 
          value={editedData.clientEmail}
          onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
        >
          {reservation._original.clients?.email || 'N/A'}
        </DetailItem>
        <DetailItem 
          icon={Phone} 
          label="Teléfono" 
          isEditing={isEditing} 
          value={editedData.clientPhone}
          onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
        >
          {reservation._original.clients?.phone || 'N/A'}
        </DetailItem>
        <DetailItem 
          icon={Hash} 
          label="Documento de Identidad" 
          isEditing={isEditing} 
          value={editedData.clientIdCard}
          onChange={(e) => handleFieldChange('clientIdCard', e.target.value)}
        >
          {reservation._original.clients?.id_card || 'N/A'}
        </DetailItem>
      </Section>

      <Section 
        title="Detalles del Viaje"
        isEditing={isEditing} 
        onEdit={() => setIsEditing(true)} 
        onSave={handleSave} 
        onCancel={() => setIsEditing(false)}
      >
        <div className="col-span-2 grid grid-cols-1 gap-6">
          {(editedData.segments || []).map((segment, index) => (
            <div key={index} className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem 
                icon={MapPin} 
                label={`Origen Tramo ${index + 1}`}
                isEditing={isEditing}
                value={segment.origin}
                onChange={(e) => handleSegmentChange(index, 'origin', e.target.value)}
              >
                {segment.origin || 'N/A'}
              </DetailItem>
              <DetailItem 
                icon={MapPin} 
                label={`Destino Tramo ${index + 1}`}
                isEditing={isEditing}
                value={segment.destination}
                onChange={(e) => handleSegmentChange(index, 'destination', e.target.value)}
              >
                {segment.destination || 'N/A'}
              </DetailItem>
              <DetailItem 
                icon={Calendar} 
                label="Fecha de Salida"
                isEditing={isEditing}
                type="date"
                value={segment.departure_date ? new Date(segment.departure_date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleSegmentChange(index, 'departure_date', e.target.value)}
              >
                {segment.departure_date ? new Date(segment.departure_date).toLocaleDateString() : 'N/A'}
              </DetailItem>
              <DetailItem 
                icon={Calendar} 
                label="Fecha de Regreso"
                isEditing={isEditing}
                type="date"
                value={segment.return_date ? new Date(segment.return_date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleSegmentChange(index, 'return_date', e.target.value)}
              >
                {segment.return_date ? new Date(segment.return_date).toLocaleDateString() : 'N/A'}
              </DetailItem>
            </div>
          ))}
        </div>
        <div className="col-span-1">
          <DetailItem icon={User} label="Asesor Asignado">
            {reservation._original.advisor?.name || 'N/A'}
          </DetailItem>
        </div>
      </Section>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen de Servicios Contratados</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {reservation._original.reservation_flights?.length > 0 && <li>{reservation._original.reservation_flights.length} Vuelo(s)</li>}
          {reservation._original.reservation_hotels?.length > 0 && <li>{reservation._original.reservation_hotels.length} Hotel(es)</li>}
          {reservation._original.reservation_tours?.length > 0 && <li>{reservation._original.reservation_tours.length} Tour(s)</li>}
          {reservation._original.reservation_medical_assistances?.length > 0 && <li>{reservation._original.reservation_medical_assistances.length} Asistencia(s) Médica(s)</li>}
        </ul>
      </div>
    </div>
  );
};

export default GeneralInfoPanel;
