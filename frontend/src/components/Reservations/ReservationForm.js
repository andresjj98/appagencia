import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  DollarSign,
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
import { useAuth } from '../../pages/AuthContext';
import AirportInput from '../common/AirportInput';
import AirlineInput from '../common/AirlineInput';

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

const formatDateForField = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
};

// Formatear número con separador de miles (punto)
const formatNumberWithThousands = (value) => {
  if (!value || value === 0 || value === '0') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) : value;
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parsear número desde formato con miles a número puro
const parseNumberFromFormatted = (value) => {
  if (!value || value === '') return 0;
  const cleaned = typeof value === 'string' ? value.replace(/\./g, '') : value;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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


const ReservationForm = ({ reservation = null, reservationType = 'all_inclusive', onSave, onClose, focusSection = null }) => {
  const { settings } = useSettings();
  const { currentUser: user } = useAuth();

  const resolvedCurrency = settings?.currency === 'EUR' ? 'COP' : (settings?.currency || 'COP');
  const formatCurrencyValue = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: resolvedCurrency }).format(value || 0);

  // Referencias para scroll automático a secciones
  const flightsRef = useRef(null);
  const hotelsRef = useRef(null);
  const toursRef = useRef(null);
  const medicalAssistanceRef = useRef(null);
  const transfersRef = useRef(null);

  const showFlights = reservationType === 'all_inclusive' || reservationType === 'flights_only';
  const showHotels = reservationType === 'all_inclusive' || reservationType === 'hotel_only';
  const showTours = reservationType === 'all_inclusive' || reservationType === 'tours_only';
  const showMedical = reservationType === 'all_inclusive' || reservationType === 'medical_assistance';

  // Scroll automático a la sección específica
  useEffect(() => {
    if (focusSection) {
      const sectionRefs = {
        flights: flightsRef,
        hotels: hotelsRef,
        tours: toursRef,
        medicalAssistance: medicalAssistanceRef,
        transfers: transfersRef
      };

      const targetRef = sectionRefs[focusSection];
      if (targetRef?.current) {
        setTimeout(() => {
          targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Resaltar visualmente la sección
          targetRef.current.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
          setTimeout(() => {
            targetRef.current.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
          }, 2000);
        }, 300);
      }
    }
  }, [focusSection]);

  // Map API data (snake_case) to form-friendly camelCase structure
  const mapSegments = (segments) =>
    (segments || []).map((s) => ({
      id: s.id,
      origin: s.origin || '',
      destination: s.destination || '',
      departureDate: formatDate(s.departureDate || s.departure_date),
      returnDate: formatDate(s.returnDate || s.return_date)
    }));

  const mapFlights = (flights) => (flights || []).map((f) => {
    const standardCycles = ['round_trip', 'outbound', 'inbound', 'one_way', 'return_only'];
    const flightCycleValue = f.flightCycle || f.flight_cycle;
    const isSegmentCycle = flightCycleValue?.startsWith('segment_');
    const isCustomCycle = flightCycleValue && !isSegmentCycle && !standardCycles.includes(flightCycleValue);

    return {
        airline: f.airline || '',
        flightCategory: f.flightCategory || f.flight_category || '',
        baggageAllowance: f.baggageAllowance || f.baggage_allowance || '',
        flightCycle: isCustomCycle ? 'other' : (flightCycleValue || 'round_trip'),
        customFlightCycle: isCustomCycle ? flightCycleValue : '',
        hasItinerary: f.hasItinerary || (f.reservation_flight_itineraries && f.reservation_flight_itineraries.length > 0),
        itineraries:
            (f.reservation_flight_itineraries || f.itineraries || []).map((i) => ({
                flightNumber: i.flightNumber || i.flight_number || '',
                departureTime: formatTime(i.departureTime || i.departure_time),
                arrivalTime: formatTime(i.arrivalTime || i.arrival_time),
                date: formatDateForField(i.departure_time),
            })),
        trackingCode: f.trackingCode || f.tracking_code || f.pnr || '',
    };
  });

  const normalizeAccommodationList = (accommodation) => {
    const normalized = (accommodation || []).map((room) => ({
      rooms: Number(room?.rooms ?? room?.room ?? 1) || 1,
      adt: Number(room?.adt ?? room?.adults ?? 0) || 0,
      chd: Number(room?.chd ?? room?.children ?? 0) || 0,
      inf: Number(room?.inf ?? room?.infants ?? 0) || 0,
    }));
    return normalized.length > 0 ? normalized : [{ rooms: 1, adt: 0, chd: 0, inf: 0 }];
  };

  const normalizeHotelInclusions = (inclusions) => {
    const mapped = (inclusions || []).map((item) => {
      if (typeof item === 'string') return item;
      if (item?.inclusion) return item.inclusion;
      return '';
    });
    return mapped.length > 0 ? mapped : [''];
  };

  const mapHotels = (hotels) =>
    (hotels || []).map((h) => ({
      name: h.name || '',
      roomCategory: h.roomCategory || h.room_category || '',
      accommodation: normalizeAccommodationList(
        h.accommodation || h.reservation_hotel_accommodations
      ),
      mealPlan: h.mealPlan || h.meal_plan || '',
      hotelInclusions: normalizeHotelInclusions(
        h.hotelInclusions || h.reservation_hotel_inclusions
      ),
    }));

  const mapTours = (tours) =>
    (tours || []).map((t) => ({
      name: t.name || '',
      date: formatDate(t.date),
      cost: t.cost || 0,
      includeCost: t.includeCost || false,
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
    ? mapSegments(reservation.reservation_segments, [])
    : [{
        origin: '',
        destination: '',
        departureDate: getTodayDate(),
        returnDate: getTodayDate()
      }];
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
    segments: initialSegments,
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
            customFlightCycle: '',
            hasItinerary: false,
            itineraries: [{ flightNumber: '', departureTime: '', arrivalTime: '', date: '' }],
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
    transfers: reservation?.reservation_transfers
      ? (() => {
          // Agrupar traslados por segmento
          const transfersBySegment = {};
          reservation.reservation_transfers.forEach(t => {
            const segIdx = reservation.reservation_segments.findIndex(s => s.id === t.segment_id);
            if (segIdx !== -1) {
              if (!transfersBySegment[segIdx]) {
                transfersBySegment[segIdx] = { hasIn: false, hasOut: false };
              }
              if (t.transfer_type === 'arrival') transfersBySegment[segIdx].hasIn = true;
              if (t.transfer_type === 'departure') transfersBySegment[segIdx].hasOut = true;
            }
          });
          return transfersBySegment;
        })()
      : { 0: { hasIn: false, hasOut: false } },
    tours: reservation
      ? mapTours(reservation.reservation_tours)
      : showTours
      ? [{ name: '', date: initialTripDepartureDate, cost: 0, includeCost: false }]
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
  const [flightTripType, setFlightTripType] = useState('round_trip');
  const initialFormDataRef = useRef(JSON.parse(JSON.stringify(initialFormState)));

  const [totalPassengersCalculated, setTotalPassengersCalculated] = useState({
    total: 0, adt: 0, chd: 0, inf: 0
  });

  // Sincronizar traslados con segmentos cuando cambia el número de segmentos
  useEffect(() => {
    setFormData(prev => {
      const newTransfers = { ...(prev.transfers || {}) };

      // Asegurar que cada segmento tenga su entrada de traslados
      prev.segments.forEach((_, index) => {
        if (!newTransfers[index]) {
          newTransfers[index] = { hasIn: false, hasOut: false };
        }
      });

      // Limpiar traslados de segmentos que ya no existen
      Object.keys(newTransfers).forEach(key => {
        const idx = parseInt(key);
        if (idx >= prev.segments.length) {
          delete newTransfers[idx];
        }
      });

      return { ...prev, transfers: newTransfers };
    });
  }, [formData.segments.length]);
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
  const tripReturnDate = formData.segments[formData.segments.length - 1]?.returnDate || '';

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
    const basePriceTotal =
      (totalPassengersCalculated.adt * (parseFloat(formData.pricePerADT) || 0)) +
      (totalPassengersCalculated.chd * (parseFloat(formData.pricePerCHD) || 0)) +
      (totalPassengersCalculated.inf * (parseFloat(formData.pricePerINF) || 0));

    // Sumar costos de tours que tienen includeCost activado
    const toursCostTotal = formData.tours
      .filter(tour => tour.includeCost)
      .reduce((sum, tour) => {
        const costPerPax = parseFloat(tour.cost) || 0;
        return sum + (costPerPax * totalPassengersCalculated.total);
      }, 0);

    const calculatedTotal = basePriceTotal + toursCostTotal;
    setFormData(prev => ({ ...prev, totalAmount: calculatedTotal.toFixed(2) }));
  }, [totalPassengersCalculated, formData.pricePerADT, formData.pricePerCHD, formData.pricePerINF, formData.tours]);

  const validateForm = () => {
    const newErrors = {};

    if (!tripDepartureDate) {
      newErrors.departureDate = 'La fecha de salida es obligatoria.';
    }
    if (reservationType !== 'flights_only' || flightTripType === 'round_trip') {
      if (!tripReturnDate) {
        newErrors.returnDate = 'La fecha de regreso es obligatoria.';
      } else if (new Date(tripReturnDate) <= new Date(tripDepartureDate)) {
        newErrors.returnDate = 'La fecha de regreso debe ser posterior a la fecha de salida.';
      }
    }

    // Validación para Origen y Destino en Viaje de Ida y Vuelta
    if (formData.tripType === 'round_trip') {
      if (!formData.segments[0]?.origin) {
        newErrors.origin = 'El origen es obligatorio.';
      }
      if (!formData.segments[0]?.destination) {
        newErrors.destination = 'El destino es obligatorio.';
      }
    }

    if (formData.tripType === 'multi_city') {
      formData.segments.forEach((seg, idx) => {
        if (!seg.departureDate || !seg.returnDate) {
          newErrors[`segment-${idx}`] = 'Debe indicar fechas de salida y regreso.';
        } else if (new Date(seg.returnDate) < new Date(seg.departureDate)) {
          newErrors[`segment-${idx}`] = 'La fecha de regreso debe ser posterior a la fecha de salida.';
        }
      });
    }

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
    dataToSend.advisorId = user?.id; // <-- AÑADIDO: Incluye el ID del asesor
    dataToSend.reservation_type = reservationType;

    // FIX: Asegurarse de que los recuentos de pasajeros y precios sean números
    dataToSend.passengersADT = parseInt(formData.passengersADT, 10) || 0;
    dataToSend.passengersCHD = parseInt(formData.passengersCHD, 10) || 0;
    dataToSend.passengersINF = parseInt(formData.passengersINF, 10) || 0;
    dataToSend.pricePerADT = parseFloat(formData.pricePerADT) || 0;
    dataToSend.pricePerCHD = parseFloat(formData.pricePerCHD) || 0;
    dataToSend.pricePerINF = parseFloat(formData.pricePerINF) || 0;

    if (dataToSend.paymentOption === 'full_payment') {
      dataToSend.installments = [{ amount: dataToSend.totalAmount, dueDate: getTodayDate() }];
    }

    if (reservationType === 'flights_only' && flightTripType === 'one_way') {
      dataToSend.segments.forEach(segment => {
        segment.returnDate = null;
      });
    }

    // Handle custom flight cycle text
    if (dataToSend.flights) {
      const baggageMap = {
        "personal_item": "Artículo Personal (Bajo el Asiento)",
        "carry_on": "Equipaje de Mano (Cabina, Compartimento Superior)",
        "1_checked_bag": "1 maleta facturada (hasta 23kg)",
        "2_checked_bags": "2 maletas facturadas (hasta 23kg c/u)",
        "heavy_bag": "1 maleta facturada (hasta 32kg)",
        "no_baggage": "Sin equipaje",
        "other": "Otro (especificar en notas)"
      };
      const categoryMap = {
        "economica": "Económica",
        "premium_economica": "Premium Económica",
        "business": "Business",
        "primera_clase": "Primera Clase"
      };

      dataToSend.flights.forEach(flight => {
        if (flight.flightCycle === 'other') {
          flight.flightCycle = flight.customFlightCycle || 'Ciclo no especificado';
        } else {
            const cycleOption = flightCycleOptions.find(opt => opt.value === flight.flightCycle);
            if (cycleOption) {
                flight.flightCycle = cycleOption.label;
            }
        }
        delete flight.customFlightCycle; // Clean up temp field

        if(baggageMap[flight.baggageAllowance]) {
            flight.baggageAllowance = baggageMap[flight.baggageAllowance];
        }

        if(categoryMap[flight.flightCategory]) {
            flight.flightCategory = categoryMap[flight.flightCategory];
        }
      });
    }

    // Combine date and time for flight itineraries into valid ISO 8601 format with UTC timezone
    if (dataToSend.flights) {
      dataToSend.flights.forEach((flight) => {
        if (flight.itineraries) {
          flight.itineraries.forEach(itinerary => {
            const flightDate = itinerary.date;

            if (flightDate && itinerary.departureTime) {
              itinerary.departure_time = `${flightDate}T${itinerary.departureTime}:00Z`;
            } else {
              delete itinerary.departure_time;
            }
            if (flightDate && itinerary.arrivalTime) {
              // Assuming arrival is on the same day as departure.
              itinerary.arrival_time = `${flightDate}T${itinerary.arrivalTime}:00Z`;
            } else {
              delete itinerary.arrival_time;
            }

            delete itinerary.date; // Clean up the temporary field
          });
        }
      });
    }

    // Los transfers se envían tal cual para el preview
    // Se convertirán al formato del backend justo antes de guardar
    onSave(dataToSend);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Validaciones específicas por campo
    let processedValue = value;

    if (name === 'clientId') {
      // Solo números, sin puntos ni otros caracteres
      processedValue = value.replace(/[^0-9]/g, '').toUpperCase();
    } else if (name === 'clientPhone') {
      // Solo números y el símbolo +
      processedValue = value.replace(/[^0-9+]/g, '');
    } else if (['clientName', 'clientAddress'].includes(name) && type === 'text') {
      // Convertir a mayúsculas
      processedValue = value.toUpperCase();
    } else if (['pricePerADT', 'pricePerCHD', 'pricePerINF'].includes(name)) {
      // Campos de precio: permitir solo números y punto
      const cleanValue = value.replace(/[^\d]/g, '');
      processedValue = cleanValue === '' ? 0 : parseInt(cleanValue);
    }

    if (name === 'tripType') {
      // If trip type changes, reset related form sections but keep client/passenger data.
      setFormData(prev => {
        const newTripDepartureDate = getTodayDate();
        const newTripReturnDate = getTodayDate();

        const blankStateForReset = {
          pricePerADT: 0,
          pricePerCHD: 0,
          pricePerINF: 0,
          totalAmount: 0,
          paymentOption: 'full_payment',
          installments: [{ amount: 0, dueDate: getTodayDate() }],
          installmentsCount: 1,
          status: prev.status, // Keep original status if editing
          notes: '',
          segments: [{ origin: '', destination: '', departureDate: getTodayDate(), returnDate: getTodayDate() }],
          transfers: { 0: { hasIn: false, hasOut: false } },
          flights: showFlights ? [
              {
                  airline: '',
                  flightCategory: '',
                  baggageAllowance: '',
                  flightCycle: 'round_trip',
                  customFlightCycle: '',
                  hasItinerary: false,
                  itineraries: [{ flightNumber: '', departureTime: '', arrivalTime: '', date: '' }],
                  trackingCode: '',
              },
          ] : [],
          hotels: showHotels ? [
              {
                  name: '',
                  roomCategory: '',
                  accommodation: [{ rooms: 1, adt: 0, chd: 0, inf: 0 }],
                  mealPlan: '',
                  hotelInclusions: [''],
              },
          ] : [],
          tours: showTours ? [{ name: '', date: newTripDepartureDate, cost: 0, includeCost: false }] : [],
          medicalAssistances: showMedical ? [
              {
                  planType: 'traditional_tourism',
                  startDate: newTripDepartureDate,
                  endDate: newTripReturnDate,
              },
          ] : [],
        };

        return {
          // Preserve client and passenger info from previous state
          clientName: prev.clientName,
          clientEmail: prev.clientEmail,
          clientPhone: prev.clientPhone,
          clientId: prev.clientId,
          clientAddress: prev.clientAddress,
          emergencyContact: prev.emergencyContact,
          passengersADT: prev.passengersADT,
          passengersCHD: prev.passengersCHD,
          passengersINF: prev.passengersINF,
          
          // Apply the new trip type
          tripType: value,

          // Apply the reset state for other fields
          ...blankStateForReset,
        };
      });
    } else if (name === 'paymentOption') {
      // Si cambia a pago completo, establecer una cuota con la fecha de hoy
      if (processedValue === 'full_payment') {
        setFormData(prev => ({
          ...prev,
          paymentOption: processedValue,
          installments: [{ amount: prev.totalAmount || 0, dueDate: getTodayDate() }],
          installmentsCount: 1
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: processedValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : processedValue
      }));
    }
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'name') {
      processedValue = value.toUpperCase();
    } else if (name === 'phone') {
      // Solo números y el símbolo +
      processedValue = value.replace(/[^0-9+]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: processedValue }
    }));
  };

  const handleSegmentChange = (index, e) => {
    const { name, value } = e.target;
    const newSegments = [...formData.segments];
    newSegments[index] = { ...newSegments[index], [name]: value };

    // Auto-set return date if departure date changes
    if (name === 'departureDate') {
      if (!newSegments[index].returnDate) {
        newSegments[index].returnDate = value;
      }
    }

    // Si cambia la fecha de regreso de un segmento, ajustar la fecha de salida del siguiente segmento
    if (name === 'returnDate' && value && index < newSegments.length - 1) {
      const nextSegment = newSegments[index + 1];
      // Si la fecha de salida del siguiente segmento es anterior a la nueva fecha de regreso, ajustarla
      if (!nextSegment.departureDate || nextSegment.departureDate < value) {
        newSegments[index + 1] = { ...nextSegment, departureDate: value };
        // También ajustar la fecha de regreso del siguiente segmento si es necesaria
        if (!nextSegment.returnDate || nextSegment.returnDate < value) {
          newSegments[index + 1].returnDate = value;
        }
      }
    }

    setFormData(prev => ({ ...prev, segments: newSegments }));
  };

  const handleAirportSelect = (index, name, iataCode) => {
    const newSegments = [...formData.segments];
    newSegments[index] = { ...newSegments[index], [name]: iataCode };
    setFormData(prev => ({ ...prev, segments: newSegments }));
  };

  const addSegment = () => {
    setFormData(prev => ({
      ...prev,
      segments: [...prev.segments, {
        origin: '',
        destination: '',
        departureDate: getTodayDate(),
        returnDate: getTodayDate()
      }]
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
    const upperCaseFields = ['trackingCode'];
    const processedValue = upperCaseFields.includes(name) ? value.toUpperCase() : value;
    const newFlights = [...formData.flights];
    newFlights[index] = { ...newFlights[index], [name]: type === 'checkbox' ? checked : processedValue };
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
        customFlightCycle: '',
        hasItinerary: false, 
        itineraries: [{ flightNumber: '', departureTime: '', arrivalTime: '', date: '' }], 
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
    const processedValue = name === 'flightNumber' ? value.toUpperCase() : value;
    const newFlights = [...formData.flights];
    const newItineraries = [...(newFlights[flightIndex].itineraries || [])];
    newItineraries[itineraryIndex] = { ...newItineraries[itineraryIndex], [name]: processedValue };
    newFlights[flightIndex] = { ...newFlights[flightIndex], itineraries: newItineraries };
    setFormData(prev => ({ ...prev, flights: newFlights }));
  };

  const addItinerary = (flightIndex) => {
    const newFlights = [...formData.flights];
    newFlights[flightIndex].itineraries.push({ flightNumber: '', departureTime: '', arrivalTime: '', date: '' });
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
    const upperCaseFields = ['name', 'roomCategory'];
    const processedValue = upperCaseFields.includes(name) ? value.toUpperCase() : value;
    const newHotels = [...formData.hotels];
    newHotels[index] = { ...newHotels[index], [name]: processedValue };
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
    newHotelInclusions[inclusionIndex] = e.target.value.toUpperCase();
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
    const { name, value, type, checked } = e.target;
    let processedValue;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'name') {
      processedValue = value.toUpperCase();
    } else if (name === 'cost') {
      // Campos de precio: permitir solo números
      const cleanValue = value.replace(/[^\d]/g, '');
      processedValue = cleanValue === '' ? 0 : parseInt(cleanValue);
    } else {
      processedValue = value;
    }

    const newTours = [...formData.tours];
    newTours[index] = { ...newTours[index], [name]: processedValue };
    setFormData(prev => ({ ...prev, tours: newTours }));
  };

  const addTour = () => {
    setFormData(prev => ({
      ...prev,
      tours: [...prev.tours, { name: '', date: tripDepartureDate, cost: 0, includeCost: false }]
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

    if (name === 'amount') {
      // Campos de precio: permitir solo números
      const cleanValue = value.replace(/[^\d]/g, '');
      const processedValue = cleanValue === '' ? 0 : parseInt(cleanValue);
      newInstallments[index] = { ...newInstallments[index], [name]: processedValue };
    } else {
      newInstallments[index] = { ...newInstallments[index], [name]: value };
    }

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
    const numInstallments = parseInt(formData.installmentsCount, 10);
    if (isNaN(numInstallments) || numInstallments <= 0) {
      alert("Por favor, introduce un número válido de cuotas.");
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      alert("El monto total del plan debe ser mayor a 0 para calcular cuotas.");
      return;
    }

    const totalRounded = Math.round(totalAmount);
    const baseAmount = Math.floor(totalRounded / numInstallments);
    const remainder = totalRounded - baseAmount * numInstallments;

    const newInstallments = [];
    let currentDate = new Date();
    const departureDateObj = new Date(tripDepartureDate);

    for (let i = 0; i < numInstallments; i++) {
      let dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, currentDate.getDate());

      if (dueDate > departureDateObj) {
        dueDate = new Date(departureDateObj);
        dueDate.setDate(departureDateObj.getDate() - 1);
        if (dueDate < currentDate) {
          dueDate = new Date();
        }
      }

      const roundedAmount = baseAmount + (i < remainder ? 1 : 0);

      newInstallments.push({
        amount: roundedAmount,
        dueDate: dueDate.toISOString().split('T')[0]
      });
    }
    setFormData(prev => ({ ...prev, installments: newInstallments }));
  };

  const totalInstallmentsAmount = formData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
  const expectedInstallmentsTotal = Math.round(parseFloat(formData.totalAmount) || 0);

  const tripMinDate = useMemo(() => {
    if (!formData.segments || formData.segments.length === 0) return getTodayDate();
    const dates = formData.segments
      .map(s => s.departureDate && new Date(s.departureDate))
      .filter(d => d && !isNaN(d.getTime()));
    if (dates.length === 0) return getTodayDate();
    return new Date(Math.min.apply(null, dates)).toISOString().split('T')[0];
  }, [formData.segments]);

  const tripMaxDate = useMemo(() => {
    if (!formData.segments || formData.segments.length === 0) return '';
    const dates = formData.segments
      .map(s => s.returnDate && new Date(s.returnDate))
      .filter(d => d && !isNaN(d.getTime()));
    if (dates.length === 0) {
        // Fallback to max departure date if no return dates are set
        const departureDates = formData.segments.map(s => s.departureDate && new Date(s.departureDate)).filter(d => d && !isNaN(d.getTime()));
        if (departureDates.length === 0) return '';
        return new Date(Math.max.apply(null, departureDates)).toISOString().split('T')[0];
    }
    return new Date(Math.max.apply(null, dates)).toISOString().split('T')[0];
  }, [formData.segments]);

  const flightCycleOptions = useMemo(() => {
    const segments = formData.segments.filter(s => s.origin && s.destination);
    const otherOption = { value: 'other', label: 'Otro (especificar)' };

    if (formData.tripType === 'round_trip') {
      if (segments.length > 0 && segments[0].origin && segments[0].destination) {
        const origin = segments[0].origin;
        const destination = segments[0].destination;
        return [
          { value: 'round_trip', label: `De ${origin} a ${destination} y de ${destination} a ${origin}` },
          { value: 'outbound', label: `De ${origin} a ${destination}` },
          { value: 'inbound', label: `De ${destination} a ${origin}` },
          otherOption
        ];
      }
      return [
        { value: 'round_trip', label: 'Ida y Vuelta (Completo)' },
        { value: 'outbound', label: 'Solo Ida' },
        { value: 'inbound', label: 'Solo Regreso' },
        otherOption
      ];
    }

    if (formData.tripType === 'multi_city' && segments.length > 0) {
      const segmentOptions = segments.map((seg, index) => ({
        value: `segment_${index}`,
        label: `De ${seg.origin} a ${seg.destination}`
      }));
      return [...segmentOptions, otherOption];
    }

    return [
      { value: 'round_trip', label: 'Ida y Vuelta' },
      otherOption
    ];
  }, [formData.segments, formData.tripType]);

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
              {reservationType === 'flights_only' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vuelo</label>
                  <select 
                    name="flightTripType" 
                    value={flightTripType} 
                    onChange={(e) => {
                      setFlightTripType(e.target.value);
                      if (e.target.value === 'one_way') {
                        const newSegments = [...formData.segments];
                        newSegments[0].returnDate = '';
                        setFormData(prev => ({ ...prev, segments: newSegments }));
                      }
                    }} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="round_trip">Ida y Vuelta</option>
                    <option value="one_way">Solo Ida</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Viaje</label>
                  <select name="tripType" value={formData.tripType} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    <option value="round_trip">Ida y Vuelta</option>
                    <option value="multi_city">Múltiples Ciudades</option>
                  </select>
                </div>
              )}

              {formData.tripType === 'multi_city' ? (
                <div className="space-y-4">
                  {formData.segments.map((segment, index) => (
                    <div key={index} className="p-4 border border-gray-300 rounded-lg relative">
                      <h5 className="font-bold text-gray-900 mb-3">Segmento {index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                          <AirportInput
                            value={segment.origin}
                            onSelect={(iataCode) => handleAirportSelect(index, 'origin', iataCode)}
                            placeholder="Ciudad de origen"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                          <AirportInput
                            value={segment.destination}
                            onSelect={(iataCode) => handleAirportSelect(index, 'destination', iataCode)}
                            placeholder="Ciudad de destino"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Salida</label>
                          <input
                            type="date"
                            name="departureDate"
                            value={segment.departureDate}
                            onChange={(e) => handleSegmentChange(index, e)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            min={index === 0 ? getTodayDate() : (formData.segments[index - 1].returnDate || getTodayDate())}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Regreso</label>
                          <input
                            type="date"
                            name="returnDate"
                            value={segment.returnDate}
                            onChange={(e) => handleSegmentChange(index, e)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            min={segment.departureDate || (index === 0 ? getTodayDate() : (formData.segments[index - 1].returnDate || getTodayDate()))}
                          />
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
                    <AirportInput
                      value={formData.segments[0].origin}
                      onSelect={(iataCode) => handleAirportSelect(0, 'origin', iataCode)}
                      placeholder="Ciudad de origen"
                    />
                    {errors.origin && (
                      <p className="text-red-600 text-sm mt-1">{errors.origin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                    <AirportInput
                      value={formData.segments[0].destination}
                      onSelect={(iataCode) => handleAirportSelect(0, 'destination', iataCode)}
                      placeholder="Ciudad de destino"
                    />
                    {errors.destination && (
                      <p className="text-red-600 text-sm mt-1">{errors.destination}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Salida</label>
                    <input type="date" name="departureDate" value={formData.segments[0].departureDate} onChange={(e) => handleSegmentChange(0, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" min={getTodayDate()} />
                    {errors.departureDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.departureDate}</p>
                    )}
                  </div>
                  {(reservationType !== 'flights_only' || flightTripType === 'round_trip') && (
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
            <div ref={flightsRef}>
            <CollapsibleSection title="Detalles de Vuelos" icon={Plane}>
              <div className="space-y-4">
                {formData.flights.map((flight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Vuelo {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Aerolínea</label>
                      <AirlineInput
                        value={flight.airline}
                        onSelect={(val) => handleFlightChange(index, { target: { name: 'airline', value: val, type: 'text' } })}
                        placeholder="Buscar aerol�nea"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría del Vuelo</label>
                      <select name="flightCategory" value={flight.flightCategory || ''} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Seleccionar</option>
                        <option value="economica">Económica</option>
                        <option value="premium_economica">Premium Económica</option>
                        <option value="business">Business</option>
                        <option value="primera_clase">Primera Clase</option>
                        {flight.flightCategory && !['', 'economica', 'premium_economica', 'business', 'primera_clase'].includes(flight.flightCategory) && (
                          <option value={flight.flightCategory}>{flight.flightCategory}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ciclo del Vuelo</label>
                      <select name="flightCycle" value={flight.flightCycle} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" >
                        {flightCycleOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {flight.flightCycle === 'other' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción Personalizada del Ciclo</label>
                        <input
                          type="text"
                          name="customFlightCycle"
                          value={flight.customFlightCycle || ''}
                          onChange={(e) => handleFlightChange(index, e)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                          placeholder="Ej: De A a B"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipaje Permitido</label>
                      <select name="baggageAllowance" value={flight.baggageAllowance || ''} onChange={(e) => handleFlightChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                        <option value="">Seleccionar</option>
                        <option value="personal_item">Artículo Personal (Bajo el Asiento)</option>
                        <option value="carry_on">Equipaje de Mano (Cabina, Compartimento Superior)</option>
                        <option value="1_checked_bag">1 maleta facturada (hasta 23kg)</option>
                        <option value="2_checked_bags">2 maletas facturadas (hasta 23kg c/u)</option>
                        <option value="heavy_bag">1 maleta facturada (hasta 32kg)</option>
                        <option value="no_baggage">Sin equipaje</option>
                        <option value="other">Otro (especificar en notas)</option>
                        {flight.baggageAllowance && !['', 'personal_item', 'carry_on', '1_checked_bag', '2_checked_bags', 'heavy_bag', 'no_baggage', 'other'].includes(flight.baggageAllowance) && (
                          <option value={flight.baggageAllowance}>{flight.baggageAllowance}</option>
                        )}
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
                            <div key={itIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end relative p-2 bg-gray-100 rounded-lg">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Número de Vuelo</label>
                                <input type="text" name="flightNumber" value={itinerary.flightNumber} onChange={(e) => handleItineraryChange(index, itIndex, e)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" placeholder="Ej: IB3100" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                                <input
                                  type="date"
                                  name="date"
                                  value={itinerary.date}
                                  onChange={(e) => handleItineraryChange(index, itIndex, e)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  min={tripMinDate}
                                  max={tripMaxDate}
                                />
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
            </div>
          )}

          {/* Hotels Section */}
          {showHotels && (
            <div ref={hotelsRef}>
          <CollapsibleSection title="Detalles de Hoteles" icon={Hotel}>
            <div className="space-y-4">
              {formData.hotels.map((hotel, index) => {
                const currentHotelTotalPassengers = (hotel.accommodation || []).reduce((acc, room) => {
                  return acc + (room.rooms * (room.adt || 0)) + (room.rooms * (room.chd || 0)) + (room.rooms * (room.inf || 0));
                }, 0);

                return (
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
                    <p className={`text-sm font-medium mt-2 ${currentHotelTotalPassengers === totalPassengersCalculated.total ? 'text-gray-600' : 'text-red-600'}`}>
                      Total de personas en acomodación: <span className="font-bold">{currentHotelTotalPassengers}</span>
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Alimentación</label>
                    <select name="mealPlan" value={hotel.mealPlan} onChange={(e) => handleHotelChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                      <option value="">Seleccionar</option>
                      <option value="PE">PE: SOLO ALOJAMIENTO</option>
                      <option value="PC">PC: SOLO DESAYUNO</option>
                      <option value="PAM">PAM: DESAYUNO Y CENA</option>
                      <option value="PA">PA: DESAYUNO, ALMUERZO Y CENA (1 MENÚ)</option>
                      <option value="PAE">PAE: DESAYUNO, ALMUERZO Y CENA TIPO BUFFET</option>
                      <option value="FULL">FULL: DESAYUNO, ALMUERZO Y CENA TIPO BUFFET + BAR ABIERTO + SNACKS</option>
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
                );
              })}
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
            </div>
           )}

          {/* Transfers Section */}
          <div ref={transfersRef}>
          <CollapsibleSection title="Traslados" icon={Car}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Indica si la reserva incluye traslados de llegada (IN) y/o salida (OUT). Los detalles de horarios se conocen a través de los itinerarios de vuelos.
              </p>

              {formData.tripType === 'multi_city' ? (
                // Modo múltiples ciudades: mostrar traslados por segmento
                <div className="space-y-4">
                  {formData.segments.map((segment, index) => (
                    <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <h5 className="font-semibold text-gray-800 mb-3">
                        Traslados - Segmento {index + 1}: {segment.origin || '...'} → {segment.destination || '...'}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                          <input
                            type="checkbox"
                            id={`transfer-in-${index}`}
                            checked={formData.transfers?.[index]?.hasIn || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              transfers: {
                                ...(prev.transfers || {}),
                                [index]: { ...(prev.transfers?.[index] || {}), hasIn: e.target.checked }
                              }
                            }))}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor={`transfer-in-${index}`} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 text-sm">
                            <PlaneLanding className="w-4 h-4 text-green-600" />
                            Traslado IN
                          </label>
                        </div>

                        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                          <input
                            type="checkbox"
                            id={`transfer-out-${index}`}
                            checked={formData.transfers?.[index]?.hasOut || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              transfers: {
                                ...(prev.transfers || {}),
                                [index]: { ...(prev.transfers?.[index] || {}), hasOut: e.target.checked }
                              }
                            }))}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <label htmlFor={`transfer-out-${index}`} className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 text-sm">
                            <PlaneTakeoff className="w-4 h-4 text-blue-600" />
                            Traslado OUT
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Modo ida y vuelta: un solo par de traslados
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="checkbox"
                      id="hasTransferIn"
                      checked={formData.transfers?.[0]?.hasIn || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        transfers: {
                          ...(prev.transfers || {}),
                          0: { ...(prev.transfers?.[0] || {}), hasIn: e.target.checked }
                        }
                      }))}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="hasTransferIn" className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                      <PlaneLanding className="w-5 h-5 text-green-600" />
                      Traslado de Llegada (IN)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <input
                      type="checkbox"
                      id="hasTransferOut"
                      checked={formData.transfers?.[0]?.hasOut || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        transfers: {
                          ...(prev.transfers || {}),
                          0: { ...(prev.transfers?.[0] || {}), hasOut: e.target.checked }
                        }
                      }))}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="hasTransferOut" className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                      <PlaneTakeoff className="w-5 h-5 text-blue-600" />
                      Traslado de Salida (OUT)
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
          </div>

          {/* Tours Section */}
          {showTours && (
            <div ref={toursRef}>
          <CollapsibleSection title="Servicios y Tours" icon={Ticket}>
            <div className="space-y-4">
              {errors.tours && (
                <p className="text-red-600 text-sm">{errors.tours}</p>
              )}
              {formData.tours.map((tour, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Servicio / Tour {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Servicio / Tour</label>
                      <input type="text" name="name" value={tour.name} onChange={(e) => handleTourChange(index, e)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Traslados, Tour por la ciudad" />
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
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          name="includeCost"
                          checked={tour.includeCost}
                          onChange={(e) => handleTourChange(index, e)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Incluir costo adicional por PAX</span>
                      </label>
                      {tour.includeCost && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Costo por PAX ({resolvedCurrency})</label>
                          <input
                            type="text"
                            name="cost"
                            value={formatNumberWithThousands(tour.cost)}
                            onChange={(e) => handleTourChange(index, e)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                            placeholder="0"
                          />
                        </div>
                      )}
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
                Añadir Servicio / Tour
              </motion.button>
            </div>
          </CollapsibleSection>
            </div>
          )}

          {/* Medical Assistance and Insurance Section */}
          {showMedical && (
            <div ref={medicalAssistanceRef}>
          <CollapsibleSection title="Asistencias Médicas y Seguros" icon={BriefcaseMedical}>
            <div className="space-y-4">
              {errors.medicalAssistances && (
                <p className="text-red-600 text-sm">{errors.medicalAssistances}</p>
              )}
              {formData.medicalAssistances.map((ma, index) => (
                <div key={index} className="p-6 border-2 border-gray-200 rounded-xl relative bg-gradient-to-br from-gray-50 to-white shadow-md">
                  <h4 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-200">
                    Asistencia / Seguro #{index + 1}
                  </h4>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2">
                        Tipo de Plan / Seguro
                      </label>
                      <select
                        name="planType"
                        value={ma.planType}
                        onChange={(e) => handleMedicalAssistanceChange(index, e)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="traditional_tourism">Turismo Tradicional</option>
                        <option value="international_assistance">Asistencia Internacional</option>
                        <option value="national_cancellation_insurance">Seguro de Cancelación Nacional</option>
                        <option value="international_cancellation_insurance">Seguro de Cancelación Internacional</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-semibold text-blue-900 mb-2">Resumen de Cobertura:</p>
                      <p className="text-sm text-blue-800">
                        Tipo: {
                          ma.planType === 'traditional_tourism' ? 'Turismo Tradicional' :
                          ma.planType === 'international_assistance' ? 'Asistencia Internacional' :
                          ma.planType === 'national_cancellation_insurance' ? 'Seguro de Cancelación Nacional' :
                          ma.planType === 'international_cancellation_insurance' ? 'Seguro de Cancelación Internacional' : ''
                        }
                      </p>
                      <p className="text-sm text-blue-800">
                        Duración: {calculateDaysBetweenDates(ma.startDate || tripDepartureDate, ma.endDate || tripReturnDate)} días
                      </p>
                    </div>
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
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusCircle className="w-5 h-5" />
                Añadir Asistencia / Seguro
              </motion.button>
            </div>
          </CollapsibleSection>
            </div>
          )}

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Detalles de la Reserva
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Adulto (ADT) ({resolvedCurrency})
                </label>
                <input
                  type="text"
                  name="pricePerADT"
                  value={formatNumberWithThousands(formData.pricePerADT)}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Niño (CHD) ({resolvedCurrency})
                </label>
                <input
                  type="text"
                  name="pricePerCHD"
                  value={formatNumberWithThousands(formData.pricePerCHD)}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio por Infante (INF) ({resolvedCurrency})
                </label>
                <input
                  type="text"
                  name="pricePerINF"
                  value={formatNumberWithThousands(formData.pricePerINF)}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <h4 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Total del Plan:
              </h4>
              <span className="text-2xl font-extrabold text-blue-800">{formatCurrencyValue(formData.totalAmount)}</span>
            </div>
            
            {/* Payment Option */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Opciones de Pago
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">Monto ({resolvedCurrency})</label>
                        <input
                          type="text"
                          name="amount"
                          value={formatNumberWithThousands(installment.amount)}
                          onChange={(e) => handleInstallmentChange(index, e)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="0"
                        />
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
                  <p className="text-sm font-semibold text-gray-800 mt-4">Total Cuotas: {formatCurrencyValue(totalInstallmentsAmount)}</p>
                  {totalInstallmentsAmount !== expectedInstallmentsTotal && (
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








