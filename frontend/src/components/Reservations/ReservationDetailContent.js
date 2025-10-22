import React, { useState, useEffect } from 'react';
import {
  Users,
  Hotel,
  Plane,
  HeartPulse,
  Sun,
  CreditCard,
  FileText,
  ListChecks,
  Paperclip,
  Loader2,
  MessageSquare,
  Bus,
  Download
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';
import { useAuth } from '../../pages/AuthContext';
import { formatUserName } from '../../utils/nameFormatter';
import { generateInvoice, saveDocumentRecord, buildInvoicePayload } from '../../utils/documentGenerator';
import api from '../../utils/api';

// Read-only Section
const InfoSection = ({ id, title, icon, children, gridColsClass = 'lg:grid-cols-3' }) => (
  <div id={id} className="py-5 px-6 border-b border-gray-200 last:border-b-0 scroll-mt-20">
    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3 mb-4">
      {icon}
      {title}
    </h3>
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-x-8 gap-y-4 text-base`}>
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


const ReservationDetailContent = ({ reservation, showAlert }) => {
    const { formatCurrency, formatDate, settings } = useSettings();
    const { currentUser } = useAuth();
    const [loadingDoc, setLoadingDoc] = useState(null);
    const [airlineNames, setAirlineNames] = useState({});

    const formatCurrencyCOP = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value || 0));

    const getSecureUrl = async (path) => {
        try {
            // ✅ SEGURO: userId se obtiene automáticamente del token JWT
            const response = await api.post('/files/get-secure-url', { path });
            return response.data.signedUrl;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'No se pudo obtener el enlace seguro.');
        }
    };

    const handleViewFile = async (path) => {
        if (!path) return showAlert('Error', 'La ruta del archivo no es válida.');
        setLoadingDoc(path);
        try {
            const secureUrl = await getSecureUrl(path);
            window.open(secureUrl, '_blank');
        } catch (error) {
            showAlert('Error al obtener documento', error.message);
        } finally {
            setLoadingDoc(null);
        }
    };

    const handleDownloadFile = async (path, filename) => {
        if (!path) return showAlert('Error', 'La ruta del archivo no es válida.');
        setLoadingDoc(path);
        try {
            const secureUrl = await getSecureUrl(path);
            const fileResponse = await fetch(secureUrl);
            if (!fileResponse.ok) {
                throw new Error('No se pudo descargar el archivo.');
            }
            const blob = await fileResponse.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename || path.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            showAlert('Error de Descarga', error.message);
        } finally {
            setLoadingDoc(null);
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            const invoicePayload = buildInvoicePayload(reservation._original);
            generateInvoice(invoicePayload);

            await saveDocumentRecord(
                reservation._original.id,
                'invoice',
                invoicePayload
            );

            showAlert('Exito', 'Factura generada correctamente');
        } catch (error) {
            console.error('Error generating invoice:', error);
            showAlert('Error', 'No se pudo generar la factura');
        }
    };

    const handleGenerateVoucher = async () => {
        try {
            // Aquí iría la lógica para generar voucher
            // Por ahora mostramos un mensaje
            showAlert('Info', 'Funcionalidad de voucher en desarrollo');
        } catch (error) {
            console.error('Error generating voucher:', error);
            showAlert('Error', 'No se pudo generar el voucher');
        }
    };

    const segments = reservation._original.reservation_segments || [];
    const passengersData = reservation._original.reservation_passengers || [];
    const hotelData = reservation._original.reservation_hotels || [];
    const flightData = reservation._original.reservation_flights || [];
    const tourData = reservation._original.reservation_tours || [];
    const assistanceData = reservation._original.reservation_medical_assistances || [];
    const attachmentData = reservation._original.reservation_attachments || [];
    const transferData = reservation._original.reservation_transfers || [];

    // Obtener el tipo de reserva
    const reservationType = reservation._original.reservation_type || 'all_inclusive';

    // Determinar qué secciones mostrar según el tipo de reserva
    const showFlights = reservationType === 'all_inclusive' || reservationType === 'flights_only';
    const showHotels = reservationType === 'all_inclusive' || reservationType === 'hotel_only';
    const showTours = reservationType === 'all_inclusive' || reservationType === 'tours_only';
    const showMedical = reservationType === 'all_inclusive' || reservationType === 'medical_assistance';
    const showTransfers = reservationType === 'all_inclusive' || reservationType === 'flights_only' || reservationType === 'hotel_only';
    
    const getAirlineCode = (flight) => {
        if (!flight) {
            return '';
        }
        if (flight.airline_code) {
            return String(flight.airline_code).trim().toUpperCase();
        }
        if (flight.airlineCode) {
            return String(flight.airlineCode).trim().toUpperCase();
        }
        if (typeof flight.airline === 'string') {
            const trimmed = flight.airline.trim();
            if (!trimmed) {
                return '';
            }
            const match = trimmed.match(/\((\w{2,3})\)$/);
            if (match) {
                return match[1].toUpperCase();
            }
            const upper = trimmed.toUpperCase();
            if (/^[A-Z0-9]{2,3}$/.test(upper)) {
                return upper;
            }
        }
        return '';
    };

    const hasAirlineName = (flight) => {
        if (!flight) {
            return false;
        }
        if (typeof flight.airline === 'object' && flight.airline) {
            if (flight.airline.name || flight.airline.fullName || flight.airline.label) {
                return true;
            }
        }
        const nameFields = [flight.airline_name, flight.airlineName, flight.airline_full_name];
        if (nameFields.some((value) => value && String(value).trim().length > 0)) {
            return true;
        }
        if (typeof flight.airline === 'string') {
            const trimmed = flight.airline.trim();
            if (trimmed.length > 3 || trimmed.includes(' ') || (trimmed.includes('(') && trimmed.includes(')'))) {
                return true;
            }
        }
        return false;
    };

    const formatLabelValue = (value) => {
        if (!value) {
            return '';
        }
        if (typeof value !== 'string') {
            return String(value);
        }
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        if (!trimmed.includes('_')) {
            return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        }
        return trimmed
            .split('_')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const formatBaggageInfo = (value) => {
        if (!value) {
            return '';
        }
        if (Array.isArray(value)) {
            return value.filter(Boolean).join(', ');
        }
        if (typeof value === 'object') {
            const { description, label, name } = value;
            if (label) {
                return String(label);
            }
            if (name) {
                return String(name);
            }
            if (description) {
                return String(description);
            }
            return Object.values(value)
                .filter((item) => typeof item === 'string' && item.trim().length > 0)
                .join(', ');
        }
        return String(value);
    };

    const formatDateValue = (value) => {
        if (!value) {
            return '';
        }
        const dateObj = value instanceof Date ? value : new Date(value);
        if (!Number.isNaN(dateObj.getTime())) {
            return formatDate(dateObj.toISOString());
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed || /^\d{2}:\d{2}/.test(trimmed)) {
                return '';
            }
            const isoCandidate = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
            const parsed = new Date(isoCandidate);
            if (!Number.isNaN(parsed.getTime())) {
                return formatDate(parsed.toISOString());
            }
        }
        return '';
    };

    const formatTimeValue = (value) => {
        if (!value) {
            return '';
        }
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        };
        if (settings?.timezone) {
            timeOptions.timeZone = settings.timezone;
        }
        if (value instanceof Date) {
            return new Intl.DateTimeFormat('es-ES', timeOptions).format(value);
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) {
                return '';
            }
            if (trimmed.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
                const date = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));
                if (!Number.isNaN(date.getTime())) {
                    return new Intl.DateTimeFormat('es-ES', timeOptions).format(date);
                }
            }
            const match = trimmed.match(/(\d{2}:\d{2})/);
            if (match) {
                return match[1];
            }
        }
        return '';
    };

    const getItineraryDetails = (itinerary) => {
        if (!itinerary) {
            return {
                flightNumber: 'No especificado',
                dateLabel: '',
                departureTimeLabel: '',
                arrivalTimeLabel: '',
            };
        }
        const flightNumber = itinerary.flightNumber || itinerary.flight_number || itinerary.number || 'No especificado';
        const dateLabel = formatDateValue(
            itinerary.date ||
            itinerary.departureDate ||
            itinerary.departure_date ||
            itinerary.departureTime ||
            itinerary.departure_time
        );
        const departureTimeLabel = formatTimeValue(itinerary.departureTime || itinerary.departure_time);
        const arrivalTimeLabel = formatTimeValue(itinerary.arrivalTime || itinerary.arrival_time);
        return {
            flightNumber,
            dateLabel,
            departureTimeLabel,
            arrivalTimeLabel,
        };
    };

    const getAirlineDisplayName = (flight) => {
        if (!flight) {
            return 'No especificado';
        }
        const nameFields = [flight.airline_name, flight.airlineName, flight.airline_full_name];
        const foundName = nameFields.find((value) => value && String(value).trim().length > 0);
        if (foundName) {
            return String(foundName).trim();
        }
        if (typeof flight.airline === 'object' && flight.airline) {
            if (flight.airline.name) {
                return String(flight.airline.name);
            }
            if (flight.airline.fullName) {
                return String(flight.airline.fullName);
            }
            if (flight.airline.label) {
                return String(flight.airline.label);
            }
        }
        if (typeof flight.airline === 'string') {
            const trimmed = flight.airline.trim();
            if (!trimmed) {
                return 'No especificado';
            }
            if (trimmed.includes('(')) {
                const namePart = trimmed.split('(')[0].trim();
                if (namePart) {
                    return namePart;
                }
            }
            if (trimmed.length > 3) {
                return trimmed;
            }
        }
        const code = getAirlineCode(flight);
        if (code && airlineNames[code]) {
            return airlineNames[code];
        }
        if (code) {
            return `Nombre no disponible (codigo ${code})`;
        }
        return 'No especificado';
    };

    useEffect(() => {
        const codesToFetch = new Set();

        (flightData || []).forEach((flight) => {
            if (hasAirlineName(flight)) {
                return;
            }
            const code = getAirlineCode(flight);
            if (code && !airlineNames[code]) {
                codesToFetch.add(code);
            }
        });

        if (codesToFetch.size === 0) {
            return;
        }

        let isActive = true;

        const fetchAirlineNames = async () => {
            const results = await Promise.all(
                Array.from(codesToFetch).map(async (code) => {
                    try {
                        const response = await api.get('/airlines/search', {
                            params: { q: code }
                        });
                        const data = response.data;

                        if (!Array.isArray(data)) {
                            return { code, name: null };
                        }
                        const exactMatch = data.find(
                            (item) => item && item.iata_code && item.iata_code.toUpperCase() === code
                        );
                        return { code, name: exactMatch ? exactMatch.name : null };
                    } catch (error) {
                        console.error('Failed to fetch airline name for code', code, error);
                        return { code, name: null };
                    }
                })
            );

            if (!isActive) {
                return;
            }

            setAirlineNames((prev) => {
                const updated = { ...prev };
                let hasChanges = false;
                results.forEach(({ code, name }) => {
                    if (name && !updated[code]) {
                        updated[code] = name;
                        hasChanges = true;
                    }
                });
                return hasChanges ? updated : prev;
            });
        };

        fetchAirlineNames();

        return () => {
            isActive = false;
        };
    }, [flightData, airlineNames]);

    const paymentOption = reservation._original.payment_option;
    const installments = reservation._original.installments || reservation._original.reservation_installments || [];
    const totalInstallmentsAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);

    // Calcular el monto pagado basado en las cuotas (funciona tanto para pago total como cuotas)
    const paidAmountFromInstallments = installments
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + (inst.amount || 0), 0);

    // Para pagos completos, verificar múltiples estados posibles
    let paidAmount = 0;
    if (paymentOption === 'full_payment') {
        const paymentStatus = reservation._original.payment_status;

        // Primero verificar el estado desde las cuotas (más confiable)
        if (installments.length > 0) {
            paidAmount = paidAmountFromInstallments;
        }
        // Si no hay cuotas, verificar el payment_status de la reserva
        else if (paymentStatus === 'paid' || paymentStatus === 'completed' || paymentStatus === 'confirmed') {
            paidAmount = reservation._original.total_amount;
        }
        // Si está pendiente o no tiene estado, verificar si hay una fecha de pago
        else if (paymentStatus === 'pending' || !paymentStatus) {
            if (reservation._original.payment_date) {
                paidAmount = reservation._original.total_amount;
            }
        }
    } else {
        paidAmount = paidAmountFromInstallments;
    }

    const totalAmount = paymentOption === 'full_payment' ? reservation._original.total_amount : totalInstallmentsAmount;
    const progress = totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0;

    const getStatusLabel = (status) => {
        switch (status) {
        case 'paid':
        case 'completed':
        case 'confirmed':
            return 'Pagada';
        case 'overdue':
        case 'late':
            return 'Atrasada';
        case 'pending':
            return 'Pendiente';
        default:
            return status || 'Pendiente';
        }
    };

    return (
        <>
            {reservation._original.advisor?.name && (
                <div className="py-4 px-6 border-b border-gray-200 bg-white">
                    <p className="text-gray-500 font-medium">Asesor</p>
                    <p className="text-gray-900">{formatUserName(reservation._original.advisor.name)}</p>
                </div>
            )}
            <InfoSection id="info-basica" title="Información Básica" icon={<FileText className="w-5 h-5 text-blue-600" />} gridColsClass="lg:grid-cols-2">
                <InfoItem label="Cliente" value={reservation.clientName} />
                <InfoItem label="Identificación" value={reservation.clientId} />
                <InfoItem label="Lugar de Expedición" value={reservation._original.clients?.id_card_issued_place} />
                <InfoItem label="Email" value={reservation.clientEmail} />
                <InfoItem label="Teléfono" value={reservation.clientPhone} />
                <InfoItem label="Dirección" value={reservation._original.clients?.address} />
                <InfoItem label="Contacto de Emergencia" value={reservation._original.clients?.emergency_contact_name} />
                <InfoItem label="Tel. Emergencia" value={reservation._original.clients?.emergency_contact_phone} />
                {segments.length > 0 && (
                    <div className="col-span-full grid gap-4">
                        {segments.map((segment, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-3">
                                <div>
                                    <p className="text-gray-500 font-medium">{`Tramo ${index + 1}`}</p>
                                    <p className="text-gray-900">{segment.origin} - {segment.destination}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">Salida</p>
                                    <p className="text-gray-900">{formatDate(segment.departure_date)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 font-medium">Regreso</p>
                                    <p className="text-gray-900">{formatDate(segment.return_date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </InfoSection>

            <InfoSection id="pasajeros" title="Pasajeros" icon={<Users className="w-5 h-5 text-green-600" />}>
                <InfoItem label="Adultos" value={reservation._original.passengers_adt} />
                <InfoItem label="Niños" value={reservation._original.passengers_chd} />
                <InfoItem label="Infantes" value={reservation._original.passengers_inf} />
                <div className="col-span-full">
                    {(passengersData || []).map((pax, index) => (
                        <div key={index} className="text-base p-2 bg-gray-50 rounded-md mt-2">{pax.name} {pax.lastname} ({pax.document_type}: {pax.document_number})</div>
                    ))}
                </div>
            </InfoSection>

            {showFlights && (
                <InfoSection id="vuelos" title="Itinerario y Vuelos" icon={<Plane className="w-5 h-5 text-indigo-600" />}>
                    {(flightData || []).length > 0 ? (flightData || []).map((flight, index) => {
                        const airlineName = getAirlineDisplayName(flight);
                        const baggageInfo = formatBaggageInfo(flight.baggageAllowance || flight.baggage_allowance || flight.baggage);
                        const flightCategory = formatLabelValue(flight.flightCategory || flight.flight_category);
                        const flightCycle = flight.customFlightCycle || formatLabelValue(flight.flightCycle || flight.flight_cycle);
                        const itineraries = flight.reservation_flight_itineraries || flight.itineraries || [];
                        return (
                            <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg space-y-3">
                                <div className="grid gap-y-1 md:grid-cols-2 md:gap-x-6">
                                    <p><strong>Aerolinea:</strong> {airlineName}</p>
                                    <p><strong>PNR:</strong> {flight.pnr || flight.record_locator || 'No especificado'}</p>
                                    {flightCategory && <p><strong>Categoria:</strong> {flightCategory}</p>}
                                    {flightCycle && <p><strong>Ciclo del vuelo:</strong> {flightCycle}</p>}
                                    {baggageInfo && <p><strong>Equipaje:</strong> {baggageInfo}</p>}
                                </div>
                                {itineraries.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200 space-y-2">
                                        <p className="font-semibold text-gray-700">Itinerarios</p>
                                        {itineraries.map((itinerary, itineraryIndex) => {
                                            const { flightNumber, dateLabel, departureTimeLabel, arrivalTimeLabel } = getItineraryDetails(itinerary);
                                            return (
                                                <div key={itineraryIndex} className="pl-4 border-l border-gray-200 text-sm text-gray-700 space-y-1">
                                                    <p><strong>Numero de vuelo:</strong> {flightNumber}</p>
                                                    <p><strong>Fecha:</strong> {dateLabel || 'No especificada'}</p>
                                                    <p><strong>Salida:</strong> {departureTimeLabel || 'No especificada'}</p>
                                                    <p><strong>Llegada:</strong> {arrivalTimeLabel || 'No especificada'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }) : <InfoItem label="Vuelos" value="No hay vuelos registrados." fullWidth />}
                </InfoSection>
            )}


            {showHotels && (
                <InfoSection id="hoteles" title="Hoteles" icon={<Hotel className="w-5 h-5 text-yellow-600" />}>
                    {(hotelData || []).length > 0 ? (hotelData || []).map((hotel, index) => (
                        <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg space-y-1">
                            <p><strong>Nombre:</strong> {hotel.name}</p>
                            {hotel.room_category && <p><strong>Categoría:</strong> {hotel.room_category}</p>}
                            {hotel.meal_plan && <p><strong>Plan de Comidas:</strong> {hotel.meal_plan}</p>}
                            {hotel.check_in_date && <p><strong>Check-in:</strong> {formatDate(hotel.check_in_date)}</p>}
                            {hotel.check_out_date && <p><strong>Check-out:</strong> {formatDate(hotel.check_out_date)}</p>}
                            {(hotel.accommodation || hotel.reservation_hotel_accommodations)?.length > 0 && (
                                <div className="pl-4">
                                    {((hotel.accommodation || hotel.reservation_hotel_accommodations) || []).map((acc, i) => (
                                        <p key={i}>Habitaciones: {acc.rooms}, ADT {acc.adt}, CHD {acc.chd}, INF {acc.inf}</p>
                                    ))}
                                </div>
                            )}
                            {(hotel.hotelInclusions || hotel.reservation_hotel_inclusions)?.length > 0 && (
                                <ul className="pl-6 list-disc">
                                    {((hotel.hotelInclusions || hotel.reservation_hotel_inclusions) || []).map((inc, i) => (
                                        <li key={i}>{typeof inc === 'string' ? inc : inc.inclusion}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )) : <InfoItem label="Hoteles" value="No hay hoteles registrados." fullWidth />}
                </InfoSection>
            )}

            {showTransfers && (
                <InfoSection id="traslados" title="Traslados" icon={<Bus className="w-5 h-5 text-teal-600" />}>
                    {(transferData || []).length > 0 ? (
                        <div className="col-span-full space-y-3">
                            {segments.map((segment, segmentIndex) => {
                                const segmentTransfers = transferData.filter(t => t.segment_id === segment.id);
                                if (segmentTransfers.length === 0) return null;

                                return (
                                    <div key={segmentIndex} className="text-base p-3 bg-gray-50 rounded-lg">
                                        <p className="font-semibold text-gray-700 mb-2">
                                            Tramo {segmentIndex + 1}: {segment.origin} - {segment.destination}
                                        </p>
                                        <div className="space-y-2 pl-4">
                                            {segmentTransfers.map((transfer, idx) => (
                                                <div key={idx} className="text-sm">
                                                    <p><strong>Tipo:</strong> {transfer.transfer_type === 'arrival' ? 'Llegada (In)' : 'Salida (Out)'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <InfoItem label="Traslados" value="No hay traslados registrados." fullWidth />}
                </InfoSection>
            )}

            {showTours && (
                <InfoSection id="tours" title="Servicios y Tours" icon={<Sun className="w-5 h-5 text-orange-600" />}>
                    {(tourData || []).length > 0 ? (tourData || []).map((tour, index) => (
                        <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg">
                            <p><strong>Nombre:</strong> {tour.name}</p>
                            {tour.date && <p><strong>Fecha:</strong> {formatDate(tour.date)}</p>}
                            {tour.cost && <p><strong>Costo:</strong> {formatCurrency(tour.cost)}</p>}
                        </div>
                    )) : <InfoItem label="Tours" value="No hay tours registrados." fullWidth />}
                </InfoSection>
            )}

            {showMedical && (
                <InfoSection id="asistencias" title="Asistencias Médicas" icon={<HeartPulse className="w-5 h-5 text-red-600" />}>
                    {(assistanceData || []).length > 0 ? (assistanceData || []).map((med, index) => (
                        <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg">
                            <p><strong>Plan:</strong> {med.plan_type || med.planType}</p>
                            <p><strong>Vigencia:</strong> {formatDate(med.start_date || med.startDate)} - {formatDate(med.end_date || med.endDate)}</p>
                        </div>
                    )) : <InfoItem label="Asistencias" value="No hay asistencias médicas." fullWidth />}
                </InfoSection>
            )}

            <InfoSection id="pago" title="Pago" icon={<CreditCard className="w-5 h-5 text-purple-600" />}>
                <InfoItem label="Precio ADT" value={formatCurrencyCOP(reservation._original.price_per_adt)} />
                <InfoItem label="Precio CHD" value={formatCurrencyCOP(reservation._original.price_per_chd)} />
                <InfoItem label="Precio INF" value={formatCurrencyCOP(reservation._original.price_per_inf)} />
                {reservation._original.surcharge > 0 && (
                    <InfoItem label="Recargo Adicional" value={formatCurrencyCOP(reservation._original.surcharge)} />
                )}
                <InfoItem label="Total" value={formatCurrencyCOP(reservation._original.total_amount)} />
                <InfoItem label="Opción" value={reservation._original.payment_option === 'full_payment' ? 'Pago completo' : 'Cuotas'} />
                {(reservation._original.installments || []).map((inst, index) => (
                    <InfoItem key={`inst-${index}`} label={`Cuota ${index + 1}`} value={`${formatCurrencyCOP(inst.amount)} - ${formatDate(inst.due_date || inst.dueDate)}`} fullWidth />
                ))}
            </InfoSection>

            <InfoSection id="plan-pagos" title="Plan de pagos (Cuotas)" icon={<ListChecks className="w-5 h-5 text-emerald-600" />}>
            {paymentOption === 'full_payment' ? (
                <>
                <InfoItem label="Fecha de pago" value={formatDate(installments[0]?.due_date || reservation._original.payment_date || reservation._original.created_at)} />
                <InfoItem label="Valor" value={formatCurrencyCOP(reservation._original.total_amount)} />
                <InfoItem label="Estado" value={getStatusLabel(installments[0]?.status || reservation._original.payment_status)} />
                {installments[0]?.payment_date && (
                    <InfoItem label="Fecha de pago confirmado" value={formatDate(installments[0].payment_date)} />
                )}
                </>
            ) : (
                <div className="col-span-full overflow-x-auto">
                <table className="min-w-full text-base">
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
                        <td className="py-1 pr-4">{formatCurrencyCOP(inst.amount)}</td>
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
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Pagado: {formatCurrencyCOP(paidAmount)}</span>
                <span>Total: {formatCurrencyCOP(totalAmount)}</span>
                </div>
            </div>
            </InfoSection>

            <InfoSection id="observaciones" title="Observaciones" icon={<MessageSquare className="w-5 h-5 text-gray-600" />}>
                <InfoItem value={reservation._original.notes} fullWidth />
            </InfoSection>

            <InfoSection id="adjuntos" title="Documentos Adjuntos" icon={<Paperclip className="w-5 h-5 text-gray-600" />}>
                {(attachmentData || []).length > 0 ? (
                    <div className="col-span-full space-y-4">
                        {(attachmentData || []).map((doc, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                                    {doc.observation && <p className="text-gray-600 mt-1 italic text-sm">{doc.observation}</p>}
                                </div>
                                {doc.file_url && (
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <button 
                                            onClick={() => handleViewFile(doc.file_url)}
                                            disabled={loadingDoc === doc.file_url}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center"
                                        >
                                            {loadingDoc === doc.file_url && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
                                            Ver
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadFile(doc.file_url, doc.file_name)}
                                            disabled={loadingDoc === doc.file_url}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-300 flex items-center"
                                        >
                                            {loadingDoc === doc.file_url && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
                                            Descargar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <InfoItem label="Documentos" value="No hay documentos adjuntos." fullWidth />
                )}
            </InfoSection>
        </>
    );
};

export default ReservationDetailContent;
