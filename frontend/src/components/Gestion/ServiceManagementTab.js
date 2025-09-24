import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, Plane, Building, Map, HeartPulse, ChevronDown, ChevronUp, Edit, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Reusable Detail and Edit Components ---

const DetailItem = ({ label, value }) => (
  <p className="text-sm text-gray-600 pl-2">- {label}: <span className="font-medium">{value}</span></p>
);

const FlightDetails = ({ data }) => (
  <div className="space-y-3">
    {data.map(flight => (
      <div key={flight.id} className="p-3 bg-gray-100 rounded-md">
        <p className="font-semibold">{flight.airline} - PNR: {flight.pnr || 'N/A'}</p>
        {flight.reservation_flight_itineraries.map(itin => (
          <DetailItem key={itin.id} label={`Vuelo ${itin.flight_number}`} value={`${new Date(itin.departure_time).toLocaleString()} -> ${new Date(itin.arrival_time).toLocaleString()}`} />
        ))}
      </div>
    ))}
  </div>
);

const HotelDetails = ({ data }) => (
    <div className="space-y-3">
        {data.map(hotel => (
            <div key={hotel.id} className="p-3 bg-gray-100 rounded-md">
                <p className="font-semibold">{hotel.name}</p>
                <DetailItem label="Categoría" value={hotel.room_category} />
                <DetailItem label="Plan de Comidas" value={hotel.meal_plan} />
            </div>
        ))}
    </div>
);

const TourDetails = ({ data }) => (
    <div className="space-y-3">
        {data.map(tour => (
            <div key={tour.id} className="p-3 bg-gray-100 rounded-md">
                <p className="font-semibold">{tour.name}</p>
                <DetailItem label="Fecha" value={new Date(tour.date).toLocaleDateString()} />
                <DetailItem label="Costo" value={`$${tour.cost}`} />
            </div>
        ))}
    </div>
);

const AssistanceDetails = ({ data }) => (
    <div className="space-y-3">
        {data.map(assist => (
            <div key={assist.id} className="p-3 bg-gray-100 rounded-md">
                <p className="font-semibold">{assist.plan_type}</p>
                <DetailItem label="Vigencia" value={`${new Date(assist.start_date).toLocaleDateString()} - ${new Date(assist.end_date).toLocaleDateString()}`} />
            </div>
        ))}
    </div>
);

const EditForm = ({ onSave, onCancel, children }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave();
        } catch (error) {
            alert(error.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
            {children}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-md w-28">
                    {isSaving ? <Loader className="animate-spin mx-auto"/> : 'Guardar'}
                </button>
            </div>
        </div>
    );
};

const FlightEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
    const [flights, setFlights] = useState(JSON.parse(JSON.stringify(initialData)));

    const handleFlightChange = (index, field, value) => {
        const newFlights = [...flights];
        newFlights[index][field] = value;
        setFlights(newFlights);
    };

    const handleItineraryChange = (flightIndex, itinIndex, field, value) => {
        const newFlights = [...flights];
        newFlights[flightIndex].reservation_flight_itineraries[itinIndex][field] = value;
        setFlights(newFlights);
    };

    const addFlight = () => setFlights([...flights, { airline: '', pnr: '', reservation_flight_itineraries: [] }]);
    const removeFlight = (index) => setFlights(flights.filter((_, i) => i !== index));

    const addItinerary = (flightIndex) => {
        const newFlights = [...flights];
        newFlights[flightIndex].reservation_flight_itineraries.push({ flight_number: '', departure_time: '', arrival_time: '' });
        setFlights(newFlights);
    };

    const removeItinerary = (flightIndex, itinIndex) => {
        const newFlights = [...flights];
        newFlights[flightIndex].reservation_flight_itineraries.splice(itinIndex, 1);
        setFlights(newFlights);
    };

    const handleSave = () => onSave(`http://localhost:4000/api/reservations/${reservationId}/flights/upsert`, flights);

    return (
        <EditForm onSave={handleSave} onCancel={onCancel}>
            {flights.map((flight, fIndex) => (
                <div key={flight.id || fIndex} className="p-3 border rounded-md bg-white space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input value={flight.airline} onChange={e => handleFlightChange(fIndex, 'airline', e.target.value)} placeholder="Aerolínea" className="p-2 border rounded"/>
                        <input value={flight.pnr} onChange={e => handleFlightChange(fIndex, 'pnr', e.target.value)} placeholder="PNR" className="p-2 border rounded"/>
                    </div>
                    <h5 className="font-semibold text-sm pt-2">Itinerarios:</h5>
                    {flight.reservation_flight_itineraries.map((itin, iIndex) => (
                        <div key={itin.id || iIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                            <input value={itin.flight_number} onChange={e => handleItineraryChange(fIndex, iIndex, 'flight_number', e.target.value)} placeholder="N° Vuelo" className="p-1 border rounded text-sm"/>
                            <input type="datetime-local" value={itin.departure_time?.substring(0, 16)} onChange={e => handleItineraryChange(fIndex, iIndex, 'departure_time', e.target.value)} className="p-1 border rounded text-sm"/>
                            <input type="datetime-local" value={itin.arrival_time?.substring(0, 16)} onChange={e => handleItineraryChange(fIndex, iIndex, 'arrival_time', e.target.value)} className="p-1 border rounded text-sm"/>
                            <button onClick={() => removeItinerary(fIndex, iIndex)} className="text-red-500 justify-self-end"><Trash2 size={16}/></button>
                        </div>
                    ))}
                     <button onClick={() => addItinerary(fIndex)} className="text-xs text-blue-600 mt-2 flex items-center gap-1"><Plus size={14}/> Añadir Itinerario</button>
                    <div className="border-t pt-2 text-right">
                        <button onClick={() => removeFlight(fIndex)} className="text-xs text-red-600"><Trash2 size={14} className="inline"/> Eliminar Vuelo</button>
                    </div>
                </div>
            ))}
            <button onClick={addFlight} className="text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={16}/> Añadir Vuelo</button>
        </EditForm>
    );
};

const HotelEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
    const [hotels, setHotels] = useState(JSON.parse(JSON.stringify(initialData)));

    const handleHotelChange = (index, field, value) => {
        const newHotels = [...hotels];
        newHotels[index][field] = value;
        setHotels(newHotels);
    };

    const addHotel = () => setHotels([...hotels, { name: '', room_category: '', meal_plan: '', reservation_hotel_accommodations: [], reservation_hotel_inclusions: [] }]);
    const removeHotel = (index) => setHotels(hotels.filter((_, i) => i !== index));

    const handleSave = () => onSave(`http://localhost:4000/api/reservations/${reservationId}/hotels/upsert`, hotels);

    return (
        <EditForm onSave={handleSave} onCancel={onCancel}>
            {hotels.map((hotel, hIndex) => (
                <div key={hotel.id || hIndex} className="p-3 border rounded-md bg-white space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input value={hotel.name} onChange={e => handleHotelChange(hIndex, 'name', e.target.value)} placeholder="Nombre del Hotel" className="p-2 border rounded"/>
                        <input value={hotel.room_category} onChange={e => handleHotelChange(hIndex, 'room_category', e.target.value)} placeholder="Categoría de Habitación" className="p-2 border rounded"/>
                        <input value={hotel.meal_plan} onChange={e => handleHotelChange(hIndex, 'meal_plan', e.target.value)} placeholder="Plan de Comidas" className="p-2 border rounded"/>
                    </div>
                    <div className="border-t pt-2 text-right">
                         <button onClick={() => removeHotel(hIndex)} className="text-xs text-red-600"><Trash2 size={14} className="inline"/> Eliminar Hotel</button>
                    </div>
                </div>
            ))}
            <button onClick={addHotel} className="text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={16}/> Añadir Hotel</button>
        </EditForm>
    );
};

const TourEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
    const [tours, setTours] = useState(JSON.parse(JSON.stringify(initialData)));

    const handleTourChange = (index, field, value) => {
        const newTours = [...tours];
        newTours[index][field] = value;
        setTours(newTours);
    };

    const addTour = () => setTours([...tours, { name: '', date: '', cost: 0 }]);
    const removeTour = (index) => setTours(tours.filter((_, i) => i !== index));

    const handleSave = () => onSave(`http://localhost:4000/api/reservations/${reservationId}/tours/upsert`, tours);

    return (
        <EditForm onSave={handleSave} onCancel={onCancel}>
            {tours.map((tour, tIndex) => (
                <div key={tour.id || tIndex} className="p-3 border rounded-md bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <input value={tour.name} onChange={e => handleTourChange(tIndex, 'name', e.target.value)} placeholder="Nombre del Tour" className="p-2 border rounded col-span-2"/>
                        <input type="date" value={tour.date?.substring(0, 10)} onChange={e => handleTourChange(tIndex, 'date', e.target.value)} className="p-2 border rounded"/>
                        <input type="number" value={tour.cost} onChange={e => handleTourChange(tIndex, 'cost', e.target.value)} placeholder="Costo" className="p-2 border rounded"/>
                        <button onClick={() => removeTour(tIndex)} className="text-red-500 justify-self-end"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
            <button onClick={addTour} className="text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={16}/> Añadir Tour</button>
        </EditForm>
    );
};

const AssistanceEditForm = ({ initialData, onSave, onCancel, reservationId }) => {
    const [assistances, setAssistances] = useState(JSON.parse(JSON.stringify(initialData)));

    const handleAssistanceChange = (index, field, value) => {
        const newAssistances = [...assistances];
        newAssistances[index][field] = value;
        setAssistances(newAssistances);
    };

    const addAssistance = () => setAssistances([...assistances, { plan_type: '', start_date: '', end_date: '' }]);
    const removeAssistance = (index) => setAssistances(assistances.filter((_, i) => i !== index));

    const handleSave = () => onSave(`http://localhost:4000/api/reservations/${reservationId}/assistances/upsert`, assistances);

    return (
        <EditForm onSave={handleSave} onCancel={onCancel}>
            {assistances.map((assist, aIndex) => (
                <div key={assist.id || aIndex} className="p-3 border rounded-md bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <input value={assist.plan_type} onChange={e => handleAssistanceChange(aIndex, 'plan_type', e.target.value)} placeholder="Tipo de Plan" className="p-2 border rounded col-span-2"/>
                        <input type="date" value={assist.start_date?.substring(0, 10)} onChange={e => handleAssistanceChange(aIndex, 'start_date', e.target.value)} className="p-2 border rounded"/>
                        <input type="date" value={assist.end_date?.substring(0, 10)} onChange={e => handleAssistanceChange(aIndex, 'end_date', e.target.value)} className="p-2 border rounded"/>
                        <button onClick={() => removeAssistance(aIndex)} className="text-red-500 justify-self-end"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
            <button onClick={addAssistance} className="text-sm text-blue-600 font-semibold flex items-center gap-1"><Plus size={16}/> Añadir Asistencia</button>
        </EditForm>
    );
};


// --- Main Component ---
const ServiceManagementTab = ({ reservation, onUpdate }) => {
  const [loadingService, setLoadingService] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const res = reservation._original;

  const handleToggleStatus = async (serviceKey, currentStatus) => {
    setLoadingService(serviceKey);
    try {
      await fetch(`http://localhost:4000/api/reservations/${res.id}/service-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceKey, status: !currentStatus }),
      });
      onUpdate();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingService(null);
    }
  };

  const handleSaveService = async (url, data) => {
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    setEditingService(null);
    onUpdate();
  };

  const services = [
    { key: 'flight_status_ok', label: 'Vuelos', data: res.reservation_flights, icon: Plane, DetailsComponent: FlightDetails, EditComponent: FlightEditForm },
    { key: 'hotel_status_ok', label: 'Hoteles', data: res.reservation_hotels, icon: Building, DetailsComponent: HotelDetails, EditComponent: HotelEditForm },
    { key: 'tours_status_ok', label: 'Tours', data: res.reservation_tours, icon: Map, DetailsComponent: TourDetails, EditComponent: TourEditForm },
    { key: 'assistance_status_ok', label: 'Asistencia', data: res.reservation_medical_assistances, icon: HeartPulse, DetailsComponent: AssistanceDetails, EditComponent: AssistanceEditForm },
  ];

  const toggleExpand = (key) => setExpandedService(expandedService === key ? null : key);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Gestión de Servicios de la Reserva</h3>
      {services.map(({ key, label, data, icon: Icon, DetailsComponent, EditComponent }) => {
        if (!data) return null;

        const isConfirmed = res[key];
        const isExpanded = expandedService === key;
        const isEditing = editingService === key;

        return (
          <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Icon className={`w-6 h-6 ${isConfirmed ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-bold text-lg text-gray-800">{label}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isConfirmed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isConfirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {EditComponent && <button onClick={() => setEditingService(key)} className="p-2 rounded-full hover:bg-gray-100"><Edit size={16}/></button>}
                    <button onClick={() => handleToggleStatus(key, isConfirmed)} disabled={loadingService === key} className="w-32 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                        {loadingService === key ? <Loader className="w-5 h-5 mx-auto animate-spin" /> : (isConfirmed ? 'Marcar Pendiente' : 'Confirmar')}
                    </button>
                    <button onClick={() => toggleExpand(key)} className="p-2 rounded-full hover:bg-gray-100">
                        {isExpanded ? <ChevronUp/> : <ChevronDown/>}
                    </button>
                </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 border-t border-gray-200">
                    {isEditing ? (
                        <EditComponent 
                            initialData={data} 
                            reservationId={res.id}
                            onSave={handleSaveService}
                            onCancel={() => setEditingService(null)}
                        />
                    ) : (
                        <DetailsComponent data={data} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default ServiceManagementTab;
