/**
 * Utilidad para generar documentos (facturas, vouchers, etc.).
 * Abre la plantilla HTML en una nueva ventana y le pasa los datos
 * en el formato que la plantilla espera.
 */

const INVOICE_TEMPLATE_VERSION = '2024.06';

export const generateInvoice = (rawData) => {
  const templateUrl = '/templates/InvoiceTemplate.html';
  const newWindow = window.open(templateUrl, '_blank', 'width=900,height=1100');

  if (!newWindow) {
    alert('Por favor, permite ventanas emergentes para generar documentos');
    return;
  }

  newWindow.addEventListener('load', () => {
    try {
      const invoiceData = ensureInvoicePayload(rawData);

      if (!invoiceData) {
        throw new Error('No se pudo preparar la información necesaria de la reserva.');
      }

      if (typeof newWindow.renderInvoice === 'function') {
        newWindow.renderInvoice(invoiceData);
      } else {
        throw new Error('La plantilla de factura no expone la función renderInvoice.');
      }
    } catch (error) {
      console.error('Error al generar factura:', error);
      newWindow.document.body.innerHTML = `
        <div style="font-family: sans-serif; padding: 24px;">
          <h2>Error al generar la factura</h2>
          <p>${error.message}</p>
          <p>Revisa la consola para más detalles.</p>
        </div>
      `;
    }
  });
};

export const buildInvoicePayload = (rawData) => {
  const payload = ensureInvoicePayload(rawData);

  if (!payload) {
    throw new Error('No se pudo construir la información de la factura.');
  }

  return payload;
};

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

export const saveDocumentRecord = async (reservationId, documentType, documentData) => {
  try {
    let snapshot = documentData;

    if (documentType === 'invoice') {
      snapshot = ensureInvoicePayload(documentData);

      if (!snapshot) {
        throw new Error('No se pudo preparar los datos de la factura para guardar.');
      }
    }

    const response = await fetch('http://localhost:4000/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        type: documentType,
        data_snapshot: snapshot,
        generated_at: new Date().toISOString(),
      }),
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

const ensureInvoicePayload = (input) => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  if (isInvoicePayload(input)) {
    return input;
  }

  const reservation = extractReservationObject(input);

  if (!reservation || typeof reservation !== 'object') {
    return null;
  }

  return buildInvoicePayloadFromReservation(reservation);
};

const buildInvoicePayloadFromReservation = (reservation) => {
  const settings = reservation.business_settings || {};
  const contactInfo = typeof settings.contact_info === 'object' && settings.contact_info !== null
    ? settings.contact_info
    : {};

  const client = reservation.clients || {};
  const advisor = reservation.advisor || reservation.advisors || reservation.advisor_id || reservation.user || null;

  const segments = normalizeArray(reservation.reservation_segments);
  const travelSegments = buildTravelSegments(segments);
  const primaryTravelSegment = travelSegments[0] || segments[0] || {};

  const hotels = normalizeArray(reservation.reservation_hotels);
  const hotelSegments = buildHotelSegments(hotels);
  const mainHotel = hotels[0] || {};
  const accommodations = mapHotelAccommodationList(mainHotel.reservation_hotel_accommodations);
  const aggregatedHotelAccommodations = hotelSegments.flatMap((seg) => normalizeArray(seg.accommodations));
  const hotelAccommodationsSource = accommodations.length ? accommodations : aggregatedHotelAccommodations;
  const hotelAccommodations = hotelAccommodationsSource.map((item, index) => ({
    ...item,
    index: index + 1,
  }));

  const flights = normalizeArray(reservation.reservation_flights);
  const flightSegments = buildFlightSegments(flights);
  const mainFlight = flights[0] || {};
  const itineraries = normalizeArray(mainFlight.reservation_flight_itineraries);
  const flattenedFlightLegs = flightSegments.flatMap((segment) => normalizeArray(segment.itineraries));

  const transfers = normalizeArray(reservation.reservation_transfers);
  const tours = normalizeArray(reservation.reservation_tours);
  const assistanceList = normalizeArray(reservation.reservation_medical_assistances);
  const passengerList = normalizeArray(reservation.reservation_passengers);
  const installments = normalizeArray(reservation.reservation_installments);

  const currency = resolveCurrency(settings.currency || reservation.currency);
  const paymentLines = buildPaymentLines(reservation);
  const subtotal = sumLineItems(paymentLines);
  const totalAmount = normalizeNumber(reservation.total_amount) || subtotal;
  const totalPassengers =
    normalizeNumber(reservation.passengers_adt) +
    normalizeNumber(reservation.passengers_chd) +
    normalizeNumber(reservation.passengers_inf);

  return {
    meta: {
      documentType: 'invoice',
      version: INVOICE_TEMPLATE_VERSION,
      generatedAt: new Date().toISOString(),
      sourceReservationId: reservation.id ?? null,
      invoiceNumber: reservation.invoice_number ?? '',
    },
    agency: {
      name: settings.agency_name || settings.legal_name || '',
      legalName: settings.legal_name || '',
      taxId: settings.tax_id_number || '',
      taxRegistry: settings.tax_registry || '',
      taxRegime: settings.tax_regime || '',
      tourismRegistry: settings.tourism_registry_number || '',
      logoUrl: settings.logo_url || '/images/logo.png',
      contact: {
        phone: contactInfo.mobile || contactInfo.phone || '',
        email: contactInfo.email || '',
        website: contactInfo.website || '',
        addresses: normalizeArray(contactInfo.addresses),
      },
    },
    invoice: {
      number: reservation.invoice_number || '',
      issueDate: pickIssueDate(reservation),
      status: reservation.status || '',
      advisorName: buildAdvisorName(advisor),
      advisorId: typeof advisor === 'object' && advisor !== null
        ? (advisor.idCard || advisor.id_card || advisor.document_number || advisor.documentNumber || advisor.cedula || advisor.dni || advisor.cc || null)
        : null,
      currency,
      paymentOption: reservation.payment_option || '',
    },
    titular: {
      fullName: buildClientName(client),
      document: client.id_card || '',
      documentType: client.document_type || 'CC',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
    },
    emergencyContact: {
      name: client.emergency_contact_name || '',
      phone: client.emergency_contact_phone || '',
    },
    travel: {
      origin: primaryTravelSegment.origin || reservation.origin || '',
      destination: primaryTravelSegment.destination || reservation.destination || '',
      departureDate: primaryTravelSegment.departureDate || primaryTravelSegment.departure_date || null,
      returnDate: primaryTravelSegment.returnDate || primaryTravelSegment.return_date || null,
      nights: sumTripNights(travelSegments),
      days: sumTripDays(travelSegments),
      notes: reservation.notes || '',
      segments: travelSegments,
      segmentList: travelSegments,
      segmentsList: travelSegments,
      itinerary: travelSegments,
    },
    travelSegments: travelSegments,
    travelSegmentsList: travelSegments,
    travelItinerary: travelSegments,
    travelRoutes: travelSegments,
    travelTramos: travelSegments,
    travelDestinos: travelSegments,
    travelDetails: travelSegments,
    passengers: {
      totals: {
        adt: normalizeNumber(reservation.passengers_adt),
        chd: normalizeNumber(reservation.passengers_chd),
        inf: normalizeNumber(reservation.passengers_inf),
      },
      list: passengerList.map((passenger, index) => ({
        index: index + 1,
        name: buildPassengerName(passenger),
        document: buildPassengerDocument(passenger),
        birthDate: passenger.birth_date || null,
        type: passenger.passenger_type || passenger.type || '',
        notes: passenger.notes || '',
      })),
    },
    hotel: {
      name: (hotelSegments[0] && hotelSegments[0].name) || mainHotel.name || '',
      roomType: (hotelSegments[0] && hotelSegments[0].roomType) || mainHotel.room_category || '',
      mealPlan: (hotelSegments[0] && hotelSegments[0].mealPlan) || mainHotel.meal_plan || '',
      checkIn: (hotelSegments[0] && hotelSegments[0].checkIn) || mainHotel.check_in || mainHotel.start_date || null,
      checkOut: (hotelSegments[0] && hotelSegments[0].checkOut) || mainHotel.check_out || mainHotel.end_date || null,
      accommodations: hotelAccommodations,
      segmentList: hotelSegments,
      segments: hotelSegments,
      list: hotelSegments,
      hotels: hotelSegments,
      details: hotelSegments,
      stays: hotelSegments,
    },
    hotels: hotelSegments,
    hotelList: hotelSegments,
    hotelSegments: hotelSegments,
    hotelsList: hotelSegments,
    hotelDetails: hotelSegments,
    hotelStays: hotelSegments,
    flights: {
      airline: (flightSegments[0] && flightSegments[0].airline) || mainFlight.airline || '',
      category: (flightSegments[0] && flightSegments[0].category) || mainFlight.flight_category || mainFlight.category || '',
      class: (flightSegments[0] && flightSegments[0].class) || mainFlight.flight_class || mainFlight.class || '',
      pnr: (flightSegments[0] && flightSegments[0].pnr) || mainFlight.pnr || '',
      cycle: (flightSegments[0] && flightSegments[0].cycle) || mainFlight.flight_cycle || mainFlight.cycle || '',
      baggage: (flightSegments[0] && flightSegments[0].baggage) || extractBaggageInfo(mainFlight),
      itineraries: flattenedFlightLegs.length ? flattenedFlightLegs : itineraries.map((itinerary, index) => ({
        index: index + 1,
        flightNumber: itinerary.flight_number || itinerary.flightNumber || '',
        departureTime: itinerary.departure_time || itinerary.departureTime || null,
        arrivalTime: itinerary.arrival_time || itinerary.arrivalTime || null,
        origin: itinerary.origin || itinerary.departure_airport || '',
        destination: itinerary.destination || itinerary.arrival_airport || '',
      })),
      itinerary: flightSegments,
      segments: flightSegments,
      segmentList: flightSegments,
      segmentsList: flightSegments,
      details: flightSegments,
      flights: flightSegments,
      list: flightSegments,
    },
    flightSegments: flightSegments,
    flightsSegments: flightSegments,
    flightList: flightSegments,
    flightRoutes: flightSegments,
    flightDetails: flightSegments,
    flightItinerary: flightSegments,
    transfers: buildTransfersSection(transfers, travelSegments),
    tours: tours.map((tour, index) => ({
      index: index + 1,
      name: tour.name || tour.tour_name || '',
      date: tour.date || tour.service_date || null,
      cost: normalizeNumber(tour.cost),
    })),
    assistance: assistanceList.map((assist, index) => ({
      index: index + 1,
      planType: assist.plan_type || assist.planType || '',
      provider: assist.provider || assist.provider_name || '',
      startDate: assist.start_date || assist.startDate || null,
      endDate: assist.end_date || assist.endDate || null,
    })),
    payments: {
      currency,
      lineItems: paymentLines,
      subtotal,
      total: totalAmount,
      passengersCount: totalPassengers,
      installments: mapInstallments(installments),
    },
    contract: {
      template:
        settings.travel_contract ||
        settings.travelContract ||
        settings.contract ||
        '',
      content: '', // Se procesará dinámicamente con processContractTemplate
    },
    footer: {
      invoiceMessage: settings.invoice_message || '',
      terms: settings.terms_and_conditions || '',
      footerNote: settings.default_footer || '',
      contractMessage: settings.contract_message || '',
    },
    signatures: {
      client: buildClientName(client),
      advisor: buildAdvisorName(advisor),
    },
  };
};

const extractReservationObject = (input) => {
  if (input._original && typeof input._original === 'object') {
    return input._original;
  }

  if (input.reservation && typeof input.reservation === 'object') {
    return extractReservationObject(input.reservation);
  }

  return input;
};

const isInvoicePayload = (data) => Boolean(data?.meta?.documentType === 'invoice');

const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const normalizeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const resolveCurrency = (value) => {
  if (!value || typeof value !== 'string') {
    return 'COP';
  }
  return value.trim().toUpperCase();
};

const buildAdvisorName = (advisor) => {
  if (!advisor || typeof advisor !== 'object') {
    return '';
  }

  const parts = [advisor.name, advisor.last_name || advisor.lastname];
  return parts.filter(Boolean).join(' ').trim();
};

const buildClientName = (client) => {
  if (!client || typeof client !== 'object') {
    return '';
  }

  const parts = [client.name, client.last_name || client.lastname];
  return parts.filter(Boolean).join(' ').trim() || client.name || '';
};

const pickIssueDate = (reservation) =>
  reservation.confirmed_at ||
  reservation.approved_at ||
  reservation.created_at ||
  reservation.updated_at ||
  new Date().toISOString();

const calculateNights = (departureDate, returnDate) => {
  if (!departureDate || !returnDate) {
    return 0;
  }

  const departure = new Date(departureDate);
  const returnD = new Date(returnDate);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(returnD.getTime())) {
    return 0;
  }

  const diffTime = returnD.getTime() - departure.getTime();
  if (diffTime <= 0) {
    return 0;
  }

  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const calculateTripDays = (departureDate, returnDate) => {
  const nights = calculateNights(departureDate, returnDate);
  return nights > 0 ? nights + 1 : nights;
};

const buildPassengerName = (passenger = {}) => {
  const parts = [passenger.name, passenger.lastname || passenger.last_name];
  const value = parts.filter(Boolean).join(' ').trim();

  return value || passenger.nickname || '';
};

const buildPassengerDocument = (passenger = {}) => {
  const parts = [
    passenger.document_type || passenger.documentType,
    passenger.document_number || passenger.documentNumber,
  ];

  return parts.filter(Boolean).join(' ').trim();
};

const extractBaggageInfo = (flight = {}) => ({
  summary: flight.baggage_allowance || flight.baggage || flight.baggageAllowance || '',
  cabin: flight.cabin_baggage || flight.cabinBaggage || '',
  hold: flight.checked_baggage || flight.checkedBaggage || '',
  additional: flight.other_baggage || flight.otherBaggage || '',
});

const buildPaymentLines = (reservation) => {
  const destination = reservation.reservation_segments?.[0]?.destination || reservation.destination || '';
  const suffix = destination ? ` ${destination}` : '';
  const lines = [];

  const pushLine = (code, label, quantity, unitPrice) => {
    const qty = normalizeNumber(quantity);
    const price = normalizeNumber(unitPrice);

    if (qty <= 0 || price <= 0) {
      return;
    }

    lines.push({
      code,
      label,
      quantity: qty,
      unitPrice: price,
      amount: qty * price,
    });
  };

  pushLine('ADT', `Plan${suffix} Adulto (ADT)`, reservation.passengers_adt, reservation.price_per_adt);
  pushLine('CHD', `Plan${suffix} Nino (CHD)`, reservation.passengers_chd, reservation.price_per_chd);
  pushLine('INF', `Plan${suffix} Infante (INF)`, reservation.passengers_inf, reservation.price_per_inf);

  const bankingFee = normalizeNumber(reservation.banking_fee);
  if (bankingFee > 0) {
    lines.push({
      code: 'FEE',
      label: 'Fee bancario',
      quantity: 1,
      unitPrice: bankingFee,
      amount: bankingFee,
    });
  }

  return lines;
};

function mapHotelAccommodationList(list) {
  return normalizeArray(list).map((acc, index) => ({
    index: index + 1,
    rooms: normalizeNumber(acc?.rooms ?? acc?.room_quantity ?? acc?.roomQuantity ?? 1) || 1,
    adt: normalizeNumber(acc?.adt ?? acc?.adults ?? acc?.adultCount),
    chd: normalizeNumber(acc?.chd ?? acc?.children ?? acc?.childCount),
    inf: normalizeNumber(acc?.inf ?? acc?.infants ?? acc?.infantCount),
  }));
}

function buildTravelSegments(segments) {
  return normalizeArray(segments).map((segment, index) => {
    const rawId =
      segment?.id ??
      segment?.segment_id ??
      segment?.segmentId ??
      segment?.reservation_segment_id ??
      segment?.reservationSegmentId ??
      null;

    return {
      index: index + 1,
      id: rawId,
      origin:
        segment?.origin ||
        segment?.origen ||
        segment?.origin_city ||
        segment?.originCity ||
        segment?.departure_city ||
        segment?.departureCity ||
        segment?.city_origin ||
        segment?.cityOrigin ||
        segment?.from ||
        '',
      destination:
        segment?.destination ||
        segment?.destino ||
        segment?.destination_city ||
        segment?.destinationCity ||
        segment?.arrival_city ||
        segment?.arrivalCity ||
        segment?.city_destination ||
        segment?.cityDestination ||
        segment?.to ||
        '',
      departureDate:
        segment?.departure_date ||
        segment?.departureDate ||
        segment?.start_date ||
        segment?.startDate ||
        segment?.fecha_salida ||
        segment?.fechaSalida ||
        null,
      returnDate:
        segment?.return_date ||
        segment?.returnDate ||
        segment?.end_date ||
        segment?.endDate ||
        segment?.fecha_regreso ||
        segment?.fechaRegreso ||
        null,
      notes: segment?.notes || segment?.description || segment?.descripcion || '',
    };
  });
}

function buildHotelSegments(hotels) {
  return normalizeArray(hotels).map((hotel, index) => ({
    index: index + 1,
    name: hotel?.name || hotel?.hotel_name || hotel?.hotel || '',
    roomType: hotel?.room_category || hotel?.room_type || hotel?.room || '',
    mealPlan: hotel?.meal_plan || hotel?.mealPlan || hotel?.plan || '',
    checkIn: hotel?.check_in || hotel?.checkIn || hotel?.start_date || hotel?.startDate || null,
    checkOut: hotel?.check_out || hotel?.checkOut || hotel?.end_date || hotel?.endDate || null,
    accommodations: mapHotelAccommodationList(hotel?.reservation_hotel_accommodations || hotel?.accommodations),
  }));
}

function buildFlightSegments(flights) {
  return normalizeArray(flights).map((flight, index) => {
    const legs = buildFlightLegsFromFlight(flight);
    return {
      index: index + 1,
      airline: flight?.airline || flight?.carrier || legs[0]?.carrier || '',
      category: flight?.flight_category || flight?.category || '',
      class: flight?.flight_class || flight?.class || '',
      pnr: flight?.pnr || '',
      cycle: buildFlightCycle(legs) || flight?.flight_cycle || flight?.cycle || '',
      baggage: extractBaggageInfo(flight),
      itineraries: legs,
    };
  });
}

function buildFlightLegsFromFlight(flight) {
  const rawLegs = normalizeArray(
    flight?.reservation_flight_itineraries ||
      flight?.itineraries ||
      flight?.legs ||
      flight?.routes ||
      flight?.flight_legs
  );

  return rawLegs.map((leg, index) => ({
    index: index + 1,
    flightNumber: leg?.flight_number || leg?.flightNumber || '',
    origin:
      leg?.origin ||
      leg?.departure_airport ||
      leg?.departureCity ||
      leg?.departure_city ||
      leg?.from ||
      '',
    destination:
      leg?.destination ||
      leg?.arrival_airport ||
      leg?.arrivalCity ||
      leg?.arrival_city ||
      leg?.to ||
      '',
    departureTime:
      leg?.departure_time ||
      leg?.departureTime ||
      leg?.departure ||
      leg?.start_time ||
      leg?.startTime ||
      null,
    arrivalTime:
      leg?.arrival_time ||
      leg?.arrivalTime ||
      leg?.arrival ||
      leg?.end_time ||
      leg?.endTime ||
      null,
    carrier: leg?.airline || leg?.carrier || flight?.airline || '',
  }));
}

function buildFlightCycle(legs) {
  const list = normalizeArray(legs);
  if (list.length === 0) {
    return '';
  }

  const sequence = [];
  list.forEach((leg, index) => {
    const origin = normalizeLocationForCycle(leg?.origin);
    const destination = normalizeLocationForCycle(leg?.destination);
    if (index === 0 && origin) {
      sequence.push(origin);
    }
    if (destination) {
      sequence.push(destination);
    }
  });

  const filtered = sequence.filter(Boolean);
  if (!filtered.length) {
    return '';
  }

  return filtered.join(' -> ');
}

function normalizeLocationForCycle(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object') {
    return (
      value.code ||
      value.iata ||
      value.airport_code ||
      value.airportCode ||
      value.city ||
      value.cityCode ||
      value.name ||
      value.label ||
      value.title ||
      ''
    );
  }

  return '';
}

function sumTripNights(travelSegments) {
  const list = normalizeArray(travelSegments);
  if (!list.length) {
    return 0;
  }

  return list.reduce((total, segment) => {
    const departure =
      segment?.departureDate ||
      segment?.departure_date ||
      segment?.start_date ||
      segment?.startDate ||
      null;
    const returnDate =
      segment?.returnDate ||
      segment?.return_date ||
      segment?.end_date ||
      segment?.endDate ||
      null;

    return total + calculateNights(departure, returnDate);
  }, 0);
}

function sumTripDays(travelSegments) {
  const nights = sumTripNights(travelSegments);
  if (nights <= 0) {
    return nights;
  }

  return nights + 1;
}

const sumLineItems = (lines) =>
  lines.reduce((acc, item) => acc + (Number.isFinite(item.amount) ? item.amount : 0), 0);

const buildTransfersSection = (transfers, travelSegments = []) => {
  if (!transfers || transfers.length === 0) {
    return {
      arrival: false,
      departure: false,
      detail: [],
    };
  }

  const normalizedSegments = normalizeArray(travelSegments).map((segment, index) => ({
    ...segment,
    index: segment?.index ?? index + 1,
    id:
      segment?.id ??
      segment?.segment_id ??
      segment?.segmentId ??
      segment?.reservation_segment_id ??
      segment?.reservationSegmentId ??
      null,
  }));

  const segmentById = new Map();
  normalizedSegments.forEach((segment) => {
    if (segment.id !== null && segment.id !== undefined) {
      segmentById.set(String(segment.id), segment);
    }
  });

  const matchSegmentForTransfer = (transfer) => {
    if (!transfer || typeof transfer !== 'object') {
      return null;
    }

    const idCandidates = [
      transfer.segment_id,
      transfer.segmentId,
      transfer.reservation_segment_id,
      transfer.reservationSegmentId,
      transfer.segment?.id,
      transfer.segment?.segment_id,
      transfer.segment?.segmentId,
    ];

    for (const candidate of idCandidates) {
      if (candidate !== undefined && candidate !== null && candidate !== '') {
        const key = String(candidate);
        if (segmentById.has(key)) {
          return segmentById.get(key);
        }
      }
    }

    // Fallback: attempt to match by origin/destination if provided
    const transferOrigin =
      transfer.origin ||
      transfer.pickup_location ||
      transfer.pickup ||
      transfer.departure ||
      transfer.from ||
      '';
    const transferDestination =
      transfer.destination ||
      transfer.dropoff_location ||
      transfer.dropoff ||
      transfer.arrival ||
      transfer.to ||
      '';

    if (transferOrigin || transferDestination) {
      const normalizedOrigin = String(transferOrigin).toLowerCase();
      const normalizedDestination = String(transferDestination).toLowerCase();

      const matched = normalizedSegments.find((segment) => {
        const segmentOrigin = String(segment.origin || '').toLowerCase();
        const segmentDestination = String(segment.destination || '').toLowerCase();
        return (
          (!!normalizedOrigin && normalizedOrigin === segmentOrigin) ||
          (!!normalizedDestination && normalizedDestination === segmentDestination)
        );
      });

      if (matched) {
        return matched;
      }
    }

    return null;
  };

  const detail = transfers.map((transfer, index) => {
    const rawType = (transfer.transfer_type || transfer.type || '').toLowerCase();
    const matchedSegment = matchSegmentForTransfer(transfer);
    const segmentIndex = matchedSegment?.index ?? null;
    const segmentOrigin = matchedSegment?.origin || '';
    const segmentDestination = matchedSegment?.destination || '';

    let segmentLabel = '';
    if (segmentIndex) {
      const hasOrigin = Boolean(segmentOrigin);
      const hasDestination = Boolean(segmentDestination);
      const routePart = hasOrigin || hasDestination
        ? `${segmentOrigin || ''}${hasOrigin && hasDestination ? ' - ' : ''}${segmentDestination || ''}`
        : '';
      segmentLabel = `Tramo ${segmentIndex}${routePart ? `: ${routePart}` : ''}`;
    }

    return {
      index: index + 1,
      type: rawType,
      label: humanizeTransferType(rawType),
      date: transfer.transfer_date || transfer.date || null,
      time: transfer.transfer_time || transfer.time || null,
      pickup: transfer.pickup_location || transfer.pickup || '',
      dropoff: transfer.dropoff_location || transfer.dropoff || '',
      vehicleType: transfer.vehicle_type || '',
      notes: transfer.notes || '',
      segmentId:
        transfer.segment_id ||
        transfer.segmentId ||
        transfer.reservation_segment_id ||
        transfer.reservationSegmentId ||
        null,
      segmentIndex,
      segmentOrigin,
      segmentDestination,
      segmentLabel,
    };
  });

  return {
    arrival: detail.some((item) => item.type === 'arrival' || item.type === 'in'),
    departure: detail.some((item) => item.type === 'departure' || item.type === 'out'),
    detail,
    segments: normalizedSegments,
  };
};

const humanizeTransferType = (type) => {
  switch (type) {
    case 'arrival':
    case 'in':
      return 'Traslado In (Aeropuerto -> Hotel)';
    case 'departure':
    case 'out':
      return 'Traslado Out (Hotel -> Aeropuerto)';
    case 'inter_hotel':
      return 'Traslado Inter-hotel';
    default:
      return type ? type.charAt(0).toUpperCase() + type.slice(1) : '';
  }
};

const mapInstallments = (installments) =>
  normalizeArray(installments).map((installment, index) => ({
    index: index + 1,
    amount: normalizeNumber(installment.amount),
    dueDate: installment.due_date || installment.dueDate || null,
    status: installment.status || 'pending',
    paymentDate: installment.payment_date || installment.paymentDate || null,
    receiptUrl: installment.receipt_url || installment.receiptUrl || '',
  }));

/**
 * Procesa la plantilla de contrato reemplazando placeholders con datos de la reserva
 * @param {string} contractTemplate - Plantilla con placeholders {{campo}}
 * @param {object} invoiceData - Datos de la factura/reserva
 * @returns {string} - Contrato con campos reemplazados
 */
export const processContractTemplate = (contractTemplate, invoiceData) => {
  if (!contractTemplate || typeof contractTemplate !== 'string') {
    return '';
  }

  if (!invoiceData || typeof invoiceData !== 'object') {
    return contractTemplate;
  }

  // Helper para obtener valores anidados (ej: titular.fullName)
  const getNestedValue = (obj, path) => {
    if (!path) return '';
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '';
      }
    }
    return value ?? '';
  };

  // Helper para formatear números a texto (millones, miles, etc)
  const numberToWords = (num) => {
    // TODO: Implementar conversión completa si lo necesitas
    // Por ahora retorna el número formateado
    return new Intl.NumberFormat('es-CO').format(num);
  };

  // Helper para formatear moneda
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Helper para extraer día, mes, año de fechas
  const extractDateParts = (dateString) => {
    if (!dateString) return { day: '', month: '', year: '' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { day: '', month: '', year: '' };

    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // Usar UTC para evitar desfase de zona horaria
    return {
      day: date.getUTCDate(),
      month: months[date.getUTCMonth()],
      year: date.getUTCFullYear(),
    };
  };

  // Obtener la última fecha de retorno de todos los tramos
  const getLastReturnDate = (invoiceData) => {
    let lastDate = null;

    // Buscar en los segmentos de viaje
    const segments = invoiceData.travel?.segments ||
                    invoiceData.travel?.segmentList ||
                    invoiceData.travelSegments ||
                    invoiceData.travel?.itinerary ||
                    [];

    if (Array.isArray(segments) && segments.length > 0) {
      // Obtener todas las fechas de retorno
      const returnDates = segments
        .map(seg => seg.returnDate || seg.return_date || seg.endDate || seg.end_date)
        .filter(Boolean)
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()));

      if (returnDates.length > 0) {
        // Encontrar la fecha más lejana (última fecha de retorno)
        lastDate = new Date(Math.max(...returnDates.map(d => d.getTime())));
      }
    }

    // Fallback a la fecha de retorno general del viaje
    if (!lastDate) {
      const generalReturn = invoiceData.travel?.returnDate ||
                           invoiceData.travel?.return_date ||
                           invoiceData.travel?.departureDate ||
                           invoiceData.travel?.departure_date;
      if (generalReturn) {
        const d = new Date(generalReturn);
        if (!isNaN(d.getTime())) {
          lastDate = d;
        }
      }
    }

    return lastDate ? lastDate.toISOString() : null;
  };

  // Preparar datos adicionales de contrato (fechas de inicio y fin)
  const startDate = extractDateParts(invoiceData.invoice?.issueDate || new Date().toISOString());
  const lastReturnDate = getLastReturnDate(invoiceData);
  const endDate = extractDateParts(lastReturnDate || invoiceData.travel?.departureDate);

  const contractData = {
    ...invoiceData,
    contract: {
      ...invoiceData.contract,
      startDay: startDate.day,
      startMonth: startDate.month,
      startYear: startDate.year,
      endDay: endDate.day,
      endMonth: endDate.month,
      endYear: endDate.year,
    },
  };

  // Reemplazar placeholders {{campo}} o {{campo|filtro}}
  return contractTemplate.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
    const trimmed = placeholder.trim();

    // Verificar si tiene filtro (ej: payments.total|currency)
    const [path, filter] = trimmed.split('|').map(s => s.trim());

    let value = getNestedValue(contractData, path);

    // Aplicar filtros
    if (filter) {
      switch (filter) {
        case 'numberToWords':
          value = numberToWords(value);
          break;
        case 'currency':
          value = formatCurrency(value);
          break;
        default:
          // filtro no reconocido, usar valor sin filtrar
          break;
      }
    }

    return value !== null && value !== undefined ? String(value) : match;
  });
};

const transformReservationToVoucher = (reservation) => {
  // TODO: Implementar cuando el diseño del voucher esté definido
  return {
    meta: {
      documentType: 'voucher',
      generatedAt: new Date().toISOString(),
    },
    reservation,
  };
};
