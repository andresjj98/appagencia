import React from 'react';
import { User, Mail, Phone, Calendar, MapPin, Hash } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-md font-semibold text-gray-800">{children}</p>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200">
    <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const GeneralInfoPanel = ({ reservation }) => {
  const res = reservation._original;
  const firstSegment = res.reservation_segments?.[0] || {};

  return (
    <div className="space-y-6">
      <Section title="Información del Titular">
        <DetailItem icon={User} label="Nombre">{res.clients?.name || 'N/A'}</DetailItem>
        <DetailItem icon={Mail} label="Email">{res.clients?.email || 'N/A'}</DetailItem>
        <DetailItem icon={Phone} label="Teléfono">{res.clients?.phone || 'N/A'}</DetailItem>
        <DetailItem icon={Hash} label="Documento de Identidad">{res.clients?.id_card || 'N/A'}</DetailItem>
      </Section>

      <Section title="Detalles del Viaje">
        <DetailItem icon={MapPin} label="Destino Principal">{`${firstSegment.origin || 'N/A'} - ${firstSegment.destination || 'N/A'}`}</DetailItem>
        <DetailItem icon={User} label="Asesor Asignado">{res.advisor?.name || 'N/A'}</DetailItem>
        <DetailItem icon={Calendar} label="Fecha de Salida">{new Date(firstSegment.departure_date).toLocaleDateString()}</DetailItem>
        <DetailItem icon={Calendar} label="Fecha de Regreso">{new Date(firstSegment.return_date).toLocaleDateString()}</DetailItem>
      </Section>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen de Servicios Contratados</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {res.reservation_flights?.length > 0 && <li>{res.reservation_flights.length} Vuelo(s)</li>}
          {res.reservation_hotels?.length > 0 && <li>{res.reservation_hotels.length} Hotel(es)</li>}
          {res.reservation_tours?.length > 0 && <li>{res.reservation_tours.length} Tour(s)</li>}
          {res.reservation_medical_assistances?.length > 0 && <li>{res.reservation_medical_assistances.length} Asistencia(s) Médica(s)</li>}
        </ul>
      </div>
    </div>
  );
};

export default GeneralInfoPanel;
