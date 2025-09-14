import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Euro,
  FileText, 
  Home, 
  HeartHandshake,
  PlaneTakeoff, 
  PlaneLanding,
  PlusCircle, 
  MinusCircle,
  Globe,
  Hotel, 
  Bed, 
  Utensils, 
  PlusSquare,
  Info,
  Plane,
  Calculator,
  BriefcaseMedical, 
  Car,
  Bus, 
  Train, 
  Ship,
  Minimize2,
  Maximize2,
  Ticket,
  List,
  Clock, 
  Hash 
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return getTodayDate();
  return date.split('T')[0];
};

const formatTime = (time) => {
  if (!time) return '';
  const part = time.includes('T') ? time.split('T')[1] : time;
  return part.slice(0, 5);
};

// Reusable Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultMinimized = false }) => {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);

  return (
    <motion.div 
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" /> {title}
        </h3>
        <motion.button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
        </motion.button>
      </div>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


const ReservationForm = ({ reservation = null, reservationType = 'all_inclusive', onSave, onClose }) => {
  const { settings, formatCurrency } = useSettings();

  const showFlights = reservationType === 'all_inclusive' || reservationType === 'flights_only';
  const showHotels = reservationType === 'all_inclusive' || reservationType === 'hotel_only';
  const showTours = reservationType === 'all_inclusive' || reservationType === 'tours_only';
  const showMedical = reservationType === 'all_inclusive' || reservationType === 'medical_assistance';

  // Map API data (snake_case) to form-friendly camelCase structure
  const mapSegments = (segments) =>
    (segments || []).map((s) => ({
      origin: s.origin || '',
      destination: s.destination || '',
      departureDate: formatDate(s.departureDate || s.departure_date),
      returnDate: formatDate(s.returnDate || s.return_date),
    }));

  const mapFlights = (flights) =>
    (flights || []).map((f) => ({
      airline: f.airline || '',
      flightCategory: f.flightCategory || f.flight_category || '',
      baggageAllowance: f.baggageAllowance || f.baggage_allowance || '',
      flightCycle: f.flightCycle || f.flight_cycle || 'round_trip',
      hasItinerary:
        f.hasItinerary || (f.reservation_flight_itineraries && f.reservation_flight_itineraries.length > 0),
      itineraries:
        (f.reservation_flight_itineraries || f.itineraries || []).map((i) => ({
          flightNumber: i.flightNumber || i.flight_number || '',
          departureTime: formatTime(i.departureTime || i.departure_time),
          arrivalTime: formatTime(i.arrivalTime || i.arrival_time),
        })),
      trackingCode: f.trackingCode || f.tracking_code || f.pnr || '',
    }));

  const mapHotels = (hotels) =>
    (hotels || []).map((h) => ({
      name: h.name || '',
      roomCategory: h.roomCategory || h.room_category || '',
      accommodation:
        h.accommodation ||
        h.reservation_hotel_accommodations || [{ rooms: 1, adt: 0, chd: 0, inf: 0 }],
      mealPlan: h.mealPlan || h.meal_plan || '',
      hotelInclusions:
        h.hotelInclusions ||
        (h.reservation_hotel_inclusions
          ? h.reservation_hotel_inclusions.map((i) => i.inclusion)
          : ['']),
    }));

  const mapTours = (tours) =>
    (tours || []).map((t) => ({
      name: t.name || '',
      date: formatDate(t.date),
      cost: t.cost || 0,
    }));

  const mapMedical = (medical) =>
    (medical || []).map((m) => ({
      planType: m.planType || m.plan_type || 'traditional_tourism',
      startDate: formatDate(m.startDate || m.start_date),
      endDate: formatDate(m.endDate || m.end_date),
    }));

  const mapInstallments = (installments) =>
    (installments || []).map((i) => ({
      amount: i.amount || 0,
      dueDate: formatDate(i.dueDate || i.due_date),
    }));

  const initialSegments = reservation
    ? mapSegments(reservation.reservation_segments)
    : [{ origin: '', destination: '', departureDate: getTodayDate(), returnDate: getTodayDate() }];
  const initialTripDepartureDate = initialSegments[0]?.departureDate || getTodayDate();
  const initialTripReturnDate =
    initialSegments[initialSegments.length - 1]?.returnDate || initialTripDepartureDate;

  const initialFormState = {
    clientName: reservation?.clients?.name || '',
    clientEmail: reservation?.clients?.email || '',
    clientPhone: reservation?.clients?.phone || '',
    clientId: reservation?.clients?.id_card || '',
    clientAddress: reservation?.clients?.address || '',
    emergencyContact: {
        name: reservation?.clients?.emergency_contact_name || '',
        phone: reservation?.clients?.emergency_contact_phone || ''
    },
    tripType: reservation?.tripType || 'round_trip',
    segments: reservation ? mapSegments(reservation.reservation_segments) : [{ origin: '', destination: '', departureDate: getTodayDate(), returnDate: getTodayDate() }],
    passengersADT: reservation?.passengers_adt || 1,
    passengersCHD: reservation?.passengers_chd || 0,
    passengersINF: reservation?.passengers_inf || 0,
    pricePerADT: reservation?.price_per_adt || 0,
    pricePerCHD: reservation?.price_per_chd || 0,
    pricePerINF: reservation?.price_per_inf || 0,
    totalAmount: reservation?.total_amount || 0,
    paymentOption: reservation?.payment_option || 'full_payment',
    installments: reservation ? mapInstallments(reservation.reservation_installments) : [{ amount: 0, dueDate: getTodayDate() }],
    installmentsCount: reservation?.reservation_installments?.length || 1,
    status: reservation?.status || 'pending',
    notes: reservation?.notes || '',

    // Structured data for sections
    flights: reservation
      ? mapFlights(reservation.reservation_flights)
      : showFlights
      ? [
          {
            airline: '',
            flightCategory: '',
            baggageAllowance: '',
            flightCycle: 'round_trip',
            hasItinerary: false,
            itineraries: [{ flightNumber: '', departureTime: '', arrivalTime: '' }],
            trackingCode: '',
          },
        ]
      : [],
    hotels: reservation
      ? mapHotels(reservation.reservation_hotels)
      : showHotels
      ? [
          {
            name: '',
            roomCategory: '',
            accommodation: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }],
            mealPlan: '',
            hotelInclusions: [''],
          },
        ]
      : [],
    tours: reservation
      ? mapTours(reservation.reservation_tours)
      : showTours
      ? [{ name: '', date: initialTripDepartureDate, cost: 0 }]
      : [],
    medicalAssistances: reservation
      ? mapMedical(reservation.reservation_medical_assistances)
      : showMedical
      ? [
          {
            planType: 'traditional_tourism',
            startDate: initialTripDepartureDate,
            endDate: initialTripReturnDate,
          },
        ]
      : [],
  };

  const [formData, setFormData] = useState(initialFormState);
  const initialFormDataRef = useRef(JSON.parse(JSON.stringify(initialFormState)));

  const [totalPassengersCalculated, setTotalPassengersCalculated] = useState({
    total: 0, adt: 0, chd: 0, inf: 0
  });
  const [errors, setErrors] = useState({});

  const isDateWithinRange = (date, start, end) => {
    if (!date || !start || !end) return false;
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    return d >= s && d <= e;
  };

  // Calculate trip start and end dates
  const tripDepartureDate = formData.segments[0]?.departureDate || '';
  const tripReturnDate =
    formData.tripType === 'one_way'
      ? formData.segments[0]?.departureDate || ''
      : formData.segments[formData.segments.length - 1]?.returnDate || '';
  useEffect(() => {
    setFormData(prev => {
      const updatedMA = prev.medicalAssistances.map(ma => ({
        ...ma,
        startDate: tripDepartureDate,
        endDate: tripReturnDate,
      }));
      const maSame = updatedMA.every((ma, idx) =>
        ma.startDate === prev.medicalAssistances[idx].startDate &&
        ma.endDate === prev.medicalAssistances[idx].endDate
      );
      const updatedTours = prev.tours.map(t =>
        isDateWithinRange(t.date, tripDepartureDate, tripReturnDate)
          ? t
          : { ...t, date: tripDepartureDate }
      );
      const toursSame = updatedTours.every((t, idx) =>
        t.date === prev.tours[idx].date &&
        t.name === prev.tours[idx].name &&
        t.cost === prev.tours[idx].cost
      );
      if (maSame && toursSame) return prev;
      return { ...prev, medicalAssistances: updatedMA, tours: updatedTours };
    });
  }, [tripDepartureDate, tripReturnDate]);

  useEffect(() => {
    const totalADT = parseInt(formData.passengersADT) || 0;
    const totalCHD = parseInt(formData.passengersCHD) || 0;
    const totalINF = parseInt(formData.passengersINF) || 0;
    setTotalPassengersCalculated({
      total: totalADT + totalCHD + totalINF,
      adt: totalADT, chd: totalCHD, inf: totalINF
    });
  }, [formData.passengersADT, formData.passengersCHD, formData.passengersINF]);

  useEffect(() => {
    const calculatedTotal =
      (totalPassengersCalculated.adt * (parseFloat(formData.pricePerADT) || 0)) +
      (totalPassengersCalculated.chd * (parseFloat(formData.pricePerCHD) || 0)) +
      (totalPassengersCalculated.inf * (parseFloat(formData.pricePerINF) || 0));
    setFormData(prev => ({ ...prev, totalAmount: calculatedTotal.toFixed(2) }));
  }, [totalPassengersCalculated, formData.pricePerADT, formData.pricePerCHD, formData.pricePerINF]);

  const validateForm = () => {
    const newErrors = {};

    if (!tripDepartureDate) {
      newErrors.departureDate = 'La fecha de salida es obligatoria.';
    }
    if (formData.tripType !== 'one_way') {
      if (!tripReturnDate) {
        newErrors.returnDate = 'La fecha de regreso es obligatoria.';
      } else if (new Date(tripReturnDate) <= new Date(tripDepartureDate)) {
        newErrors.returnDate = 'La fecha de regreso debe ser posterior a la fecha de salida.';
      }
    }

    formData.segments.forEach((seg, idx) => {
      if (!seg.departureDate || (!seg.returnDate && formData.tripType !== 'one_way')) {
        newErrors[`segment-${idx}`] = 'Debe indicar fechas de salida y regreso.';
      } else if (new Date(seg.returnDate) < new Date(seg.departureDate)) {
        newErrors[`segment-${idx}`] = 'La fecha de regreso debe ser posterior a la fecha de salida.';
      }
    });

    const toursOutOfRange = formData.tours.some(t => !isDateWithinRange(t.date, tripDepartureDate, tripReturnDate));
    if (toursOutOfRange) {
      newErrors.tours = 'Los tours deben estar dentro del rango del itinerario.';
    }

    const assistOutOfRange = formData.medicalAssistances.some(ma =>
      !isDateWithinRange(ma.startDate, tripDepartureDate, tripReturnDate) ||
      !isDateWithinRange(ma.endDate, tripDepartureDate, tripReturnDate)
    );
    if (assistOutOfRange) {
      newErrors.medicalAssistances = 'Las asistencias médicas deben coincidir con las fechas del itinerario.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (reservation) {
      const hasChanges =
        JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
      if (!hasChanges) {
        onClose?.();
        return;
      }
    }

    // Deep copy and prepare data for API
    const dataToSend = JSON.parse(JSON.stringify(formData));

    // Combine date and time for flight itineraries into valid ISO 8601 format with UTC timezone
    if (dataToSend.flights) {
      dataToSend.flights.forEach((flight) => {
        if (flight.itineraries) {
          flight.itineraries.forEach(itinerary => {
            const segmentDate = formData.segments[0]?.departureDate; // Simplification
            const returnDate = formData.segments[0]?.returnDate;

            if (segmentDate && itinerary.departureTime) {
              itinerary.departure_time = `${segmentDate}T${itinerary.departureTime}:00Z`;
            }
            if (segmentDate && itinerary.arrivalTime) {
              const arrivalDate = flight.flightCycle === 'one_way' ? segmentDate : returnDate;
              itinerary.arrival_time = `${arrivalDate}T${itinerary.arrivalTime}:00Z`;
            }
          });
        }
      });
    }

    onSave(dataToSend);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: value }
    }));
  };

  const handleSegmentChange = (index, e) => {
    const { name, value } = e.target;
    const newSegments = [...formData.segments];
    newSegments[index] = { ...newSegments[index], [name]: value };

    // Auto-set return date if departure date changes
    if (name === 'departureDate') {
      if (formData.tripType === 'one_way') {
        newSegments[index].returnDate = value;
      } else if (!newSegments[index].returnDate) {
        newSegments[index].returnDate = value;
      }
    }
    setFormData(prev => ({ ...prev, segments: newSegments }));
  };

  const addSegment = () => {
    setFormData(prev => ({
      ...prev,
      segments: [...prev.segments, { origin: '', destination: '', departureDate: getTodayDate(), returnDate: getTodayDate() }]
    }));
  };

  const removeSegment = (index) => {
    const newSegments = [...formData.segments];
    newSegments.splice(index, 1);
    setFormData(prev => ({ ...prev, segments: newSegments }));
  };

  // --- Flight Handlers ---
  const handleFlightChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newFlights = [...formData.flights];
    newFlights[index] = { ...newFlights[index], [name]: type === 'checkbox' ? checked : value };
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  const addFlight = () => {
    setFormData(prev => ({
      ...prev,
      flights: [...prev.flights, { 
        airline: '', 
        flightCategory: '', 
        baggageAllowance: '', 
        flightCycle: 'round_trip', 
        hasItinerary: false, 
        itineraries: [{ flightNumber: '', departureTime: '', arrivalTime: '' }], 
        trackingCode: '' 
      }]
    }));
  };

  const removeFlight = (index) => {
    const newFlights = [...formData.flights];
    newFlights.splice(index, 1);
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  const handleItineraryChange = (flightIndex, itineraryIndex, e) => {
    const { name, value } = e.target;
    const newFlights = [...formData.flights];
    const newItineraries = [...(newFlights[flightIndex].itineraries || [])];
    newItineraries[itineraryIndex] = { ...newItineraries[itineraryIndex], [name]: value };
    newFlights[flightIndex] = { ...newFlights[flightIndex], itineraries: newItineraries };
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  const addItinerary = (flightIndex) => {
    const newFlights = [...formData.flights];
    newFlights[flightIndex].itineraries.push({ flightNumber: '', departureTime: '', arrivalTime: '' });
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  const removeItinerary = (flightIndex, itineraryIndex) => {
    const newFlights = [...formData.flights];
    newFlights[flightIndex].itineraries.splice(itineraryIndex, 1);
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  // --- Hotel Handlers ---
  const handleHotelChange = (index, e) => {
    const { name, value } = e.target;
    const newHotels = [...formData.hotels];
    newHotels[index] = { ...newHotels[index], [name]: value };
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const addHotel = () => {
    setFormData(prev => ({
      ...prev,
      hotels: [...prev.hotels, { name: '', roomCategory: '', accommodation: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }], mealPlan: '', hotelInclusions: [''] }]
    }));
  };

  const removeHotel = (index) => {
    const newHotels = [...formData.hotels];
    newHotels.splice(index, 1);
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const handleAccommodationChange = (hotelIndex, roomIndex, e) => {
    const { name, value } = e.target;
    const newHotels = [...formData.hotels];
    const newAccommodation = [...(newHotels[hotelIndex].accommodation || [])];
    newAccommodation[roomIndex] = { ...newAccommodation[roomIndex], [name]: parseInt(value) || 0 };
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], accommodation: newAccommodation };
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const addAccommodationRoom = (hotelIndex) => {
    const newHotels = [...formData.hotels];
    newHotels[hotelIndex].accommodation.push({ rooms: 1, adt: 0, chd: 0, inf: 0 });
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const removeAccommodationRoom = (hotelIndex, roomIndex) => {
    const newHotels = [...formData.hotels];
    newHotels[hotelIndex].accommodation.splice(roomIndex, 1);
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const handleHotelInclusionChange = (hotelIndex, inclusionIndex, e) => {
    const newHotels = [...formData.hotels];
    const newHotelInclusions = [...(newHotels[hotelIndex].hotelInclusions || [])];
    newHotelInclusions[inclusionIndex] = e.target.value;
    newHotels[hotelIndex] = { ...newHotels[hotelIndex], hotelInclusions: newHotelInclusions };
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const addHotelInclusion = (hotelIndex) => {
    const newHotels = [...formData.hotels];
    newHotels[hotelIndex].hotelInclusions.push('');
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  const removeHotelInclusion = (hotelIndex, inclusionIndex) => {
    const newHotels = [...formData.hotels];
    newHotels[hotelIndex].hotelInclusions.splice(inclusionIndex, 1);
    setFormData(prev => ({ ...prev, hotels: newHotels }));
  };

  // --- Tour Handlers ---
  const handleTourChange = (index, e) => {
    const { name, value } = e.target;
    const newTours = [...formData.tours];
    newTours[index] = { ...newTours[index], [name]: name === 'cost' ? parseFloat(value) || 0 : value };
    setFormData(prev => ({ ...prev, tours: newTours }));
  };

  const addTour = () => {
    setFormData(prev => ({
      ...prev,
      tours: [...prev.tours, { name: '', date: tripDepartureDate, cost: 0 }]
    }));
  };

  const removeTour = (index) => {
    const newTours = [...formData.tours];
    newTours.splice(index, 1);
    setFormData(prev => ({ ...prev, tours: newTours }));
  };

  // --- Medical Assistance Handlers ---
  const handleMedicalAssistanceChange = (index, e) => {
    const { name, value } = e.target;
    const newMedicalAssistances = [...formData.medicalAssistances];
    newMedicalAssistances[index] = { ...newMedicalAssistances[index], [name]: value };
    setFormData(prev => ({ ...prev, medicalAssistances: newMedicalAssistances }));
  };

  const addMedicalAssistance = () => {
    setFormData(prev => ({
      ...prev,
      medicalAssistances: [...prev.medicalAssistances, { planType: 'traditional_tourism', startDate: tripDepartureDate, endDate: tripReturnDate }]
    }));
  };

  const removeMedicalAssistance = (index) => {
    const newMedicalAssistances = [...formData.medicalAssistances];
    newMedicalAssistances.splice(index, 1);
    setFormData(prev => ({ ...prev, medicalAssistances: newMedicalAssistances }));
  };

  const calculateDaysBetweenDates = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays + 1; // +1 to include both start and end day
  };

  // --- Installments Handlers ---
  const handleInstallmentChange = (index, e) => {
    const { name, value } = e.target;
    const newInstallments = [...formData.installments];
    newInstallments[index] = { ...newInstallments[index], [name]: name === 'amount' ? parseFloat(value) || 0 : value };
    setFormData(prev => ({ ...prev, installments: newInstallments }));
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, { amount: 0, dueDate: getTodayDate() }]
    }));
  };

  const removeInstallment = (index) => {
    const newInstallments = [...formData.installments];
    newInstallments.splice(index, 1);
    setFormData(prev => ({ ...prev, installments: newInstallments }));
  };

  const calculateInstallments = () => {
    const numInstallments = parseInt(formData.installmentsCount);
    if (isNaN(numInstallments) || numInstallments <= 0) {
      alert("Por favor, introduce un número válido de cuotas.");
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert("El monto total del plan debe ser mayor a 0 para calcular cuotas.");
      return;
    }

    const amountPerInstallment = totalAmount / numInstallments;
    const newInstallments = [];
    let currentDate = new Date();
    const departureDateObj = new Date(tripDepartureDate);

    for (let i = 0; i < numInstallments; i++) {
      let dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, currentDate.getDate());
      
      // Ensure due date is not after trip departure date
      if (dueDate > departureDateObj) {
        dueDate = new Date(departureDateObj);
        dueDate.setDate(departureDateObj.getDate() - 1); // One day before departure
        if (dueDate < currentDate) { // If even one day before departure is in the past, set to today
          dueDate = new Date();
        }
      }

      newInstallments.push({
        amount: parseFloat(amountPerInstallment.toFixed(2)),
        dueDate: dueDate.toISOString().split('T')[0]
      });
    }
    setFormData(prev => ({ ...prev, installments: newInstallments }));
  };

  const totalInstallmentsAmount = formData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

  // Calculate total passengers in accommodation
  const totalAccommodationPassengers = formData.hotels.reduce((acc, hotel) => {
    return acc + (hotel.accommodation || []).reduce((hotelAcc, room) => {
      return hotelAcc + (room.rooms * (room.adt || 0)) + (room.rooms * (room.chd || 0)) + (room.rooms * (room.inf || 0));
    }, 0);
  }, 0);


  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {reservation ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Reservation Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información Básica de la Reserva
            </h3>
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo del Titular</label>
                <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre del titular" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Identificación del Titular</label>
                <input type="text" name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="DNI / Pasaporte" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email del Titular</label>
                <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="email@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono del Titular</label>
                <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="+34 600 000 000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección del Titular</label>
                <input type="text" name="clientAddress" value={formData.clientAddress} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Calle, Ciudad, Código Postal" />
              </div>
            </div>

            {/* Emergency Contact (Sub-section) */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5" /> Contacto de Emergencia
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Contacto</label>
                  <input type="text" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyContactChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre del contacto de emergencia" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono del Contacto</label>
                  <input type="tel" name="phone" value={formData.emergencyContact.phone} onChange={handleEmergencyContactChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="+34 600 000 000" />
                </div>
              </div>
            </div>

            {/* Passengers Section */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5" /> Cantidad de Pasajeros
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adultos (ADT)</label>
                  <input type="number" name="passengersADT" value={formData.passengersADT} onChange={handleChange} min="0" required className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niños (CHD)</label>
                  <input type="number" name="passengersCHD" value={formData.passengersCHD} onChange={handleChange} min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Infantes (INF)</label>
                  <input type="number" name="passengersINF" value={formData.passengersINF} onChange={handleChange} min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium mt-2">
                Total de personas en la reserva: <span className="font-bold">{totalPassengersCalculated.total}</span> (ADT: {totalPassengersCalculated.adt}, CHD: {totalPassengersCalculated.chd}, INF: {totalPassengersCalculated.inf})
              </p>
            </div>

            {/* Trip Cycle, Origin, Destination, Dates */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Detalles del Itinerario
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Viaje</label>
                <select name="tripType" value={formData.tripType} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="round_trip">Ida y Vuelta</option>
                  <option value="one_way">Solo Ida</option>
                  <option value="multi_city">Múltiples Ciudades</option>
                </select>
              </div>

              {formData.tripType === 'multi_city' ? (
                <div className="space-y-4">
                  {formData.segments.map((segment, index) => (
                    <div key={index} className="p-4 border border-gray-300 rounded-lg relative">
                      <h5 className="font-bold text-gray-900 mb-3">Segmento {index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                          <input type="text" name="origin" value={segment.origin} onChange={(e) => handleSegmentChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ciudad de origen" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                          <input type="text" name="destination" value={segment.destination} onChange={(e) => handleSegmentChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ciudad de destino" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Salida</label>
                          <input type="date" name="departureDate" value={segment.departureDate} onChange={(e) => handleSegmentChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" min={getTodayDate()} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Regreso</label>
                          <input type="date" name="returnDate" value={segment.returnDate} onChange={(e) => handleSegmentChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" min={segment.departureDate || getTodayDate()} />
                        </div>
                        {errors[`segment-${index}`] && (
                          <p className="text-red-600 text-sm md:col-span-2">{errors[`segment-${index}`]}</p>
                        )}
                      </div>
                      {formData.segments.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => removeSegment(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MinusCircle className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                  <motion.button
                    type="button"
                    onClick={addSegment}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Agregar Segmento
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                    <input type="text" name="origin" value={formData.segments[0].origin} onChange={(e) => handleSegmentChange(0, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ciudad de origen" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                    <input type="text" name="destination" value={formData.segments[0].destination} onChange={(e) => handleSegmentChange(0, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ciudad de destino" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Salida</label>
                    <input type="date" name="departureDate" value={formData.segments[0].departureDate} onChange={(e) => handleSegmentChange(0, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" min={getTodayDate()} />
                    {errors.departureDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.departureDate}</p>
                    )}
                  </div>
                  {formData.tripType === 'round_trip' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Regreso</label>
                      <input type="date" name="returnDate" value={formData.segments[0].returnDate} onChange={(e) => handleSegmentChange(0, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" min={formData.segments[0].departureDate || getTodayDate()} />
                      {errors.returnDate && (
                        <p className="text-red-600 text-sm mt-1">{errors.returnDate}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flights Section */}
          {showFlights && (
            <CollapsibleSection title="Detalles de Vuelos" icon={Plane}>
              <div className="space-y-4">
                {formData.flights.map((flight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Vuelo {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aerolínea</label>
                      <input type="text" name="airline" value={flight.airline} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Iberia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría del Vuelo</label>
                      <select name="flightCategory" value={flight.flightCategory} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Seleccionar</option>
                        <option value="economica">Económica</option>
                        <option value="premium_economica">Premium Económica</option>
                        <option value="business">Business</option>
                        <option value="primera_clase">Primera Clase</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo del Vuelo</label>
                      <select name="flightCycle" value={flight.flightCycle} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="round_trip">Ida y Vuelta</option>
                        <option value="one_way">Solo Ida</option>
                        <option value="return_only">Solo Regreso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipaje Permitido</label>
                      <select name="baggageAllowance" value={flight.baggageAllowance} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Seleccionar</option>
                        <option value="carry_on">Solo equipaje de mano</option>
                        <option value="1_checked_bag">1 maleta facturada (hasta 23kg)</option>
                        <option value="2_checked_bags">2 maletas facturadas (hasta 23kg c/u)</option>
                        <option value="heavy_bag">1 maleta facturada (hasta 32kg)</option>
                        <option value="no_baggage">Sin equipaje</option>
                        <option value="other">Otro (especificar en notas)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg mt-4">
                    <Info className="w-5 h-5 text-gray-600" />
                    <label htmlFor={`hasItinerary-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                      ¿Ya tienes los detalles de itinerario y PNR?
                    </label>
                    <input
                      type="checkbox"
                      id={`hasItinerary-${index}`}
                      name="hasItinerary"
                      checked={flight.hasItinerary}
                      onChange={(e) => handleFlightChange(index, e)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>

                  <AnimatePresence>
                    {flight.hasItinerary && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mt-4 space-y-4"
                      >
                        <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                              <List className="w-4 h-4" /> Itinerarios de Vuelo
                            </h5>
                            <motion.button type="button" onClick={() => addItinerary(index)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <PlusCircle className="w-4 h-4" /> Añadir Itinerario
                            </motion.button>
                          </div>
                          {(flight.itineraries || []).map((itinerary, itIndex) => (
                            <div key={itIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Número de Vuelo</label>
                                <input type="text" name="flightNumber" value={itinerary.flightNumber} onChange={(e) => handleItineraryChange(index, itIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" placeholder="Ej: IB3100" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hora Salida</label>
                                <input type="time" name="departureTime" value={itinerary.departureTime} onChange={(e) => handleItineraryChange(index, itIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hora Llegada</label>
                                <input type="time" name="arrivalTime" value={itinerary.arrivalTime} onChange={(e) => handleItineraryChange(index, itIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
                              </div>
                              {(flight.itineraries || []).length > 1 && (
                                <motion.button type="button" onClick={() => removeItinerary(index, itIndex)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <MinusCircle className="w-4 h-4" />
                                </motion.button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Código de Rastreo (PNR)</label>
                          <input type="text" name="trackingCode" value={flight.trackingCode} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="PNR" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {formData.flights.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeFlight(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              ))}
              <motion.button
                type="button"
                onClick={addFlight}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="w-5 h-5" />
                Añadir Vuelo
              </motion.button>
            </div>
          </CollapsibleSection>
          )}

          {/* Hotels Section */}
          {showHotels && (
          <CollapsibleSection title="Detalles de Hoteles" icon={Hotel}>
            <div className="space-y-4">
              {formData.hotels.map((hotel, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Hotel {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Hotel</label>
                      <input type="text" name="name" value={hotel.name} onChange={(e) => handleHotelChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Hotel Gran Via" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría de Habitación</label>
                      <input type="text" name="roomCategory" value={hotel.roomCategory} onChange={(e) => handleHotelChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Doble Estándar, Suite" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Bed className="w-4 h-4" /> Acomodación
                      </h5>
                      <motion.button type="button" onClick={() => addAccommodationRoom(index)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <PlusCircle className="w-4 h-4" /> Añadir Habitación
                      </motion.button>
                    </div>
                    {(hotel.accommodation || []).map((room, roomIndex) => (
                      <div key={roomIndex} className="grid grid-cols-4 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Habitaciones</label><input type="number" name="rooms" value={room.rooms} onChange={(e) => handleAccommodationChange(index, roomIndex, e)} min="1" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">ADT</label><input type="number" name="adt" value={room.adt} onChange={(e) => handleAccommodationChange(index, roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">CHD</label><input type="number" name="chd" value={room.chd} onChange={(e) => handleAccommodationChange(index, roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">INF</label><input type="number" name="inf" value={room.inf} onChange={(e) => handleAccommodationChange(index, roomIndex, e)} min="0" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /></div>
                        {(hotel.accommodation || []).length > 1 && (
                          <motion.button type="button" onClick={() => removeAccommodationRoom(index, roomIndex)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <MinusCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                    <p className={`text-sm font-medium mt-2 ${totalAccommodationPassengers === totalPassengersCalculated.total ? 'text-gray-600' : 'text-red-600'}`}>
                      Total de personas en acomodación: <span className="font-bold">
                        {(hotel.accommodation || []).reduce((acc, room) => acc + (room.rooms * (room.adt || 0)) + (room.rooms * (room.chd || 0)) + (room.rooms * (room.inf || 0)), 0)}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Alimentación</label>
                    <select name="mealPlan" value={hotel.mealPlan} onChange={(e) => handleHotelChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Seleccionar</option><option value="solo_alojamiento">Solo Alojamiento (SA)</option><option value="desayuno">Desayuno (AD)</option><option value="media_pension">Media Pensión (MP)</option><option value="pension_completa">Pensión Completa (PC)</option><option value="todo_incluido">Todo Incluido (TI)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <Info className="w-4 h-4" /> Inclusiones del Hotel
                      </h5>
                      <motion.button type="button" onClick={() => addHotelInclusion(index)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <PlusCircle className="w-4 h-4" /> Añadir Inclusión
                      </motion.button>
                    </div>
                    {(hotel.hotelInclusions || []).map((inclusion, inclusionIndex) => (
                      <div key={inclusionIndex} className="flex items-center gap-2 relative">
                        <input type="text" value={inclusion} onChange={(e) => handleHotelInclusionChange(index, inclusionIndex, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Wifi, Piscina, Gimnasio..." />
                        {(hotel.hotelInclusions || []).length > 1 && (
                          <motion.button type="button" onClick={() => removeHotelInclusion(index, inclusionIndex)} className="p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <MinusCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.hotels.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeHotel(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              ))}
              <motion.button
                type="button"
                onClick={addHotel}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="w-5 h-5" />
                Añadir Hotel
              </motion.button>
            </div>
          </CollapsibleSection>
           )}

          {/* Tours Section */}
          {showTours && (
          <CollapsibleSection title="Detalles de Tours" icon={Ticket}>
            <div className="space-y-4">
              {errors.tours && (
                <p className="text-red-600 text-sm">{errors.tours}</p>
              )}
              {formData.tours.map((tour, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Tour {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Tour</label>
                      <input type="text" name="name" value={tour.name} onChange={(e) => handleTourChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Tour por la ciudad" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                      <input
                        type="date"
                        name="date"
                        value={tour.date}
                        onChange={(e) => handleTourChange(index, e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        min={tripDepartureDate}
                        max={tripReturnDate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Costo ({settings.currency})</label>
                      <input type="number" name="cost" value={tour.cost} onChange={(e) => handleTourChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="0.00" />
                    </div>
                  </div>
                  {formData.tours.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeTour(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              ))}
              <motion.button
                type="button"
                onClick={addTour}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="w-5 h-5" />
                Añadir Tour
              </motion.button>
            </div>
          </CollapsibleSection>
          )}

          {/* Medical Assistance Section */}
          {showMedical && (
          <CollapsibleSection title="Asistencias Médicas" icon={BriefcaseMedical}>
            <div className="space-y-4">
              {errors.medicalAssistances && (
                <p className="text-red-600 text-sm">{errors.medicalAssistances}</p>
              )}
              {formData.medicalAssistances.map((ma, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Asistencia Médica {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Plan</label>
                      <select name="planType" value={ma.planType} onChange={(e) => handleMedicalAssistanceChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="traditional_tourism">Turismo Tradicional</option>
                        <option value="international_assistance">Asistencia Internacional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio Cobertura</label>
                      <input
                        type="date"
                        name="startDate"
                        value={ma.startDate}
                        onChange={(e) => handleMedicalAssistanceChange(index, e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        min={tripDepartureDate}
                        max={tripReturnDate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin Cobertura</label>
                      <input
                        type="date"
                        name="endDate"
                        value={ma.endDate}
                        onChange={(e) => handleMedicalAssistanceChange(index, e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        min={ma.startDate || tripDepartureDate}
                        max={tripReturnDate}
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <p className="font-semibold">Resumen de Cobertura:</p>
                    <p>Tipo: {ma.planType === 'traditional_tourism' ? 'Turismo Tradicional' : 'Asistencia Internacional'}</p>
                    <p>Duración: {calculateDaysBetweenDates(ma.startDate || tripDepartureDate, ma.endDate || tripReturnDate)} días</p>
                  </div>
                  {formData.medicalAssistances.length > 1 && (
                    <motion.button
                      type="button"
                      onClick={() => removeMedicalAssistance(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              ))}
              <motion.button
                type="button"
                onClick={addMedicalAssistance}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium mt-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="w-5 h-5" />
                Añadir Asistencia Médica
              </motion.button>
            </div>
          </CollapsibleSection>
          )}

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Detalles de la Reserva
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Adulto (ADT) ({settings.currency})
                </label>
                <input
                  type="number"
                  name="pricePerADT"
                  value={formData.pricePerADT}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Niño (CHD) ({settings.currency})
                </label>
                <input
                  type="number"
                  name="pricePerCHD"
                  value={formData.pricePerCHD}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Infante (INF) ({settings.currency})
                </label>
                <input
                  type="number"
                  name="pricePerINF"
                  value={formData.pricePerINF}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Total del Plan:
              </h4>
              <span className="text-2xl font-extrabold text-blue-800">{formatCurrency(formData.totalAmount)}</span>
            </div>
            
            {/* Payment Option */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <Euro className="w-5 h-5" /> Opciones de Pago
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pago</label>
                <select name="paymentOption" value={formData.paymentOption} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="full_payment">Pago Total</option>
                  <option value="installments">Pago a Cuotas</option>
                </select>
              </div>

              {formData.paymentOption === 'installments' && (
                <div className="space-y-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                        <List className="w-4 h-4" /> Cuotas
                      </h5>
                      <input
                        type="number"
                        name="installmentsCount"
                        value={formData.installmentsCount}
                        onChange={handleChange}
                        min="1"
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={addInstallment}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusCircle className="w-4 h-4" /> Añadir Cuota
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={calculateInstallments}
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Calculator className="w-4 h-4" /> Calcular Cuotas
                      </motion.button>
                    </div>
                  </div>
                  {formData.installments.map((installment, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Monto ({settings.currency})</label>
                        <input type="number" name="amount" value={installment.amount} onChange={(e) => handleInstallmentChange(index, e)} step="0.01" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de Vencimiento</label>
                        <input type="date" name="dueDate" value={installment.dueDate} onChange={(e) => handleInstallmentChange(index, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" min={getTodayDate()} />
                      </div>
                      {formData.installments.length > 1 && (
                        <motion.button type="button" onClick={() => removeInstallment(index)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <MinusCircle className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                  <p className="text-sm font-semibold text-gray-800 mt-4">Total Cuotas: {formatCurrency(totalInstallmentsAmount)}</p>
                  {totalInstallmentsAmount !== parseFloat(formData.totalAmount) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <Info className="w-4 h-4" /> El total de las cuotas no coincide con el total del plan.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas sobre la reserva..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-5 h-5" />
              {reservation ? 'Actualizar' : 'Crear'} Reserva
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ReservationForm;