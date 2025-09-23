import React from 'react';
import {
  Users,
  Hotel,
  Plane,
  HeartPulse,
  Sun,
  CreditCard,
  FileText,
  ListChecks,
} from 'lucide-react';
import { useSettings } from '../../utils/SettingsContext';

// Read-only Section
const InfoSection = ({ title, icon, children }) => (
  <div className="py-5 px-6 border-b border-gray-200 last:border-b-0">
    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-4">
      {icon}
      {title}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
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


const ReservationDetailContent = ({ reservation }) => {
    const { formatCurrency, formatDate } = useSettings();

    const passengersData = reservation._original.reservation_passengers || [];
    const hotelData = reservation._original.reservation_hotels || [];
    const flightData = reservation._original.reservation_flights || [];
    const tourData = reservation._original.reservation_tours || [];
    const assistanceData = reservation._original.reservation_medical_assistances || [];
    
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
            <InfoSection title="Información Básica" icon={<FileText className="w-5 h-5 text-blue-600" />}>
                <InfoItem label="Cliente" value={reservation.clientName} />
                <InfoItem label="Destino" value={reservation.destination} />
                <InfoItem label="Fecha de Salida" value={formatDate(reservation.departureDate)} />
                <InfoItem label="Fecha de Regreso" value={formatDate(reservation.returnDate)} />
                <InfoItem label="Estado" value={reservation.status} />
                <InfoItem label="Asesor" value={reservation.advisorName} />
            </InfoSection>

            <InfoSection title="Pasajeros" icon={<Users className="w-5 h-5 text-green-600" />}>
                <InfoItem label="Adultos" value={reservation._original.passengers_adt} />
                <InfoItem label="Niños" value={reservation._original.passengers_chd} />
                <InfoItem label="Infantes" value={reservation._original.passengers_inf} />
                <div className="col-span-full">
                    {(passengersData || []).map((pax, index) => (
                        <div key={index} className="text-sm p-2 bg-gray-50 rounded-md mt-2">{pax.name} {pax.lastname} ({pax.document_type}: {pax.document_number})</div>
                    ))}
                </div>
            </InfoSection>

            <InfoSection title="Itinerario y Vuelos" icon={<Plane className="w-5 h-5 text-indigo-600" />}>
                {(flightData || []).length > 0 ? (flightData || []).map((flight, index) => (
                    <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                        <p><strong>Aerolínea:</strong> {flight.airline}</p>
                        <p><strong>PNR:</strong> {flight.pnr || 'No especificado'}</p>
                    </div>
                )) : <InfoItem label="Vuelos" value="No hay vuelos registrados." fullWidth />}
            </InfoSection>

            <InfoSection title="Hoteles" icon={<Hotel className="w-5 h-5 text-yellow-600" />}>
                {(hotelData || []).length > 0 ? (hotelData || []).map((hotel, index) => (
                    <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg space-y-1">
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

            <InfoSection title="Tours" icon={<Sun className="w-5 h-5 text-orange-600" />}>
                {(tourData || []).length > 0 ? (tourData || []).map((tour, index) => (
                    <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                        <p><strong>Nombre:</strong> {tour.name}</p>
                        {tour.date && <p><strong>Fecha:</strong> {formatDate(tour.date)}</p>}
                        {tour.cost && <p><strong>Costo:</strong> {formatCurrency(tour.cost)}</p>}
                    </div>
                )) : <InfoItem label="Tours" value="No hay tours registrados." fullWidth />}
            </InfoSection>

            <InfoSection title="Asistencias Médicas" icon={<HeartPulse className="w-5 h-5 text-red-600" />}>
                {(assistanceData || []).length > 0 ? (assistanceData || []).map((med, index) => (
                    <div key={index} className="col-span-full text-sm p-3 bg-gray-50 rounded-lg">
                        <p><strong>Plan:</strong> {med.plan_type || med.planType}</p>
                        <p><strong>Vigencia:</strong> {formatDate(med.start_date || med.startDate)} - {formatDate(med.end_date || med.endDate)}</p>
                    </div>
                )) : <InfoItem label="Asistencias" value="No hay asistencias médicas." fullWidth />}
            </InfoSection>

            <InfoSection title="Pago" icon={<CreditCard className="w-5 h-5 text-purple-600" />}>
                <InfoItem label="Precio ADT" value={formatCurrency(reservation._original.price_per_adt)} />
                <InfoItem label="Precio CHD" value={formatCurrency(reservation._original.price_per_chd)} />
                <InfoItem label="Precio INF" value={formatCurrency(reservation._original.price_per_inf)} />
                <InfoItem label="Total" value={formatCurrency(reservation._original.total_amount)} />
                <InfoItem label="Opción" value={reservation._original.payment_option === 'full_payment' ? 'Pago completo' : 'Cuotas'} />
                {(reservation._original.installments || []).map((inst, index) => (
                    <InfoItem key={index} label={`Cuota ${index + 1}`} value={`${formatCurrency(inst.amount)} - ${formatDate(inst.due_date || inst.dueDate)}`} fullWidth />
                ))}
            </InfoSection>
            <InfoSection title="Plan de pagos (Cuotas)" icon={<ListChecks className="w-5 h-5 text-emerald-600" />}>
            {paymentOption === 'full_payment' ? (
                <>
                <InfoItem label="Fecha de pago" value={formatDate(reservation._original.payment_date)} />
                <InfoItem label="Valor" value={formatCurrency(reservation._original.total_amount)} />
                <InfoItem label="Estado" value={getStatusLabel(reservation._original.payment_status)} />
                </>
            ) : (
                <div className="col-span-full overflow-x-auto">
                <table className="min-w-full text-sm">
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
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Pagado: {formatCurrency(paidAmount)}</span>
                <span>Total: {formatCurrency(totalAmount)}</span>
                </div>
            </div>
            </InfoSection>
        </>
    );
};

export default ReservationDetailContent;