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
  const advisor = reservation.advisor || reservation.advisor_id || null;

  const segments = normalizeArray(reservation.reservation_segments);
  const firstSegment = segments[0] || {};

  const hotels = normalizeArray(reservation.reservation_hotels);
  const mainHotel = hotels[0] || {};
  const accommodations = normalizeArray(mainHotel.reservation_hotel_accommodations);

  const flights = normalizeArray(reservation.reservation_flights);
  const mainFlight = flights[0] || {};
  const itineraries = normalizeArray(mainFlight.reservation_flight_itineraries);

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
      logoUrl: settings.logo_url || '',
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
      origin: firstSegment.origin || reservation.origin || '',
      destination: firstSegment.destination || reservation.destination || '',
      departureDate: firstSegment.departure_date || null,
      returnDate: firstSegment.return_date || null,
      nights: calculateNights(firstSegment.departure_date, firstSegment.return_date),
      days: calculateTripDays(firstSegment.departure_date, firstSegment.return_date),
      notes: reservation.notes || '',
    },
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
      name: mainHotel.name || '',
      roomType: mainHotel.room_category || '',
      mealPlan: mainHotel.meal_plan || '',
      accommodations: accommodations.map((acc, index) => ({
        index: index + 1,
        rooms: normalizeNumber(acc.rooms) || 1,
        adt: normalizeNumber(acc.adt || acc.adults),
        chd: normalizeNumber(acc.chd || acc.children),
        inf: normalizeNumber(acc.inf || acc.infants),
      })),
    },
    flights: {
      airline: mainFlight.airline || '',
      category: mainFlight.flight_category || mainFlight.category || '',
      class: mainFlight.flight_class || mainFlight.class || '',
      pnr: mainFlight.pnr || '',
      cycle: mainFlight.flight_cycle || '',
      baggage: extractBaggageInfo(mainFlight),
      itineraries: itineraries.map((itinerary, index) => ({
        index: index + 1,
        flightNumber: itinerary.flight_number || itinerary.flightNumber || '',
        departureTime: itinerary.departure_time || itinerary.departureTime || null,
        arrivalTime: itinerary.arrival_time || itinerary.arrivalTime || null,
        origin: itinerary.origin || itinerary.departure_airport || '',
        destination: itinerary.destination || itinerary.arrival_airport || '',
      })),
    },
    transfers: buildTransfersSection(transfers),
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

const sumLineItems = (lines) =>
  lines.reduce((acc, item) => acc + (Number.isFinite(item.amount) ? item.amount : 0), 0);

const buildTransfersSection = (transfers) => {
  if (!transfers || transfers.length === 0) {
    return {
      arrival: false,
      departure: false,
      detail: [],
    };
  }

  const detail = transfers.map((transfer, index) => {
    const rawType = (transfer.transfer_type || transfer.type || '').toLowerCase();

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
    };
  });

  return {
    arrival: detail.some((item) => item.type === 'arrival' || item.type === 'in'),
    departure: detail.some((item) => item.type === 'departure' || item.type === 'out'),
    detail,
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
