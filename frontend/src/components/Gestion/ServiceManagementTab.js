import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader, Plane, Building, Map, HeartPulse, Edit, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const SERVICE_KEYS_BY_TYPE = {
  all_inclusive: ['flight_status_ok', 'hotel_status_ok', 'tours_status_ok', 'assistance_status_ok'],
  flights_only: ['flight_status_ok'],
  hotel_only: ['hotel_status_ok'],
  tours_only: ['tours_status_ok'],
  medical_assistance: ['assistance_status_ok'],
};

const cloneCollection = (value) => JSON.parse(JSON.stringify(Array.isArray(value) ? value : []));
const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-CO');
};
const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('es-CO');
};

const EmptyState = ({ text }) => (
  <p className="text-sm text-gray-500 italic">{text}</p>
);

const DetailItem = ({ label, value }) => (
  <p className="text-sm text-gray-600 pl-2">
    - {label}: <span className="font-medium">{value ?? 'N/A'}</span>
  </p>
);

const FlightDetails = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState text="No hay vuelos registrados." />;
  }

  return (
    <div className="space-y-3">
      {data.map((flight, index) => {
        const itineraries = Array.isArray(flight.reservation_flight_itineraries)
          ? flight.reservation_flight_itineraries
          : [];
        return (
          <div key={flight.id ?? index} className="p-3 bg-gray-100 rounded-md space-y-2">
            <p className="font-semibold">
              {flight.airline || 'Aerolinea no definida'} - PNR: {flight.pnr || 'N/A'}
            </p>
            {itineraries.length > 0 ? (
              itineraries.map((itin, itinIndex) => (
                <DetailItem
                  key={itin.id ?? itinIndex}
                  label={`Vuelo ${itin.flight_number || itinIndex + 1}`}
                  value={`${formatDateTime(itin.departure_time)} -> ${formatDateTime(itin.arrival_time)}`}
                />
              ))
            ) : (
              <EmptyState text="Sin itinerarios asociados." />
            )}
          </div>
        );
      })}
    </div>
  );
};

const HotelDetails = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState text="No hay hoteles registrados." />;
  }

  return (
    <div className="space-y-3">
      {data.map((hotel, index) => (
        <div key={hotel.id ?? index} className="p-3 bg-gray-100 rounded-md space-y-2">
          <p className="font-semibold">{hotel.name || 'Hotel sin nombre'}</p>
          <DetailItem label="Categoria" value={hotel.room_category || 'N/A'} />
          <DetailItem label="Plan de comidas" value={hotel.meal_plan || 'N/A'} />
        </div>
      ))}
    </div>
  );
};

const TourDetails = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState text="No hay tours registrados." />;
  }

  return (
    <div className="space-y-3">
      {data.map((tour, index) => (
        <div key={tour.id ?? index} className="p-3 bg-gray-100 rounded-md space-y-2">
          <p className="font-semibold">{tour.name || 'Tour sin nombre'}</p>
          <DetailItem label="Fecha" value={formatDate(tour.date)} />
          <DetailItem label="Costo" value={tour.cost != null ? `$${tour.cost}` : 'N/A'} />
        </div>
      ))}
    </div>
  );
};

const AssistanceDetails = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyState text="No hay asistencias registradas." />;
  }

  return (
    <div className="space-y-3">
      {data.map((assist, index) => (
        <div key={assist.id ?? index} className="p-3 bg-gray-100 rounded-md space-y-2">
          <p className="font-semibold">{assist.plan_type || 'Plan sin nombre'}</p>
          <DetailItem
            label="Vigencia"
            value={`${formatDate(assist.start_date)} -> ${formatDate(assist.end_date)}`}
          />
        </div>
      ))}
    </div>
  );
};

const EditForm = ({ onSave, onCancel, isDirty, children }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    if (isSaving || !isDirty) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      alert(error.message);
      return;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
      {children}
      <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-gray-500 sm:mr-auto">
          {isDirty ? 'Cambios sin guardar.' : 'Sin cambios detectados.'}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-300"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!isDirty || isSaving}
            className={`px-4 py-2 rounded-md w-32 text-sm font-semibold text-white ${
              !isDirty || isSaving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving ? <Loader className="mx-auto animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FlightEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
  const [flights, setFlights] = useState(() => cloneCollection(initialData));
  const snapshotRef = useRef(JSON.stringify(cloneCollection(initialData)));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const cloned = cloneCollection(initialData);
    snapshotRef.current = JSON.stringify(cloned);
    setFlights(cloned);
    setIsDirty(false);
  }, [initialData]);

  const getFlights = () => (Array.isArray(flights) ? flights : []);

  const updateFlights = (nextFlights) => {
    const normalized = cloneCollection(nextFlights);
    setFlights(normalized);
    setIsDirty(JSON.stringify(normalized) !== snapshotRef.current);
  };

  const ensureItineraries = (flight) =>
    Array.isArray(flight.reservation_flight_itineraries)
      ? flight.reservation_flight_itineraries
      : [];

  const handleFlightChange = (index, field, value) => {
    const current = getFlights();
    const updated = current.map((flight, idx) =>
      idx === index ? { ...flight, [field]: value } : flight
    );
    updateFlights(updated);
  };

  const handleItineraryChange = (flightIndex, itinIndex, field, value) => {
    const current = getFlights();
    const updated = current.map((flight, idx) => {
      if (idx !== flightIndex) {
        return flight;
      }
      const itineraries = ensureItineraries(flight).map((itin, iIdx) =>
        iIdx === itinIndex ? { ...itin, [field]: value } : itin
      );
      return { ...flight, reservation_flight_itineraries: itineraries };
    });
    updateFlights(updated);
  };

  const addFlight = () => {
    const current = getFlights();
    updateFlights([
      ...current,
      { airline: '', pnr: '', reservation_flight_itineraries: [] },
    ]);
  };

  const removeFlight = (index) => {
    updateFlights(getFlights().filter((_, idx) => idx !== index));
  };

  const addItinerary = (flightIndex) => {
    const current = getFlights();
    const updated = current.map((flight, idx) => {
      if (idx !== flightIndex) {
        return flight;
      }
      const itineraries = [
        ...ensureItineraries(flight),
        { flight_number: '', departure_time: '', arrival_time: '' },
      ];
      return { ...flight, reservation_flight_itineraries: itineraries };
    });
    updateFlights(updated);
  };

  const removeItinerary = (flightIndex, itinIndex) => {
    const current = getFlights();
    const updated = current.map((flight, idx) => {
      if (idx !== flightIndex) {
        return flight;
      }
      const itineraries = ensureItineraries(flight).filter(
        (_, iIdx) => iIdx !== itinIndex
      );
      return { ...flight, reservation_flight_itineraries: itineraries };
    });
    updateFlights(updated);
  };

  const handleSave = async () => {
    if (!reservationId) {
      throw new Error('No se encontro la reserva.');
    }
    await onSave(
      `http://localhost:4000/api/reservations/${reservationId}/flights/upsert`,
      getFlights()
    );
    snapshotRef.current = JSON.stringify(getFlights());
    setIsDirty(false);
  };

  const safeFlights = getFlights();

  return (
    <EditForm onSave={handleSave} onCancel={onCancel} isDirty={isDirty}>
      {safeFlights.map((flight, fIndex) => {
        const itineraries = ensureItineraries(flight);
        return (
          <div
            key={flight.id ?? fIndex}
            className="p-3 border rounded-md bg-white space-y-3"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                value={flight.airline || ''}
                onChange={(event) =>
                  handleFlightChange(fIndex, 'airline', event.target.value)
                }
                placeholder="Aerolinea"
                className="p-2 border rounded"
              />
              <input
                value={flight.pnr || ''}
                onChange={(event) =>
                  handleFlightChange(fIndex, 'pnr', event.target.value)
                }
                placeholder="PNR"
                className="p-2 border rounded"
              />
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-sm">Itinerarios</h5>
              {itineraries.map((itin, iIndex) => (
                <div
                  key={itin.id ?? iIndex}
                  className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-center"
                >
                  <input
                    value={itin.flight_number || ''}
                    onChange={(event) =>
                      handleItineraryChange(
                        fIndex,
                        iIndex,
                        'flight_number',
                        event.target.value
                      )
                    }
                    placeholder="Numero de vuelo"
                    className="p-1 border rounded text-sm md:col-span-1"
                  />
                  <input
                    type="datetime-local"
                    value={itin.departure_time?.slice(0, 16) || ''}
                    onChange={(event) =>
                      handleItineraryChange(
                        fIndex,
                        iIndex,
                        'departure_time',
                        event.target.value
                      )
                    }
                    className="p-1 border rounded text-sm"
                  />
                  <input
                    type="datetime-local"
                    value={itin.arrival_time?.slice(0, 16) || ''}
                    onChange={(event) =>
                      handleItineraryChange(
                        fIndex,
                        iIndex,
                        'arrival_time',
                        event.target.value
                      )
                    }
                    className="p-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeItinerary(fIndex, iIndex)}
                    className="justify-self-end rounded-full p-1 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItinerary(fIndex)}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Anadir itinerario
              </button>
            </div>

            <div className="border-t pt-2 text-right">
              <button
                type="button"
                onClick={() => removeFlight(fIndex)}
                className="text-xs text-red-600 flex items-center gap-1 justify-end"
              >
                <Trash2 size={14} />
                Eliminar vuelo
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addFlight}
        className="text-sm text-blue-600 font-semibold flex items-center gap-1"
      >
        <Plus size={16} /> Anadir vuelo
      </button>
    </EditForm>
  );
};

const HotelEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
  const [hotels, setHotels] = useState(() => cloneCollection(initialData));
  const snapshotRef = useRef(JSON.stringify(cloneCollection(initialData)));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const cloned = cloneCollection(initialData);
    snapshotRef.current = JSON.stringify(cloned);
    setHotels(cloned);
    setIsDirty(false);
  }, [initialData]);

  const getHotels = () => (Array.isArray(hotels) ? hotels : []);

  const updateHotels = (nextHotels) => {
    const normalized = cloneCollection(nextHotels);
    setHotels(normalized);
    setIsDirty(JSON.stringify(normalized) !== snapshotRef.current);
  };

  const handleHotelChange = (index, field, value) => {
    const current = getHotels();
    const updated = current.map((hotel, idx) =>
      idx === index ? { ...hotel, [field]: value } : hotel
    );
    updateHotels(updated);
  };

  const addHotel = () => {
    const current = getHotels();
    updateHotels([
      ...current,
      {
        name: '',
        room_category: '',
        meal_plan: '',
        reservation_hotel_accommodations: [],
        reservation_hotel_inclusions: [],
      },
    ]);
  };

  const removeHotel = (index) => {
    updateHotels(getHotels().filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!reservationId) {
      throw new Error('No se encontro la reserva.');
    }
    await onSave(
      `http://localhost:4000/api/reservations/${reservationId}/hotels/upsert`,
      getHotels()
    );
    snapshotRef.current = JSON.stringify(getHotels());
    setIsDirty(false);
  };

  const safeHotels = getHotels();

  return (
    <EditForm onSave={handleSave} onCancel={onCancel} isDirty={isDirty}>
      {safeHotels.map((hotel, hIndex) => (
        <div
          key={hotel.id ?? hIndex}
          className="p-3 border rounded-md bg-white space-y-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={hotel.name || ''}
              onChange={(event) =>
                handleHotelChange(hIndex, 'name', event.target.value)
              }
              placeholder="Nombre del hotel"
              className="p-2 border rounded"
            />
            <input
              value={hotel.room_category || ''}
              onChange={(event) =>
                handleHotelChange(hIndex, 'room_category', event.target.value)
              }
              placeholder="Categoria de habitacion"
              className="p-2 border rounded"
            />
            <input
              value={hotel.meal_plan || ''}
              onChange={(event) =>
                handleHotelChange(hIndex, 'meal_plan', event.target.value)
              }
              placeholder="Plan de comidas"
              className="p-2 border rounded"
            />
          </div>
          <div className="border-t pt-2 text-right">
            <button
              type="button"
              onClick={() => removeHotel(hIndex)}
              className="text-xs text-red-600 flex items-center gap-1 justify-end"
            >
              <Trash2 size={14} />
              Eliminar hotel
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addHotel}
        className="text-sm text-blue-600 font-semibold flex items-center gap-1"
      >
        <Plus size={16} /> Anadir hotel
      </button>
    </EditForm>
  );
};

const TourEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
  const [tours, setTours] = useState(() => cloneCollection(initialData));
  const snapshotRef = useRef(JSON.stringify(cloneCollection(initialData)));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const cloned = cloneCollection(initialData);
    snapshotRef.current = JSON.stringify(cloned);
    setTours(cloned);
    setIsDirty(false);
  }, [initialData]);

  const getTours = () => (Array.isArray(tours) ? tours : []);

  const updateTours = (nextTours) => {
    const normalized = cloneCollection(nextTours);
    setTours(normalized);
    setIsDirty(JSON.stringify(normalized) !== snapshotRef.current);
  };

  const handleTourChange = (index, field, value) => {
    const current = getTours();
    const updated = current.map((tour, idx) =>
      idx === index ? { ...tour, [field]: value } : tour
    );
    updateTours(updated);
  };

  const addTour = () => {
    const current = getTours();
    updateTours([...current, { name: '', date: '', cost: '' }]);
  };

  const removeTour = (index) => {
    updateTours(getTours().filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!reservationId) {
      throw new Error('No se encontro la reserva.');
    }
    await onSave(
      `http://localhost:4000/api/reservations/${reservationId}/tours/upsert`,
      getTours()
    );
    snapshotRef.current = JSON.stringify(getTours());
    setIsDirty(false);
  };

  const safeTours = getTours();

  return (
    <EditForm onSave={handleSave} onCancel={onCancel} isDirty={isDirty}>
      {safeTours.map((tour, tIndex) => (
        <div
          key={tour.id ?? tIndex}
          className="p-3 border rounded-md bg-white space-y-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-center">
            <input
              value={tour.name || ''}
              onChange={(event) =>
                handleTourChange(tIndex, 'name', event.target.value)
              }
              placeholder="Nombre del tour"
              className="p-2 border rounded md:col-span-2"
            />
            <input
              type="date"
              value={tour.date?.slice(0, 10) || ''}
              onChange={(event) =>
                handleTourChange(tIndex, 'date', event.target.value)
              }
              className="p-2 border rounded"
            />
            <input
              type="number"
              value={tour.cost ?? ''}
              onChange={(event) =>
                handleTourChange(tIndex, 'cost', event.target.value)
              }
              placeholder="Costo"
              className="p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => removeTour(tIndex)}
              className="justify-self-end rounded-full p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addTour}
        className="text-sm text-blue-600 font-semibold flex items-center gap-1"
      >
        <Plus size={16} /> Anadir tour
      </button>
    </EditForm>
  );
};

const AssistanceEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
  const [assistances, setAssistances] = useState(() => cloneCollection(initialData));
  const snapshotRef = useRef(JSON.stringify(cloneCollection(initialData)));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const cloned = cloneCollection(initialData);
    snapshotRef.current = JSON.stringify(cloned);
    setAssistances(cloned);
    setIsDirty(false);
  }, [initialData]);

  const getAssistances = () => (Array.isArray(assistances) ? assistances : []);

  const updateAssistances = (nextAssistances) => {
    const normalized = cloneCollection(nextAssistances);
    setAssistances(normalized);
    setIsDirty(JSON.stringify(normalized) !== snapshotRef.current);
  };

  const handleAssistanceChange = (index, field, value) => {
    const current = getAssistances();
    const updated = current.map((assist, idx) =>
      idx === index ? { ...assist, [field]: value } : assist
    );
    updateAssistances(updated);
  };

  const addAssistance = () => {
    const current = getAssistances();
    updateAssistances([...current, { plan_type: '', start_date: '', end_date: '' }]);
  };

  const removeAssistance = (index) => {
    updateAssistances(getAssistances().filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!reservationId) {
      throw new Error('No se encontro la reserva.');
    }
    await onSave(
      `http://localhost:4000/api/reservations/${reservationId}/assistances/upsert`,
      getAssistances()
    );
    snapshotRef.current = JSON.stringify(getAssistances());
    setIsDirty(false);
  };

  const safeAssistances = getAssistances();

  return (
    <EditForm onSave={handleSave} onCancel={onCancel} isDirty={isDirty}>
      {safeAssistances.map((assist, aIndex) => (
        <div
          key={assist.id ?? aIndex}
          className="p-3 border rounded-md bg-white space-y-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:items-center">
            <input
              value={assist.plan_type || ''}
              onChange={(event) =>
                handleAssistanceChange(aIndex, 'plan_type', event.target.value)
              }
              placeholder="Tipo de plan"
              className="p-2 border rounded md:col-span-2"
            />
            <input
              type="date"
              value={assist.start_date?.slice(0, 10) || ''}
              onChange={(event) =>
                handleAssistanceChange(aIndex, 'start_date', event.target.value)
              }
              className="p-2 border rounded"
            />
            <input
              type="date"
              value={assist.end_date?.slice(0, 10) || ''}
              onChange={(event) =>
                handleAssistanceChange(aIndex, 'end_date', event.target.value)
              }
              className="p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => removeAssistance(aIndex)}
              className="justify-self-end rounded-full p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addAssistance}
        className="text-sm text-blue-600 font-semibold flex items-center gap-1"
      >
        <Plus size={16} /> Anadir asistencia
      </button>
    </EditForm>
  );
};

const ServiceManagementTab = ({ reservation, onUpdate }) => {
  const [loadingService, setLoadingService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const res = reservation?._original;
  const reservationType = res?.reservation_type || 'other';

  const services = useMemo(() => {
    if (!res) {
      return [];
    }
    return [
      {
        key: 'flight_status_ok',
        label: 'Vuelos',
        data: res.reservation_flights,
        icon: Plane,
        DetailsComponent: FlightDetails,
        EditComponent: FlightEditForm,
      },
      {
        key: 'hotel_status_ok',
        label: 'Hoteles',
        data: res.reservation_hotels,
        icon: Building,
        DetailsComponent: HotelDetails,
        EditComponent: HotelEditForm,
      },
      {
        key: 'tours_status_ok',
        label: 'Tours',
        data: res.reservation_tours,
        icon: Map,
        DetailsComponent: TourDetails,
        EditComponent: TourEditForm,
      },
      {
        key: 'assistance_status_ok',
        label: 'Asistencia',
        data: res.reservation_medical_assistances,
        icon: HeartPulse,
        DetailsComponent: AssistanceDetails,
        EditComponent: AssistanceEditForm,
      },
    ];
  }, [res]);

  const fallbackKeys = useMemo(
    () =>
      services
        .filter(({ data }) => Array.isArray(data) && data.length > 0)
        .map(({ key }) => key),
    [services]
  );

  const allowedServiceKeys = useMemo(() => {
    const mapped = SERVICE_KEYS_BY_TYPE[reservationType];
    if (mapped && mapped.length > 0) {
      return mapped;
    }
    if (fallbackKeys.length > 0) {
      return fallbackKeys;
    }
    return services.map(({ key }) => key);
  }, [reservationType, fallbackKeys, services]);

  const visibleServices = services.filter(({ key }) =>
    allowedServiceKeys.includes(key)
  );

  const handleToggleStatus = async (serviceKey, currentStatus) => {
    if (!res?.id) {
      alert('No se encontro la reserva.');
      return;
    }
    setLoadingService(serviceKey);
    try {
      await api.put(
        `/api/reservations/${res.id}/service-status`,
        { service: serviceKey, status: !currentStatus }
      );

      onUpdate?.();
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo actualizar el estado del servicio.');
    } finally {
      setLoadingService(null);
    }
  };

  const handleSaveService = async (url, data) => {
    try {
      await api.post(url, data);

      setEditingService(null);
      onUpdate?.();
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo actualizar la informacion del servicio.');
    }
  };

  if (!res) {
    return <EmptyState text="No se encontro informacion de la reserva." />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">
        Gestion de Servicios de la Reserva
      </h3>

      {visibleServices.length === 0 ? (
        <EmptyState text="No hay servicios asociados a esta reserva." />
      ) : (
        visibleServices.map(
          ({
            key,
            label,
            data,
            icon: Icon,
            DetailsComponent,
            EditComponent,
          }) => {
            const isConfirmed = Boolean(res[key]);
            const isEditing = editingService === key;
            const safeData = Array.isArray(data) ? data : [];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <Icon
                      className={`w-6 h-6 ${
                        isConfirmed ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                    <div>
                      <p className="font-bold text-lg text-gray-800">{label}</p>
                      <span
                        className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          isConfirmed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isConfirmed ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {EditComponent && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingService(isEditing ? null : key)
                        }
                        className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                          isEditing
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Edit size={16} />
                        {isEditing ? 'Cancelar' : 'Editar'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(key, isConfirmed)}
                      disabled={loadingService === key}
                      className="w-36 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loadingService === key ? (
                        <Loader className="w-5 h-5 mx-auto animate-spin" />
                      ) : isConfirmed ? (
                        'Marcar pendiente'
                      ) : (
                        'Confirmar'
                      )}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-gray-50">
                  {isEditing ? (
                    <EditComponent
                      initialData={safeData}
                      reservationId={res.id}
                      onSave={handleSaveService}
                      onCancel={() => setEditingService(null)}
                    />
                  ) : (
                    <div className="p-4">
                      <DetailsComponent data={safeData} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }
        )
      )}
    </div>
  );
};

export default ServiceManagementTab;
