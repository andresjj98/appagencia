import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Edit, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_PASSENGER = {
  id: null,
  reservation_id: null,
  name: '',
  lastname: '',
  document_type: 'CC',
  document_number: '',
  birth_date: '',
  passenger_type: 'ADT',
  notes: '',
};

const generateUiId = () => `pax-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const sanitizePassengerFields = (rawPassenger) => {
  const passenger = rawPassenger && typeof rawPassenger === 'object' ? rawPassenger : {};
  const base = {
    ...EMPTY_PASSENGER,
    ...passenger,
  };

  return {
    id: passenger.id ?? passenger.passenger_id ?? passenger.passengerId ?? null,
    reservation_id: passenger.reservation_id ?? passenger.reservationId ?? null,
    name: base.name ?? '',
    lastname: base.lastname ?? base.last_name ?? base.lastName ?? '',
    document_type: base.document_type ?? base.documentType ?? 'CC',
    document_number: base.document_number ?? base.documentNumber ?? '',
    birth_date: base.birth_date ?? base.birthDate ?? '',
    passenger_type: base.passenger_type ?? base.passengerType ?? 'ADT',
    notes: base.notes ?? base.note ?? '',
  };
};

const mapToUiPassengers = (passengerList = []) =>
  (passengerList || []).map((passenger) => {
    const sanitized = sanitizePassengerFields(passenger);
    return {
      ...sanitized,
      _uiId: (passenger && passenger._uiId) || generateUiId(),
    };
  });
const toComparablePassenger = (passenger) => {
  const sanitized = sanitizePassengerFields(passenger);
  return {
    ...sanitized,
    id: sanitized.id ?? null,
    reservation_id: sanitized.reservation_id ?? null,
    document_type: sanitized.document_type ?? 'CC',
    document_number: sanitized.document_number ?? '',
    birth_date: sanitized.birth_date ?? '',
    passenger_type: sanitized.passenger_type ?? 'ADT',
    notes: sanitized.notes ?? '',
  };
};

const parsePassengerCount = (reservationLike, snakeKey, camelKey) => {
  const raw = reservationLike?.[snakeKey];
  if (raw !== undefined && raw !== null) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const camelRaw = reservationLike?.[camelKey];
  if (camelRaw !== undefined && camelRaw !== null) {
    const parsed = Number(camelRaw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const computePassengerCapacity = (reservationLike) => {
  if (!reservationLike) {
    return 0;
  }
  const adt = parsePassengerCount(reservationLike, 'passengers_adt', 'passengersADT');
  const chd = parsePassengerCount(reservationLike, 'passengers_chd', 'passengersCHD');
  const inf = parsePassengerCount(reservationLike, 'passengers_inf', 'passengersINF');
  return Math.max(adt + chd + inf, 0);
};

const getRawPassengerList = (reservation) => {
  if (!reservation) {
    return [];
  }
  if (reservation._original?.reservation_passengers) {
    return reservation._original.reservation_passengers;
  }
  if (reservation.reservation_passengers) {
    return reservation.reservation_passengers;
  }
  return [];
};

const getReservationId = (reservation) => {
  if (!reservation) {
    return null;
  }
  if (reservation._original?.id) {
    return reservation._original.id;
  }
  if (reservation.id) {
    return reservation.id;
  }
  if (reservation._original?.reservation_id) {
    return reservation._original.reservation_id;
  }
  return reservation.reservation_id ?? null;
};

const PassengerForm = ({ passenger, onSave, onCancel, availableTypes }) => {
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_PASSENGER,
    ...sanitizePassengerFields(passenger),
  }));
  const maxBirthDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (passenger) {
      setFormData({ ...EMPTY_PASSENGER, ...sanitizePassengerFields(passenger) });
    } else {
      setFormData({ ...EMPTY_PASSENGER });
    }
  }, [passenger]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let processedValue = value;

    // Convertir a mayúsculas los campos de texto
    if (name === 'name' || name === 'lastname' || name === 'notes') {
      processedValue = value.toUpperCase();
    }

    // Eliminar puntos del número de documento
    if (name === 'document_number') {
      processedValue = value.replace(/\./g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(sanitizePassengerFields(formData));
  };

  return (
    <motion.div
      initial={{ opacity: 0.5, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-100 p-4 rounded-lg border border-gray-300"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-bold text-lg">
          {passenger ? 'Editar Pasajero' : 'Agregar Pasajero'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre"
            className="p-2 border rounded"
            required
          />
          <input
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            placeholder="Apellido"
            className="p-2 border rounded"
            required
          />
          <select
            name="document_type"
            value={formData.document_type}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="CC">CC: Cédula</option>
            <option value="TI">TI: Tarjeta de Identidad</option>
            <option value="RC">RC: Registro Civil</option>
            <option value="PP">PP: Pasaporte</option>
          </select>
          <input
            name="document_number"
            value={formData.document_number}
            onChange={handleChange}
            placeholder="Numero de Documento"
            className="p-2 border rounded"
            required
          />
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            className="p-2 border rounded"
            max={maxBirthDate}
            required
          />
          <select
            name="passenger_type"
            value={formData.passenger_type}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="ADT" disabled={!availableTypes?.ADT}>Adulto (ADT) {availableTypes?.ADT ? `- Disponibles: ${availableTypes.ADT}` : '- No disponible'}</option>
            <option value="CHD" disabled={!availableTypes?.CHD}>Niño (CHD) {availableTypes?.CHD ? `- Disponibles: ${availableTypes.CHD}` : '- No disponible'}</option>
            <option value="INF" disabled={!availableTypes?.INF}>Infante (INF) {availableTypes?.INF ? `- Disponibles: ${availableTypes.INF}` : '- No disponible'}</option>
          </select>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notas (opcional)"
            className="p-2 border rounded md:col-span-2"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded-md text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
          >
            Guardar Pasajero
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const PassengerManagementTab = ({ reservation, onUpdateReservation, onUpdate }) => {
  const updateHandler = onUpdateReservation || onUpdate;
  const baseReservation = reservation?._original ?? reservation ?? {};
  const reservationId = getReservationId(reservation);
  const rawPassengers = getRawPassengerList(reservation);
  const rawPassengersComparable = useMemo(
    () => rawPassengers.map(toComparablePassenger),
    [rawPassengers],
  );
  const rawPassengersKey = useMemo(
    () => JSON.stringify(rawPassengersComparable),
    [rawPassengersComparable],
  );

  const [passengers, setPassengers] = useState(() => mapToUiPassengers(rawPassengers));
  const [initialPassengersSnapshot, setInitialPassengersSnapshot] = useState(() =>
    mapToUiPassengers(rawPassengers).map(toComparablePassenger),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  useEffect(() => {
    const formatted = mapToUiPassengers(rawPassengers);
    setPassengers(formatted);
    setInitialPassengersSnapshot(formatted.map(toComparablePassenger));
    setIsFormOpen(false);
    setEditingPassenger(null);
  }, [rawPassengersKey]);

  const totalAllowed = computePassengerCapacity(baseReservation);
  const currentCount = passengers.length;
  const remainingSlots = totalAllowed ? Math.max(totalAllowed - currentCount, 0) : null;
  const isAtCapacity = totalAllowed ? currentCount >= totalAllowed : false;

  const adtRequired = parsePassengerCount(baseReservation, 'passengers_adt', 'passengersADT');
  const chdRequired = parsePassengerCount(baseReservation, 'passengers_chd', 'passengersCHD');
  const infRequired = parsePassengerCount(baseReservation, 'passengers_inf', 'passengersINF');

  const passengerTypeCounts = useMemo(() => {
    const counts = { ADT: 0, CHD: 0, INF: 0 };
    passengers.forEach(pax => {
      const type = pax.passenger_type || 'ADT';
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return counts;
  }, [passengers]);

  const availableTypes = useMemo(() => {
    if (editingPassenger) {
      const currentType = editingPassenger.passenger_type || 'ADT';
      return {
        ADT: adtRequired - passengerTypeCounts.ADT + (currentType === 'ADT' ? 1 : 0),
        CHD: chdRequired - passengerTypeCounts.CHD + (currentType === 'CHD' ? 1 : 0),
        INF: infRequired - passengerTypeCounts.INF + (currentType === 'INF' ? 1 : 0),
      };
    }
    return {
      ADT: adtRequired - passengerTypeCounts.ADT,
      CHD: chdRequired - passengerTypeCounts.CHD,
      INF: infRequired - passengerTypeCounts.INF,
    };
  }, [adtRequired, chdRequired, infRequired, passengerTypeCounts, editingPassenger]);

  const typeValidationMessage = useMemo(() => {
    const messages = [];
    if (passengerTypeCounts.ADT !== adtRequired) {
      messages.push(`ADT: ${passengerTypeCounts.ADT}/${adtRequired}`);
    }
    if (passengerTypeCounts.CHD !== chdRequired) {
      messages.push(`CHD: ${passengerTypeCounts.CHD}/${chdRequired}`);
    }
    if (passengerTypeCounts.INF !== infRequired) {
      messages.push(`INF: ${passengerTypeCounts.INF}/${infRequired}`);
    }
    return messages.length > 0 ? messages.join(' | ') : null;
  }, [passengerTypeCounts, adtRequired, chdRequired, infRequired]);

  const hasChanges = useMemo(() => {
    const comparableCurrent = passengers.map(toComparablePassenger);
    if (comparableCurrent.length !== initialPassengersSnapshot.length) {
      return true;
    }
    return JSON.stringify(comparableCurrent) !== JSON.stringify(initialPassengersSnapshot);
  }, [passengers, initialPassengersSnapshot]);

  const handleAddPassenger = () => {
    setSubmissionError(null);
    setEditingPassenger(null);
    setIsFormOpen(true);
  };

  const handleSavePassenger = (formValues) => {
    const mergedValues = editingPassenger ? { ...editingPassenger, ...formValues } : { ...formValues };
    const sanitized = sanitizePassengerFields(mergedValues);
    sanitized.reservation_id = sanitized.reservation_id ?? reservationId ?? null;

    if (editingPassenger) {
      setPassengers((prev) =>
        prev.map((pax) =>
          pax._uiId === editingPassenger._uiId ? { ...pax, ...sanitized } : pax,
        ),
      );
    } else {
      setPassengers((prev) => [...prev, { ...sanitized, _uiId: generateUiId() }]);
    }

    setIsFormOpen(false);
    setEditingPassenger(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingPassenger(null);
  };

  const handleEditPassenger = (passengerItem) => {
    setSubmissionError(null);
    setEditingPassenger(passengerItem);
    setIsFormOpen(true);
  };

  const handleDeletePassenger = (uiId, displayName) => {
    if (!window.confirm(`Estas seguro de eliminar a ${displayName}?`)) {
      return;
    }
    setPassengers((prev) => prev.filter((pax) => pax._uiId !== uiId));
    if (editingPassenger && editingPassenger._uiId === uiId) {
      setIsFormOpen(false);
      setEditingPassenger(null);
    }
  };

  const handleSubmitAll = async () => {
    console.log('=== PASSENGER TAB DEBUG ===');
    console.log('handleSubmitAll called');
    console.log('updateHandler exists?', !!updateHandler);

    if (!updateHandler) {
      setSubmissionError('No hay una accion definida para guardar los pasajeros.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const payloadPassengers = passengers.map((pax) => {
      const sanitized = sanitizePassengerFields(pax);
      sanitized.reservation_id = sanitized.reservation_id ?? reservationId ?? null;
      return sanitized;
    });

    console.log('Passengers to send:', payloadPassengers);
    console.log('Passengers count:', payloadPassengers.length);

    const basePayload = reservation._original ? { ...reservation._original } : { ...reservation };
    const updatedReservation = {
      ...basePayload,
      reservation_passengers: payloadPassengers,
    };

    console.log('Full payload:', updatedReservation);
    console.log('Calling updateHandler...');

    try {
      const result = updateHandler(updatedReservation);
      console.log('updateHandler result:', result);
      console.log('Is promise?', result && typeof result.then === 'function');

      if (result && typeof result.then === 'function') {
        console.log('Awaiting promise...');
        await result;
        console.log('Promise resolved');
      }

      setInitialPassengersSnapshot(payloadPassengers.map(toComparablePassenger));
      console.log('Passengers saved successfully!');
    } catch (error) {
      console.error('Error saving passengers:', error);
      setSubmissionError(error?.message || 'No se pudieron guardar los pasajeros.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const capacityLabel = totalAllowed ? `${currentCount}/${totalAllowed}` : `${currentCount}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Pasajeros de la Reserva</h3>
          <p className="text-sm text-gray-500">
            {`Pasajeros agregados: ${capacityLabel}`}
            {totalAllowed ? ` | Cupos restantes: ${remainingSlots}` : ''}
          </p>
          {typeValidationMessage && (
            <p className="text-sm text-amber-600 font-medium mt-1">
              Tipos de pasajeros: {typeValidationMessage}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddPassenger}
          disabled={isFormOpen || isAtCapacity}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
            isFormOpen || isAtCapacity
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={isAtCapacity ? 'Se alcanzo el numero maximo de pasajeros' : ''}
        >
          <UserPlus className="w-4 h-4" />
          Agregar Pasajero
        </button>
      </div>

      {submissionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {submissionError}
        </div>
      )}

      <AnimatePresence>
        {isFormOpen && (
          <PassengerForm
            passenger={editingPassenger}
            onSave={handleSavePassenger}
            onCancel={handleCancelForm}
            availableTypes={availableTypes}
          />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {passengers.length === 0 && (
          <div className="p-4 bg-white rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500">
            Aun no se han agregado pasajeros a esta reserva.
          </div>
        )}

        {passengers.map((pax) => {
          const displayName = [pax.name, pax.lastname].filter(Boolean).join(' ') || 'Pasajero sin nombre';
          const documentLabel = [pax.document_type, pax.document_number].filter(Boolean).join(': ');

          const passengerTypeLabel = pax.passenger_type === 'ADT' ? 'Adulto' : pax.passenger_type === 'CHD' ? 'Niño' : 'Infante';

          return (
            <div
              key={pax._uiId}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{displayName}</p>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {passengerTypeLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {documentLabel || 'Documento no informado'}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha de nacimiento: {pax.birth_date || 'No definida'}
                </p>
                {pax.notes && (
                  <p className="text-sm text-gray-500 italic">Notas: {pax.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEditPassenger(pax)}
                  className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePassenger(pax._uiId, displayName)}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={!hasChanges || isSubmitting}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold ${
            !hasChanges || isSubmitting
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar pasajeros en BD'}
        </button>
      </div>
    </div>
  );
};

export default PassengerManagementTab;


