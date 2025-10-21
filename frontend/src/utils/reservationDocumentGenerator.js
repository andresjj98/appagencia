import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from './api';

/**
 * Genera un documento PDF personalizado con las secciones seleccionadas de una reserva
 * @param {Object} reservation - Datos de la reserva
 * @param {Object} selectedSections - Objeto con keys de secciones y valores boolean
 * @returns {Promise<void>}
 */
export const generateCustomReservationDocument = async (reservation, selectedSections) => {
  try {
    // Obtener datos completos de la reserva
    const response = await api.get(`/api/reservations/${reservation._original.id}`);

    const fullReservationData = response.data;

    // Crear elemento HTML temporal para el documento
    const documentElement = createDocumentHTML(fullReservationData, selectedSections);

    // Agregar al DOM temporalmente (necesario para html2canvas)
    document.body.appendChild(documentElement);

    // Generar canvas del HTML
    const canvas = await html2canvas(documentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remover elemento temporal
    document.body.removeChild(documentElement);

    // Crear PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Agregar primera página
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Agregar páginas adicionales si es necesario
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Descargar PDF
    const fileName = `Reserva_${fullReservationData.invoice_number || fullReservationData.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating custom document:', error);
    throw error;
  }
};

/**
 * Crea el elemento HTML del documento con las secciones seleccionadas
 * @param {Object} reservation - Datos completos de la reserva
 * @param {Object} selectedSections - Secciones seleccionadas
 * @returns {HTMLElement}
 */
const createDocumentHTML = (reservation, selectedSections) => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    padding: 20mm;
    font-family: Arial, sans-serif;
    color: #333;
  `;

  let html = '';

  // Header con logo y datos de la agencia
  html += generateHeader(reservation);

  // Título del documento
  html += `
    <div style="text-align: center; margin: 20px 0 30px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">INFORMACIÓN DE RESERVA</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Factura N°: ${reservation.invoice_number || 'N/A'}</p>
    </div>
  `;

  // Secciones seleccionadas
  if (selectedSections.titular) {
    html += generateTitularSection(reservation);
  }

  if (selectedSections.travel) {
    html += generateTravelSection(reservation);
  }

  if (selectedSections.hotel) {
    html += generateHotelSection(reservation);
  }

  if (selectedSections.flights) {
    html += generateFlightsSection(reservation);
  }

  if (selectedSections.transfers) {
    html += generateTransfersSection(reservation);
  }

  if (selectedSections.tours) {
    html += generateToursSection(reservation);
  }

  if (selectedSections.assistance) {
    html += generateAssistanceSection(reservation);
  }

  if (selectedSections.passengers) {
    html += generatePassengersSection(reservation);
  }

  if (selectedSections.payments) {
    html += generatePaymentsSection(reservation);
  }

  // Footer
  html += generateFooter(reservation);

  container.innerHTML = html;
  return container;
};

const generateHeader = (reservation) => {
  const settings = reservation.business_settings || {};
  const contactInfo = settings.contact_info || {};

  return `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #667eea;">
      <div>
        <h2 style="margin: 0; font-size: 20px; color: #667eea; font-weight: bold;">${settings.agency_name || 'Agencia de Viajes'}</h2>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${settings.legal_name || ''}</p>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">NIT: ${settings.tax_id_number || 'N/A'}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 11px; color: #666;">${contactInfo.email || ''}</p>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">${contactInfo.phone || contactInfo.mobile || ''}</p>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #666;">${contactInfo.website || ''}</p>
      </div>
    </div>
  `;
};

const generateTitularSection = (reservation) => {
  const client = reservation.clients || {};

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #667eea; font-weight: bold;">👤 INFORMACIÓN DEL TITULAR</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
        <div><strong>Nombre Completo:</strong> ${client.name || ''} ${client.last_name || ''}</div>
        <div><strong>Documento:</strong> ${client.document_type || 'CC'} ${client.id_card || 'N/A'}</div>
        <div><strong>Email:</strong> ${client.email || 'N/A'}</div>
        <div><strong>Teléfono:</strong> ${client.phone || 'N/A'}</div>
        <div style="grid-column: 1 / -1;"><strong>Dirección:</strong> ${client.address || 'N/A'}</div>
        ${client.emergency_contact_name ? `
          <div style="grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <strong>Contacto de Emergencia:</strong> ${client.emergency_contact_name} - ${client.emergency_contact_phone || 'N/A'}
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

const generateTravelSection = (reservation) => {
  const segments = reservation.reservation_segments || [];

  if (segments.length === 0) {
    return '';
  }

  let segmentsHTML = '';
  segments.forEach((segment, index) => {
    segmentsHTML += `
      <div style="background: white; padding: 10px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #e0e0e0;">
        <strong style="color: #667eea;">Tramo ${index + 1}:</strong> ${segment.origin || 'N/A'} → ${segment.destination || 'N/A'}
        <br/>
        <span style="font-size: 11px; color: #666;">
          Salida: ${formatDate(segment.departure_date)} • Regreso: ${formatDate(segment.return_date)}
        </span>
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #28a745; font-weight: bold;">✈️ INFORMACIÓN DEL VIAJE</h3>
      ${segmentsHTML}
    </div>
  `;
};

const generateHotelSection = (reservation) => {
  const hotels = reservation.reservation_hotels || [];

  if (hotels.length === 0) {
    return '';
  }

  let hotelsHTML = '';
  hotels.forEach((hotel, index) => {
    const accommodations = hotel.reservation_hotel_accommodations || [];
    let accomHTML = '';

    if (accommodations.length > 0) {
      accomHTML = '<div style="margin-top: 8px; font-size: 11px; color: #666;">';
      accomHTML += '<strong>Acomodaciones:</strong><br/>';
      accommodations.forEach((acc) => {
        accomHTML += `• ${acc.rooms || 1} habitación(es): ${acc.adt || 0} adultos, ${acc.chd || 0} niños, ${acc.inf || 0} infantes<br/>`;
      });
      accomHTML += '</div>';
    }

    hotelsHTML += `
      <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #e0e0e0;">
        <strong style="color: #764ba2; font-size: 14px;">${hotel.name || 'Hotel N/A'}</strong>
        <div style="font-size: 12px; margin-top: 5px;">
          <strong>Categoría:</strong> ${hotel.room_category || 'N/A'} •
          <strong>Plan:</strong> ${hotel.meal_plan || 'N/A'}
        </div>
        <div style="font-size: 12px; margin-top: 3px; color: #666;">
          Check-in: ${formatDate(hotel.check_in)} • Check-out: ${formatDate(hotel.check_out)}
        </div>
        ${accomHTML}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #764ba2; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #764ba2; font-weight: bold;">🏨 HOTEL Y ALOJAMIENTO</h3>
      ${hotelsHTML}
    </div>
  `;
};

const generateFlightsSection = (reservation) => {
  const flights = reservation.reservation_flights || [];

  if (flights.length === 0) {
    return '';
  }

  let flightsHTML = '';
  flights.forEach((flight, index) => {
    const itineraries = flight.reservation_flight_itineraries || [];
    let itineraryHTML = '';

    if (itineraries.length > 0) {
      itineraryHTML = '<div style="margin-top: 8px;">';
      itineraries.forEach((itinerary) => {
        itineraryHTML += `
          <div style="font-size: 11px; padding: 6px; background: #f0f0f0; margin-bottom: 4px; border-radius: 3px;">
            <strong>Vuelo ${itinerary.flight_number || 'N/A'}:</strong> ${itinerary.origin || 'N/A'} → ${itinerary.destination || 'N/A'}<br/>
            Salida: ${formatTime(itinerary.departure_time)} • Llegada: ${formatTime(itinerary.arrival_time)}
          </div>
        `;
      });
      itineraryHTML += '</div>';
    }

    flightsHTML += `
      <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 4px; border: 1px solid #e0e0e0;">
        <strong style="color: #17a2b8; font-size: 14px;">Vuelo ${index + 1}</strong>
        <div style="font-size: 12px; margin-top: 5px;">
          <strong>Aerolínea:</strong> ${flight.airline || 'N/A'} •
          <strong>Clase:</strong> ${flight.flight_class || 'N/A'} •
          <strong>PNR:</strong> ${flight.pnr || 'N/A'}
        </div>
        ${itineraryHTML}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #17a2b8; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #17a2b8; font-weight: bold;">✈️ VUELOS E ITINERARIOS</h3>
      ${flightsHTML}
    </div>
  `;
};

const generateTransfersSection = (reservation) => {
  const transfers = reservation.reservation_transfers || [];

  if (transfers.length === 0) {
    return '';
  }

  let transfersHTML = '';
  transfers.forEach((transfer, index) => {
    const typeLabel = transfer.transfer_type === 'arrival' || transfer.transfer_type === 'in'
      ? 'In (Aeropuerto → Hotel)'
      : transfer.transfer_type === 'departure' || transfer.transfer_type === 'out'
      ? 'Out (Hotel → Aeropuerto)'
      : transfer.transfer_type || 'N/A';

    transfersHTML += `
      <div style="background: white; padding: 10px; margin-bottom: 6px; border-radius: 4px; border: 1px solid #e0e0e0; font-size: 12px;">
        <strong style="color: #ffc107;">Traslado ${typeLabel}</strong><br/>
        ${transfer.transfer_date ? `Fecha: ${formatDate(transfer.transfer_date)} ${transfer.transfer_time ? `• Hora: ${transfer.transfer_time}` : ''}` : ''}<br/>
        ${transfer.pickup_location ? `Origen: ${transfer.pickup_location}` : ''} ${transfer.dropoff_location ? `• Destino: ${transfer.dropoff_location}` : ''}<br/>
        ${transfer.vehicle_type ? `Vehículo: ${transfer.vehicle_type}` : ''}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #ffc107; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ffc107; font-weight: bold;">🚗 TRASLADOS</h3>
      ${transfersHTML}
    </div>
  `;
};

const generateToursSection = (reservation) => {
  const tours = reservation.reservation_tours || [];

  if (tours.length === 0) {
    return '';
  }

  let toursHTML = '';
  tours.forEach((tour, index) => {
    toursHTML += `
      <div style="background: white; padding: 10px; margin-bottom: 6px; border-radius: 4px; border: 1px solid #e0e0e0; font-size: 12px;">
        <strong>${tour.name || tour.tour_name || 'Tour N/A'}</strong><br/>
        ${tour.date || tour.service_date ? `Fecha: ${formatDate(tour.date || tour.service_date)}` : ''} ${tour.cost ? `• Costo: ${formatCurrency(tour.cost)}` : ''}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #fd7e14; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #fd7e14; font-weight: bold;">🎫 TOURS Y ACTIVIDADES</h3>
      ${toursHTML}
    </div>
  `;
};

const generateAssistanceSection = (reservation) => {
  const assistances = reservation.reservation_medical_assistances || [];

  if (assistances.length === 0) {
    return '';
  }

  let assistHTML = '';
  assistances.forEach((assist, index) => {
    assistHTML += `
      <div style="background: white; padding: 10px; margin-bottom: 6px; border-radius: 4px; border: 1px solid #e0e0e0; font-size: 12px;">
        <strong>${assist.plan_type || 'Plan N/A'}</strong> - ${assist.provider || 'Proveedor N/A'}<br/>
        Vigencia: ${formatDate(assist.start_date)} al ${formatDate(assist.end_date)}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #dc3545; font-weight: bold;">❤️ ASISTENCIA MÉDICA</h3>
      ${assistHTML}
    </div>
  `;
};

const generatePassengersSection = (reservation) => {
  const passengers = reservation.reservation_passengers || [];

  if (passengers.length === 0) {
    return '';
  }

  let passengersHTML = '<table style="width: 100%; font-size: 11px; border-collapse: collapse;">';
  passengersHTML += `
    <thead>
      <tr style="background: #667eea; color: white;">
        <th style="padding: 8px; text-align: left; border: 1px solid #555;">Nombre</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #555;">Documento</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #555;">F. Nacimiento</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #555;">Tipo</th>
      </tr>
    </thead>
    <tbody>
  `;

  passengers.forEach((passenger, index) => {
    const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
    passengersHTML += `
      <tr style="background: ${bgColor};">
        <td style="padding: 6px; border: 1px solid #ddd;">${passenger.name || ''} ${passenger.lastname || ''}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${passenger.document_type || ''} ${passenger.document_number || 'N/A'}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${formatDate(passenger.birth_date)}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${passenger.passenger_type || passenger.type || 'N/A'}</td>
      </tr>
    `;
  });

  passengersHTML += '</tbody></table>';

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #6c757d; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #6c757d; font-weight: bold;">👥 LISTA DE PASAJEROS</h3>
      ${passengersHTML}
    </div>
  `;
};

const generatePaymentsSection = (reservation) => {
  const installments = reservation.reservation_installments || [];

  let paymentsHTML = `
    <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0; margin-bottom: 10px;">
      <div style="font-size: 13px; margin-bottom: 8px;">
        <strong>Total de la Reserva:</strong> <span style="font-size: 18px; color: #28a745; font-weight: bold;">${formatCurrency(reservation.total_amount || 0)}</span>
      </div>
      <div style="font-size: 12px; color: #666;">
        <strong>Pasajeros:</strong> ${reservation.passengers_adt || 0} adultos, ${reservation.passengers_chd || 0} niños, ${reservation.passengers_inf || 0} infantes
      </div>
    </div>
  `;

  if (installments.length > 0) {
    paymentsHTML += '<div style="margin-top: 10px;"><strong style="font-size: 13px;">Cuotas de Pago:</strong></div>';
    paymentsHTML += '<table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 8px;">';
    paymentsHTML += `
      <thead>
        <tr style="background: #28a745; color: white;">
          <th style="padding: 6px; text-align: left; border: 1px solid #1e7e34;">Cuota</th>
          <th style="padding: 6px; text-align: left; border: 1px solid #1e7e34;">Monto</th>
          <th style="padding: 6px; text-align: left; border: 1px solid #1e7e34;">Fecha de Vencimiento</th>
          <th style="padding: 6px; text-align: left; border: 1px solid #1e7e34;">Estado</th>
        </tr>
      </thead>
      <tbody>
    `;

    installments.forEach((installment, index) => {
      const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      const statusLabel = installment.status === 'paid' ? '✓ Pagado' : installment.status === 'overdue' ? '⚠️ Vencido' : '⏳ Pendiente';
      const statusColor = installment.status === 'paid' ? '#28a745' : installment.status === 'overdue' ? '#dc3545' : '#ffc107';

      paymentsHTML += `
        <tr style="background: ${bgColor};">
          <td style="padding: 6px; border: 1px solid #ddd;">Cuota ${index + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">${formatCurrency(installment.amount || 0)}</td>
          <td style="padding: 6px; border: 1px solid #ddd;">${formatDate(installment.due_date)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">${statusLabel}</td>
        </tr>
      `;
    });

    paymentsHTML += '</tbody></table>';
  }

  return `
    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #28a745; font-weight: bold;">💰 INFORMACIÓN DE PAGOS</h3>
      ${paymentsHTML}
    </div>
  `;
};

const generateFooter = (reservation) => {
  const settings = reservation.business_settings || {};

  return `
    <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #667eea; text-align: center; font-size: 10px; color: #666;">
      <p style="margin: 0;">Este documento ha sido generado automáticamente desde el sistema de gestión.</p>
      <p style="margin: 5px 0 0 0;">Fecha de generación: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${settings.invoice_message ? `<p style="margin: 10px 0 0 0; font-style: italic;">${settings.invoice_message}</p>` : ''}
    </div>
  `;
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeString;
  }
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
