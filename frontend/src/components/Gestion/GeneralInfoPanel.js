import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Hash, Edit, Save, X, LifeBuoy, Plane, Hotel, Ticket, HeartPulse, DollarSign } from 'lucide-react';
import { formatUserName } from '../../utils/nameFormatter';

const DetailItem = ({ icon: Icon, label, children, isEditing, value, onChange, type = 'text' }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {isEditing ? (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="text-lg font-semibold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
        />
      ) : (
        <p className="text-lg font-semibold text-gray-900">{children}</p>
      )}
    </div>
  </div>
);

const Section = ({ title, children, onEdit, isEditing, onSave, onCancel }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex justify-between items-center mb-5">
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
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

const formatCurrencyCOP = (value) => {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(numeric));
};

const formatDateValue = (value) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }
  return date.toLocaleDateString('es-CO');
};

const paymentBadgeClasses = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'overdue':
    case 'late':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

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
        clientAddress: reservation._original.clients?.address || '',
        emergencyContactName: reservation._original.clients?.emergency_contact_name || '',
        emergencyContactPhone: reservation._original.clients?.emergency_contact_phone || '',
        segments: reservation._original.reservation_segments?.map(s => ({ ...s })) || [],
      });
    }
  }, [reservation, isEditing]);

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...(editedData.segments || [])];
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
          address: editedData.clientAddress,
          emergency_contact_name: editedData.emergencyContactName,
          emergency_contact_phone: editedData.emergencyContactPhone,
        },
        reservation_segments: editedData.segments,
      }
    };
    onUpdate(updatedReservation);
    setIsEditing(false);
  };

  if (!reservation?._original) return <div>Cargando...</div>;

  const formatSegmentLocation = (segment, type) => {
    if (!segment) {
      return 'N/A';
    }
    const rawCode = segment?.[type];
    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : rawCode ? String(rawCode) : '';
    const nameCandidates = [
      segment?.[`${type}_city`],
      segment?.[`${type}_name`],
      segment?.[`${type}_label`],
      segment?.[`${type}_airport_name`],
      segment?.[`${type}_airport_label`],
      segment?.[`${type}_airport`],
      segment?.[`${type}_city_name`],
      segment?.[`${type}_description`],
      segment?.[`${type}City`],
      segment?.[`${type}Name`],
      segment?.[`${type}Label`],
      segment?.[`${type}CityName`],
      segment?.[`${type}AirportName`],
      segment?.[`${type}AirportLabel`],
    ];
    const name = nameCandidates
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(Boolean);

    if (code && name) {
      return `${code} - ${name}`;
    }
    if (code) {
      return code;
    }
    if (name) {
      return name;
    }
    return 'N/A';
  };

  const clientData = reservation._original.clients || {};
  const passengersADT = reservation._original.passengers_adt ?? reservation._original.passengersADT ?? 0;
  const passengersCHD = reservation._original.passengers_chd ?? reservation._original.passengersCHD ?? 0;
  const passengersINF = reservation._original.passengers_inf ?? reservation._original.passengersINF ?? 0;
  const totalPassengers = passengersADT + passengersCHD + passengersINF;
  const totalPassengersText = totalPassengers > 0
    ? `${totalPassengers} pasajero${totalPassengers === 1 ? '' : 's'}`
    : 'Sin pasajeros registrados.';

  const paymentOption = reservation._original.payment_option || reservation._original.paymentOption;
  const installments = reservation._original.reservation_installments || reservation._original.installments || [];
  const normalizeStatus = (status) => (status || '').toString().toLowerCase();
  const sortedInstallments = [...installments].sort((a, b) => new Date(a.due_date || a.dueDate || 0) - new Date(b.due_date || b.dueDate || 0));
  const primaryInstallment = sortedInstallments[0] || null;
  const paidInstallments = installments.filter(inst => normalizeStatus(inst.status) === 'paid').length;
  const overdueInstallments = installments.filter(inst => {
    const normalized = normalizeStatus(inst.status);
    return normalized === 'overdue' || normalized === 'late';
  }).length;
  const pendingInstallments = Math.max(installments.length - paidInstallments - overdueInstallments, 0);

  let paymentStatus = normalizeStatus(reservation._original.payment_status || reservation._original.paymentStatus);
  let paymentSummaryText = 'Sin informacion de pagos.';
  let paymentDate = reservation._original.payment_date || reservation._original.paymentDate;
  let totalAmount = reservation._original.total_amount ?? reservation._original.totalAmount ?? 0;

  if (paymentOption === 'full_payment') {
    if (primaryInstallment) {
      paymentStatus = normalizeStatus(primaryInstallment.status) || paymentStatus;
      paymentDate = primaryInstallment.payment_date || primaryInstallment.paymentDate || primaryInstallment.due_date || primaryInstallment.dueDate || paymentDate;
      totalAmount = primaryInstallment.amount ?? totalAmount;
    }
    paymentSummaryText = paymentStatus === 'paid'
      ? 'Pago unico completado.'
      : 'Pago unico pendiente.';
  } else if (paymentOption === 'installments' || installments.length > 0) {
    paymentSummaryText = `Pago a cuotas con ${installments.length} cuota(s).`;
  }

  const serviceItems = [
    {
      icon: Plane,
      label: 'Vuelos',
      count: reservation._original.reservation_flights?.length || 0,
    },
    {
      icon: Hotel,
      label: 'Hoteles',
      count: reservation._original.reservation_hotels?.length || 0,
    },
    {
      icon: Ticket,
      label: 'Tours',
      count: reservation._original.reservation_tours?.length || 0,
    },
    {
      icon: HeartPulse,
      label: 'Asistencias medicas',
      count: reservation._original.reservation_medical_assistances?.length || 0,
    },
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      <Section
        title="Informacion del Titular"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      >
        <DetailItem
          icon={User}
          label="Nombre"
          isEditing={isEditing}
          value={editedData.clientName || ''}
          onChange={(e) => handleFieldChange('clientName', e.target.value)}
        >
          {clientData?.name || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={Mail}
          label="Email"
          isEditing={isEditing}
          value={editedData.clientEmail || ''}
          onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
        >
          {clientData?.email || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={Phone}
          label="Telefono"
          isEditing={isEditing}
          value={editedData.clientPhone || ''}
          onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
        >
          {clientData?.phone || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={Hash}
          label="Documento de Identidad"
          isEditing={isEditing}
          value={editedData.clientIdCard || ''}
          onChange={(e) => handleFieldChange('clientIdCard', e.target.value)}
        >
          {clientData?.id_card || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={MapPin}
          label="Direccion"
          isEditing={isEditing}
          value={editedData.clientAddress || ''}
          onChange={(e) => handleFieldChange('clientAddress', e.target.value)}
        >
          {clientData?.address || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={LifeBuoy}
          label="Contacto de Emergencia"
          isEditing={isEditing}
          value={editedData.emergencyContactName || ''}
          onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
        >
          {clientData?.emergency_contact_name || 'N/A'}
        </DetailItem>
        <DetailItem
          icon={Phone}
          label="Telefono de Emergencia"
          isEditing={isEditing}
          value={editedData.emergencyContactPhone || ''}
          onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
          type="tel"
        >
          {clientData?.emergency_contact_phone || 'N/A'}
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
            <div key={index} className="p-4 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50">
              <DetailItem
                icon={MapPin}
                label={`Origen Tramo ${index + 1}`}
                isEditing={isEditing}
                value={segment.origin || ''}
                onChange={(e) => handleSegmentChange(index, 'origin', e.target.value)}
              >
                {formatSegmentLocation(segment, 'origin')}
              </DetailItem>
              <DetailItem
                icon={MapPin}
                label={`Destino Tramo ${index + 1}`}
                isEditing={isEditing}
                value={segment.destination || ''}
                onChange={(e) => handleSegmentChange(index, 'destination', e.target.value)}
              >
                {formatSegmentLocation(segment, 'destination')}
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
            {formatUserName(reservation._original.advisor?.name) || 'N/A'}
          </DetailItem>
        </div>
      </Section>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Resumen de Servicios Contratados</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {serviceItems.length > 0 ? (
              serviceItems.map(({ icon: IconRef, label, count }) => (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <IconRef className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Sin servicios registrados.</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="text-lg font-semibold text-gray-800">Pasajeros</h4>
            <p className="text-gray-700">{totalPassengersText}</p>
            <div className="grid grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="bg-white rounded-md p-3 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500">Adultos</p>
                <p className="text-lg font-semibold text-gray-900">{passengersADT}</p>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500">Ninos</p>
                <p className="text-lg font-semibold text-gray-900">{passengersCHD}</p>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm text-center">
                <p className="text-xs uppercase text-gray-500">Infantes</p>
                <p className="text-lg font-semibold text-gray-900">{passengersINF}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pagos y Estado</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentBadgeClasses(paymentStatus)}`}>
            {paymentStatus ? paymentStatus.toUpperCase() : 'SIN ESTADO'}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-6">{paymentSummaryText}</p>

        {paymentOption === 'full_payment' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500">Fecha de pago</p>
              <p className="font-semibold text-gray-900 mt-1">{formatDateValue(paymentDate)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500">Valor</p>
              <p className="font-semibold text-gray-900 mt-1">{formatCurrencyCOP(totalAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500">Estado</p>
              <p className="font-semibold text-gray-900 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentBadgeClasses(paymentStatus)}`}>
                  {paymentStatus || 'N/A'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {installments.length > 0 ? (
              installments.map((inst, index) => {
                const status = normalizeStatus(inst.status);
                return (
                  <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">Cuota {index + 1}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-gray-600">
                      <span>Vence: {formatDateValue(inst.due_date || inst.dueDate)}</span>
                      <span>Monto: {formatCurrencyCOP(inst.amount)}</span>
                      <span>
                        Estado:
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${paymentBadgeClasses(status)}`}>
                          {status || 'N/A'}
                        </span>
                      </span>
                      <span>Pago: {formatDateValue(inst.payment_date || inst.paymentDate)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No hay informacion de cuotas registrada.</p>
            )}
            {installments.length > 0 && (
              <div className="text-xs text-gray-500">
                Resumen cuotas | Pagadas: {paidInstallments} | Pendientes: {pendingInstallments} | Atrasadas: {overdueInstallments}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralInfoPanel;
