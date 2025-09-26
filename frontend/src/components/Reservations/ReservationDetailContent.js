import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';
import { useAuth } from '../../pages/AuthContext';

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
    const { formatCurrency, formatDate } = useSettings();
    const { currentUser } = useAuth();
    const [loadingDoc, setLoadingDoc] = useState(null);

    const getSecureUrl = async (path) => {
        const response = await fetch('http://localhost:4000/api/files/get-secure-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, userId: currentUser.id })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'No se pudo obtener el enlace seguro.');
        }
        return data.signedUrl;
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

    const segments = reservation._original.reservation_segments || [];
    const passengersData = reservation._original.reservation_passengers || [];
    const hotelData = reservation._original.reservation_hotels || [];
    const flightData = reservation._original.reservation_flights || [];
    const tourData = reservation._original.reservation_tours || [];
    const assistanceData = reservation._original.reservation_medical_assistances || [];
    const attachmentData = reservation._original.reservation_attachments || [];
    
    const paymentOption = reservation._original.payment_option;
    const installments = reservation._original.installments || reservation._original.reservation_installments || [];
    const totalInstallmentsAmount = installments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
    const paidAmount = paymentOption === 'full_payment'
        ? (reservation._original.payment_status === 'paid' ? reservation._original.total_amount : 0)
        : installments.filter(inst => inst.status === 'paid').reduce((sum, inst) => sum + (inst.amount || 0), 0);
    const totalAmount = paymentOption === 'full_payment' ? reservation._original.total_amount : totalInstallmentsAmount;
    const progress = totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0;

    const getStatusLabel = (status) => {
        switch (status) {
        case 'paid':
            return 'Pagada';
        case 'overdue':
        case 'late':
            return 'Atrasada';
        default:
            return 'Pendiente';
        }
    };

    return (
        <>
            <InfoSection id="info-basica" title="Información Básica" icon={<FileText className="w-5 h-5 text-blue-600" />} gridColsClass="lg:grid-cols-2">
                <InfoItem label="Cliente" value={reservation.clientName} />
                <InfoItem label="Identificación" value={reservation.clientId} />
                <InfoItem label="Email" value={reservation.clientEmail} />
                <InfoItem label="Teléfono" value={reservation.clientPhone} />
                <InfoItem label="Dirección" value={reservation._original.clients?.address} fullWidth />
                <InfoItem label="Contacto de Emergencia" value={reservation._original.clients?.emergency_contact_name} />
                <InfoItem label="Tel. Emergencia" value={reservation._original.clients?.emergency_contact_phone} />
                <InfoItem label="Asesor" value={reservation._original.advisor?.name} />
                {segments.map((segment, index) => (
                    <React.Fragment key={index}>
                        <InfoItem label={`Tramo ${index + 1}`} value={`${segment.origin} - ${segment.destination}`} />
                        <InfoItem label="Salida" value={formatDate(segment.departure_date)} />
                        <InfoItem label="Regreso" value={formatDate(segment.return_date)} />
                    </React.Fragment>
                ))}
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

            <InfoSection id="vuelos" title="Itinerario y Vuelos" icon={<Plane className="w-5 h-5 text-indigo-600" />}>
                {(flightData || []).length > 0 ? (flightData || []).map((flight, index) => (
                    <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg">
                        <p><strong>Aerolínea:</strong> {flight.airline}</p>
                        <p><strong>PNR:</strong> {flight.pnr || 'No especificado'}</p>
                    </div>
                )) : <InfoItem label="Vuelos" value="No hay vuelos registrados." fullWidth />}
            </InfoSection>

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

            <InfoSection id="tours" title="Tours" icon={<Sun className="w-5 h-5 text-orange-600" />}>
                {(tourData || []).length > 0 ? (tourData || []).map((tour, index) => (
                    <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg">
                        <p><strong>Nombre:</strong> {tour.name}</p>
                        {tour.date && <p><strong>Fecha:</strong> {formatDate(tour.date)}</p>}
                        {tour.cost && <p><strong>Costo:</strong> {formatCurrency(tour.cost)}</p>}
                    </div>
                )) : <InfoItem label="Tours" value="No hay tours registrados." fullWidth />}
            </InfoSection>

            <InfoSection id="asistencias" title="Asistencias Médicas" icon={<HeartPulse className="w-5 h-5 text-red-600" />}>
                {(assistanceData || []).length > 0 ? (assistanceData || []).map((med, index) => (
                    <div key={index} className="col-span-full text-base p-3 bg-gray-50 rounded-lg">
                        <p><strong>Plan:</strong> {med.plan_type || med.planType}</p>
                        <p><strong>Vigencia:</strong> {formatDate(med.start_date || med.startDate)} - {formatDate(med.end_date || med.endDate)}</p>
                    </div>
                )) : <InfoItem label="Asistencias" value="No hay asistencias médicas." fullWidth />}
            </InfoSection>

            <InfoSection id="pago" title="Pago" icon={<CreditCard className="w-5 h-5 text-purple-600" />}>
                <InfoItem label="Precio ADT" value={formatCurrency(reservation._original.price_per_adt)} />
                <InfoItem label="Precio CHD" value={formatCurrency(reservation._original.price_per_chd)} />
                <InfoItem label="Precio INF" value={formatCurrency(reservation._original.price_per_inf)} />
                <InfoItem label="Total" value={formatCurrency(reservation._original.total_amount)} />
                <InfoItem label="Opción" value={reservation._original.payment_option === 'full_payment' ? 'Pago completo' : 'Cuotas'} />
                {(reservation._original.installments || []).map((inst, index) => (
                    <InfoItem key={index} label={`Cuota ${index + 1}`} value={`${formatCurrency(inst.amount)} - ${formatDate(inst.due_date || inst.dueDate)}`} fullWidth />
                ))}
            </InfoSection>

            <InfoSection id="plan-pagos" title="Plan de pagos (Cuotas)" icon={<ListChecks className="w-5 h-5 text-emerald-600" />}>
            {paymentOption === 'full_payment' ? (
                <>
                <InfoItem label="Fecha de pago" value={formatDate(reservation._original.payment_date)} />
                <InfoItem label="Valor" value={formatCurrency(reservation._original.total_amount)} />
                <InfoItem label="Estado" value={getStatusLabel(reservation._original.payment_status)} />
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
                        <td className="py-1 pr-4">{formatCurrency(inst.amount)}</td>
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
                <span>Pagado: {formatCurrency(paidAmount)}</span>
                <span>Total: {formatCurrency(totalAmount)}</span>
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