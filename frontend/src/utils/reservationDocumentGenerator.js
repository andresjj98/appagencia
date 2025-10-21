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
    const response = await api.get(`/reservations/${reservation._original.id}`);

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
    width: 900px;
    background: white;
    padding: 0;
    font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica', Arial, sans-serif;
    color: #123b48;
    font-size: 12px;
  `;

  let html = '';

  // Header con diseño mejorado (similar a la factura)
  html += generateHeader(reservation);

  // Título del documento con diseño compacto
  html += `
    <div style="margin: 0; padding: 10px 14px; background: linear-gradient(135deg, #00a6c7 0%, #49c8de 70%, #eaf7fb 70%);">
      <div style="color: white; text-align: center;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px;">DOCUMENTO DE RESERVA</h2>
        ${reservation.invoice_number ? `<p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.95; font-weight: 600;">Factura N°: ${reservation.invoice_number}</p>` : ''}
      </div>
    </div>
    <div style="padding: 10px 12px 14px;">`;

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

  // Cerrar el contenedor de contenido
  html += '</div>';

  // Footer
  html += generateFooter(reservation);

  container.innerHTML = html;
  return container;
};

const generateHeader = (reservation) => {
  const settings = reservation.business_settings || {};
  const contactInfo = settings.contact_info || {};
  const advisor = reservation.advisor || {};

  return `
    <div style="background: linear-gradient(135deg, #00a6c7 0%, #49c8de 70%, #eaf7fb 70%); padding: 10px 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; color: white;">
          ${settings.logo_url ? `
            <div style="width: 96px; height: 64px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(0,0,0,0.06);">
              <img src="${settings.logo_url}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />
            </div>
          ` : `
            <div style="width: 96px; height: 64px; border-radius: 8px; background: linear-gradient(140deg, #00a6c7 0%, #008bb5 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase;">
              ${(settings.agency_name || 'AG').substring(0, 2)}
            </div>
          `}
          <div>
            <h1 style="margin: 0; font-size: 26px; line-height: 1; font-weight: 800; letter-spacing: 0.3px;">${settings.agency_name || 'Agencia de Viajes'}</h1>
            <small style="display: block; margin-top: 2px; opacity: 0.95; font-weight: 600; letter-spacing: 0.06em;">${settings.legal_name || ''}</small>
            ${settings.tax_id_number ? `<small style="display: block; margin-top: 1px; font-size: 9.5px; font-weight: 600; letter-spacing: 0.05em; opacity: 0.88; text-transform: uppercase;">NIT: ${settings.tax_id_number}</small>` : ''}
          </div>
        </div>
        <div style="background: white; color: #123b48; border: 1px solid #d9e6ea; border-radius: 8px; padding: 8px 10px; min-width: 240px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #008bb5; border-bottom: 2px solid #00a6c7; padding-bottom: 4px; margin-bottom: 6px;">Información del Documento</div>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px; font-size: 11px;">
            ${reservation.invoice_number ? `<div>Factura:</div><div style="font-weight: 800;">${reservation.invoice_number}</div>` : ''}
            <div>Fecha:</div><div style="font-weight: 800;">${new Date().toLocaleDateString('es-CO')}</div>
            ${advisor.id_card ? `<div>Asesor:</div><div style="font-weight: 800;">${advisor.id_card}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateTitularSection = (reservation) => {
  const client = reservation.clients || {};

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Datos del Titular</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Nombre:</span>
            <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.name || ''} ${client.last_name || ''}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Documento:</span>
            <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.document_type || 'CC'} ${client.id_card || 'N/A'}</span>
          </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Correo:</span>
            <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.email || 'N/A'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
            <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Teléfono:</span>
            <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.phone || 'N/A'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
            <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Dirección:</span>
            <span style="flex: 1; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.address || 'N/A'}</span>
          </div>
        </div>
        ${client.emergency_contact_name ? `
          <div style="height: 1px; background: #d9e6ea; margin: 6px 0;"></div>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
              <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Contacto de Emergencia:</span>
              <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.emergency_contact_name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
              <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Celular:</span>
              <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${client.emergency_contact_phone || 'N/A'}</span>
            </div>
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
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Origen:</span>
          <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${segment.origin || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Destino:</span>
          <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${segment.destination || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Ida:</span>
          <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${formatDate(segment.departure_date)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Regreso:</span>
          <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${formatDate(segment.return_date)}</span>
        </div>
      </div>
      ${index < segments.length - 1 ? '<div style="height: 1px; background: #d9e6ea; margin: 6px 0;"></div>' : ''}
    `;
  });

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Datos de la Reserva</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        ${segmentsHTML}
      </div>
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
      accommodations.forEach((acc) => {
        accomHTML += `
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
            <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
              <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">(N habitaciones / ADT / CHD / INF):</span>
              <span style="border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${acc.rooms || 1} / ${acc.adt || 0} / ${acc.chd || 0} / ${acc.inf || 0}</span>
            </div>
          </div>
        `;
      });
    }

    hotelsHTML += `
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Hotel:</span>
          <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${hotel.name || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Habitación:</span>
          <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${hotel.room_category || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Plan de alimentación:</span>
          <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${hotel.meal_plan || 'N/A'}</span>
        </div>
      </div>
      ${accomHTML}
      ${index < hotels.length - 1 ? '<div style="height: 1px; background: #d9e6ea; margin: 6px 0;"></div>' : ''}
    `;
  });

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Hotel y Alojamiento</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        ${hotelsHTML}
      </div>
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

    // Crear el "ciclo de vuelo" concatenando todos los itinerarios
    let cycleParts = [];
    if (itineraries.length > 0) {
      itineraries.forEach((itinerary) => {
        cycleParts.push(`${itinerary.origin || 'N/A'} → ${itinerary.destination || 'N/A'}`);
      });
    }
    const cycleText = cycleParts.length > 0 ? cycleParts.join(' • ') : 'N/A';

    flightsHTML += `
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Aerolínea:</span>
          <span style="flex: 1; min-width: 120px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${flight.airline || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Plan:</span>
          <span style="min-width: 80px; border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${flight.flight_class || 'N/A'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Equipaje:</span>
          <span style="border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${flight.baggage_allowance || '-'}</span>
        </div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 2px 0;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;">
          <span style="font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #0b5163;">Ciclo de vuelo:</span>
          <span style="border-bottom: 1px dashed #d9e6ea; padding: 2px 4px 1px 4px; color: #3e525a;">${cycleText}</span>
        </div>
      </div>
      ${index < flights.length - 1 ? '<div style="height: 1px; background: #d9e6ea; margin: 6px 0;"></div>' : ''}
    `;
  });

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Vuelos e Itinerarios</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        ${flightsHTML}
      </div>
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
      <div style="font-size: 11.5px; color: #3e525a; margin: 4px 0;">
        <strong style="color: #008bb5;">• ${typeLabel}${transfer.transfer_date ? ` (${formatDate(transfer.transfer_date)}${transfer.transfer_time ? ` - ${transfer.transfer_time}` : ''})` : ''}</strong>
        ${transfer.pickup_location && transfer.dropoff_location ? `<br/>&nbsp;&nbsp;${transfer.pickup_location} → ${transfer.dropoff_location}` : ''}
        ${transfer.vehicle_type ? `<br/>&nbsp;&nbsp;Vehículo: ${transfer.vehicle_type}` : ''}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Traslados</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        ${transfersHTML || '<div style="font-size: 11.5px; color: #3e525a;">No hay traslados registrados.</div>'}
      </div>
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
      <div style="font-size: 11.5px; color: #3e525a; margin: 4px 0;">
        <strong style="color: #008bb5;">• ${tour.name || tour.tour_name || 'Tour N/A'}</strong>
        ${tour.date || tour.service_date ? ` (${formatDate(tour.date || tour.service_date)})` : ''}
        ${tour.cost ? `<br/>&nbsp;&nbsp;Costo: ${formatCurrency(tour.cost)}` : ''}
      </div>
    `;
  });

  return `
    <div style="margin-bottom: 8px;">
      <span style="background: #008bb5; color: white; padding: 4px 8px; border-radius: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block; margin: 4px 0 6px; font-weight: 800;">Tours y Actividades</span>
      <div style="border: 1px solid #d9e6ea; background: #f1f7f9; border-radius: 8px; padding: 8px; margin-bottom: 8px;">
        ${toursHTML || '<div style="font-size: 11.5px; color: #3e525a;">No hay tours o servicios adicionales registrados.</div>'}
      </div>
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
  const contactInfo = settings.contact_info || {};

  return `
    <div style="margin-top: 10px; padding: 10px 12px; background: #f8f9fa; border-top: 1px solid #d9e6ea;">
      <div style="text-align: center; font-size: 10px; color: #00a6c7; line-height: 1.55; font-weight: 600;">
        ${contactInfo.email || contactInfo.phone || contactInfo.website ? `
          <div style="margin: 12px auto 0; max-width: 760px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
            ${contactInfo.email ? `<span>${contactInfo.email}</span>` : ''}
            ${contactInfo.email && (contactInfo.phone || contactInfo.website) ? '<span style="color: rgba(0,166,199,0.55);">•</span>' : ''}
            ${contactInfo.phone ? `<span>${contactInfo.phone}</span>` : ''}
            ${contactInfo.phone && contactInfo.website ? '<span style="color: rgba(0,166,199,0.55);">•</span>' : ''}
            ${contactInfo.website ? `<span>${contactInfo.website}</span>` : ''}
          </div>
        ` : ''}
        <div style="margin: 8px 0; font-size: 9px; color: #6c757d;">
          <p style="margin: 0;">Documento generado automáticamente el ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          ${settings.invoice_message ? `<p style="margin: 4px 0 0 0; font-style: italic;">${settings.invoice_message}</p>` : ''}
        </div>
      </div>
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
