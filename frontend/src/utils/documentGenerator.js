/**
 * Utilidad para generar documentos (facturas, vouchers, etc.)
 * Abre la plantilla HTML en una nueva ventana y le pasa los datos
 */

/**
 * Genera una factura a partir de los datos de una reserva
 * @param {Object} reservationData - Datos completos de la reserva
 */
export const generateInvoice = (reservationData) => {
  const templateUrl = '/templates/InvoiceTemplate.html';
  const newWindow = window.open(templateUrl, '_blank', 'width=900,height=1100');

  if (!newWindow) {
    alert('Por favor, permite ventanas emergentes para generar documentos');
    return;
  }

  // Esperar a que la plantilla cargue
  newWindow.addEventListener('load', () => {
    try {
      // Transformar datos de la reserva al formato esperado por la plantilla
      const invoiceData = transformReservationToInvoice(reservationData);

      // Debug: mostrar datos en consola
      console.log('Reservation Data:', reservationData);
      console.log('Invoice Data:', invoiceData);

      // Llamar a la función renderInvoice de la plantilla
      if (typeof newWindow.renderInvoice === 'function') {
        newWindow.renderInvoice(invoiceData);
      } else {
        console.error('La plantilla no tiene la función renderInvoice');
      }
    } catch (error) {
      console.error('Error al generar factura:', error);
    }
  });
};

/**
 * Genera un voucher (puedes crear otra plantilla HTML similar)
 * @param {Object} reservationData - Datos completos de la reserva
 */
export const generateVoucher = (reservationData) => {
  const templateUrl = '/templates/VoucherTemplate.html';
  const newWindow = window.open(templateUrl, '_blank', 'width=900,height=1100');

  if (!newWindow) {
    alert('Por favor, permite ventanas emergentes para generar documentos');
    return;
  }

  newWindow.addEventListener('load', () => {
    try {
      const voucherData = transformReservationToVoucher(reservationData);
      if (typeof newWindow.renderVoucher === 'function') {
        newWindow.renderVoucher(voucherData);
      }
    } catch (error) {
      console.error('Error al generar voucher:', error);
    }
  });
};

/**
 * Transforma los datos de la reserva al formato esperado por InvoiceTemplate.html
 * @param {Object} reservation - Datos de la reserva desde la BD
 * @returns {Object} - Objeto con formato compatible con la plantilla
 */
const transformReservationToInvoice = (reservation) => {
  // Obtener datos de segmentos
  const firstSegment = reservation.reservation_segments?.[0] || {};

  // Obtener datos del cliente
  const client = reservation.clients || {};

  // Obtener datos de hotel
  const hotel = reservation.reservation_hotels?.[0] || {};
  const hotelAccommodations = hotel?.reservation_hotel_accommodations || [];
  const hotelInclusions = hotel?.reservation_hotel_inclusions || [];

  // Obtener datos de vuelo
  const flight = reservation.reservation_flights?.[0] || {};
  const flightItineraries = flight?.reservation_flight_itineraries || [];

  // Obtener asistencia médica
  const assistance = reservation.reservation_medical_assistances?.[0] || {};

  // Obtener traslados
  const transfers = reservation.reservation_transfers?.[0] || {};

  // Obtener tours
  const tours = reservation.reservation_tours || [];

  // Calcular noches y días
  const nights = calculateNights(firstSegment.departure_date, firstSegment.return_date);
  const days = nights > 0 ? nights + 1 : 0;

  // Formatear traslados
  let trasladosText = null;
  if (transfers) {
    if (transfers.transfer_in && transfers.transfer_out) {
      trasladosText = "Aeropuerto ↔ Hotel (In/Out)";
    } else if (transfers.transfer_in) {
      trasladosText = "Solo entrada (In)";
    } else if (transfers.transfer_out) {
      trasladosText = "Solo salida (Out)";
    }
  }

  // Formatear equipaje
  let equipajeText = null;
  if (flight) {
    const baggage = [];
    if (flight.cabin_baggage) baggage.push(`Cabina: ${flight.cabin_baggage}`);
    if (flight.checked_baggage) baggage.push(`Bodega: ${flight.checked_baggage}`);
    if (baggage.length > 0) {
      equipajeText = baggage.join(' · ');
    }
  }

  // Formatear acomodación del hotel
  const accommodationText = hotelAccommodations.length > 0
    ? hotelAccommodations.map(acc => acc.accommodation_type || acc.type).filter(Boolean).join(', ')
    : null;

  // Formatear tipo de habitación
  const roomTypeText = hotelAccommodations.length > 0
    ? hotelAccommodations.map(acc => acc.room_type).filter(Boolean).join(', ')
    : null;

  // Formatear plan de alimentación (board type)
  const boardTypeText = hotelInclusions.length > 0
    ? hotelInclusions.map(inc => inc.inclusion_type || inc.board_type).filter(Boolean).join(', ')
    : null;

  // Obtener aerolínea
  const airlineName = flight?.airline_name ||
    (flightItineraries.length > 0 ? flightItineraries[0].airline : null);

  // Obtener clase de vuelo
  const flightClass = flight?.flight_class || flight?.class || null;

  // Formatear tours
  const toursText = tours.length > 0
    ? tours.map(t => t.tour_name || t.name).filter(Boolean).join(', ')
    : null;

  // Obtener business settings
  const businessSettings = reservation.business_settings || {};
  const contactInfo = businessSettings.contact_info || {};

  console.log('=== DEBUG DOCUMENT GENERATOR ===');
  console.log('reservation.business_settings:', reservation.business_settings);
  console.log('businessSettings:', businessSettings);
  console.log('businessSettings.logo_url:', businessSettings.logo_url);

  return {
    settings: {
      agency_name: businessSettings.agency_name || "Dream Vacation",
      legal_name: businessSettings.legal_name || "GROUP VC SAS",
      logo_url: businessSettings.logo_url || "",
      tax_id_number: businessSettings.tax_id_number || "901704831-4",
      tax_regime: businessSettings.tax_regime || "Régimen Fiscal",
      tourism_registry_number: businessSettings.tourism_registry_number || "RNT 96518",
      contact_info: {
        email: contactInfo.email || "contactanos@dreamvacation.com.co",
        mobile: contactInfo.mobile || contactInfo.phone || "(+57) 3116379323",
        website: contactInfo.website || "www.dreamvacation.com.co",
        addresses: contactInfo.addresses || [
          "Calle 19 #30-16 Las Cuadras, Pasto - Nariño",
          "Ipiales: C.C. Zafiro Of.124"
        ]
      },
      invoice_message: businessSettings.invoice_message || "Medio de pago: Efectivo / Transferencia.",
      terms_and_conditions: businessSettings.terms_and_conditions || "",
      contract_message: businessSettings.contract_message || "",
      default_footer: businessSettings.default_footer || "Agencia Mayorista de Viajes y Turismo"
    },
    invoice: {
      number: reservation.invoice_number || "SIN-NUM",
      issueDate: formatDate(reservation.confirmed_at || reservation.created_at || new Date()),
      currency: "COP"
    },
    client: {
      name: client.name ? `${client.name} ${client.last_name || ''}`.trim() : "—",
      idType: "CC",
      idNumber: client.id_card || "—",
      phone: client.phone || "—",
      email: client.email || "—",
      address: client.address || "—"
    },
    emergencyContact: {
      name: client.emergency_contact_name || "—",
      phone: client.emergency_contact_phone || "—"
    },
    reservation: {
      origin: firstSegment.origin || "—",
      destination: firstSegment.destination || "—",
      travelCycle: formatTravelCycle(firstSegment.departure_date, firstSegment.return_date),
      nights: nights,
      days: days,
      pax: {
        ADT: reservation.passengers_adt || 0,
        CHD: reservation.passengers_chd || 0,
        INF: reservation.passengers_inf || 0
      },
      hotel: hotel.hotel_name || null,
      roomType: roomTypeText || null,
      boardType: boardTypeText || null,
      traslados: trasladosText,
      equipaje: equipajeText,
      asistenciaMedica: assistance.assistance_name || assistance.provider_name || null,
      aerolineas: airlineName,
      // Campos adicionales
      acomodacion: accommodationText,
      claseVuelo: flightClass,
      tours: toursText
    },
    items: generateDefaultItems(reservation, firstSegment),
    installments: reservation.reservation_installments || [],
    legalText: ""
  };
};

/**
 * Calcula las noches entre dos fechas
 */
const calculateNights = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) return 0;
  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);
  const diffTime = Math.abs(returnD - departure);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Transforma datos para voucher (ajustar según necesidades)
 */
const transformReservationToVoucher = (reservation) => {
  // Similar a transformReservationToInvoice pero con campos específicos del voucher
  return {
    // ... estructura para voucher
  };
};

/**
 * Formatea una fecha a DD/MM/YYYY
 */
const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatea el ciclo de viaje
 */
const formatTravelCycle = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) return null;
  return `Ida ${formatDate(departureDate)} · Regreso ${formatDate(returnDate)}`;
};

/**
 * Genera items por defecto si no vienen de la BD
 */
const generateDefaultItems = (reservation, segment) => {
  const items = [];
  const destination = segment?.destination || "—";

  // Items de pasajeros
  if (reservation.passengers_adt && reservation.price_per_adt) {
    items.push({
      description: `Plan ${destination} (ADT)`,
      quantity: reservation.passengers_adt,
      unitPrice: reservation.price_per_adt
    });
  }

  if (reservation.passengers_chd && reservation.price_per_chd) {
    items.push({
      description: `Plan ${destination} (CHD)`,
      quantity: reservation.passengers_chd,
      unitPrice: reservation.price_per_chd
    });
  }

  if (reservation.passengers_inf && reservation.price_per_inf) {
    items.push({
      description: `Plan ${destination} (INF)`,
      quantity: reservation.passengers_inf,
      unitPrice: reservation.price_per_inf
    });
  }

  // Fee bancario u otros cargos adicionales
  if (reservation.banking_fee && reservation.banking_fee > 0) {
    items.push({
      description: "Fee bancario",
      quantity: 1,
      unitPrice: reservation.banking_fee
    });
  }

  return items;
};

/**
 * Guarda el documento generado en la BD
 * @param {string} reservationId - ID de la reserva
 * @param {string} documentType - Tipo de documento (invoice, voucher, etc.)
 * @param {Object} documentData - Datos del documento para almacenar
 */
export const saveDocumentRecord = async (reservationId, documentType, documentData) => {
  try {
    const response = await fetch('http://localhost:4000/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        type: documentType,
        data_snapshot: documentData,
        generated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Error al guardar registro del documento');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving document record:', error);
    throw error;
  }
};
