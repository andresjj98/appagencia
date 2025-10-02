
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../pages/AuthContext';
import { Upload, File as FileIcon, Loader, Info, X, DollarSign, Calendar, MapPin, User, Hash, Phone, Mail, FileText, CreditCard, Search } from 'lucide-react';
import { filterReservationsByRole, canAccessOffice } from '../../utils/constants';

const statusColors = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
};

const getEffectiveStatus = (payment) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (payment.status === 'pending' && new Date(payment.due_date) < today) {
    return 'overdue';
  }
  return payment.status;
};

const getReservationTypeLabel = (reservation) => {
  if (!reservation) return 'Servicios Varios';
  if (reservation.reservation_flights?.length > 0 && reservation.reservation_hotels?.length > 0) return 'Paquete Completo';
  if (reservation.reservation_flights?.length > 0) return 'Solo Vuelos';
  if (reservation.reservation_hotels?.length > 0) return 'Solo Hotel';
  if (reservation.reservation_tours?.length > 0) return 'Tours y Actividades';
  if (reservation.reservation_medical_assistances?.length > 0) return 'Asistencia Medica';
  return 'Servicios Varios';
};

const paymentOptionLabels = {
    full_payment: 'Pago Completo',
    installments: 'Pago a Cuotas',
};

const InstallmentManager = ({ reservation, onStatusChange, onFileSelect, onFileRemove, selectedFiles, hasPendingChanges, onSave, onCancel }) => (
  <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50">
    {hasPendingChanges && (
      <div className="bg-yellow-100 p-3 rounded-lg flex justify-between items-center mb-4">
        <p className="text-sm font-medium text-yellow-800">Tienes cambios de estado sin guardar.</p>
        <div className="space-x-2">
          <button onClick={() => onSave(reservation.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Estados</button>
          <button onClick={() => onCancel(reservation.id)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    )}

    <div className="space-y-4">
      {reservation.payments.map((payment, index) => {
        const effectiveStatus = getEffectiveStatus(payment);
        return (
          <div key={payment.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-white rounded-md shadow-sm">
            <div className="md:col-span-1">
              <p className="text-sm font-medium text-gray-800">Cuota #{index + 1} (${payment.amount})</p>
              <p className="text-sm text-gray-500">Vence: {new Date(payment.due_date).toLocaleDateString()}</p>
            </div>
            <div className="md:col-span-1">
              <select 
                value={effectiveStatus}
                onChange={(e) => onStatusChange(reservation.id, payment.id, e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${statusColors[effectiveStatus] || ''}`}>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div className="md:col-span-1">
              {payment.receipt_url ? (
                <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <FileIcon size={16} className="mr-2" />
                  Ver Comprobante
                </a>
              ) : (
                <div className="flex items-center">
                  <input 
                    type="file" 
                    id={`file-upload-${payment.id}`}
                    className="hidden" 
                    onChange={(e) => onFileSelect(payment.id, e.target.files[0])}
                  />
                  <label htmlFor={`file-upload-${payment.id}`} className="cursor-pointer flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                    <Upload size={14} className="mr-1"/> Adjuntar
                  </label>
                  {selectedFiles[payment.id] && (
                    <div className="flex items-center ml-2">
                        <span className="text-xs text-gray-600 truncate w-28">{selectedFiles[payment.id].name}</span>
                        <button onClick={() => onFileRemove(payment.id)} className="p-1 text-red-500 hover:text-red-700">
                            <X size={14} />
                        </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {reservation.payments.length === 0 && <p className='text-sm text-gray-500'>No hay cuotas definidas para esta reserva.</p>}
    </div>
  </div>
);

const FinanceDetailModal = ({ reservation, onClose, children }) => {
    if (!reservation) return null;

    const totalPaid = reservation.payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const balance = parseFloat(reservation.totalAmount || 0) - totalPaid;

    const DetailItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-3">
            <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-base font-semibold text-gray-900">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Detalles de la Reserva</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <DetailItem icon={FileIcon} label="Factura" value={reservation.invoiceNumber} />
                        <DetailItem icon={User} label="Titular" value={reservation.clientName} />
                        <DetailItem icon={Hash} label="ID" value={reservation.clientIdCard} />
                        <DetailItem icon={Phone} label="Celular" value={reservation.clientPhone} />
                        <DetailItem icon={Mail} label="Email" value={reservation.clientEmail} />
                        <DetailItem icon={MapPin} label="Dirección" value={reservation.clientAddress} />
                        <DetailItem icon={FileText} label="Plan" value={getReservationTypeLabel(reservation)} />
                        <DetailItem icon={MapPin} label="Ruta" value={reservation.destinationSummary} />
                        <DetailItem icon={Calendar} label="Salida" value={reservation.departureDate ? new Date(reservation.departureDate).toLocaleDateString() : 'N/A'} />
                        <DetailItem icon={Calendar} label="Regreso" value={reservation.returnDate ? new Date(reservation.returnDate).toLocaleDateString() : 'N/A'} />
                        <DetailItem icon={CreditCard} label="Tipo de Pago" value={paymentOptionLabels[reservation.paymentOption] || reservation.paymentOption} />
                        <DetailItem icon={User} label="Asesor" value={reservation.advisorName} />
                    </div>

                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-semibold text-md text-gray-800 mb-2">Resumen Financiero</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="font-medium text-gray-600">Total Reserva:</div>
                            <div className="col-span-2 text-right font-semibold text-gray-900">${parseFloat(reservation.totalAmount || 0).toFixed(2)}</div>

                            <div className="font-medium text-gray-600">Total Pagado:</div>
                            <div className="col-span-2 text-right font-semibold text-green-600">${totalPaid.toFixed(2)}</div>

                            <div className="font-medium text-gray-600 border-t pt-2 mt-2">Saldo Pendiente:</div>
                            <div className="col-span-2 text-right font-bold text-red-600 border-t pt-2 mt-2">${balance.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-xl font-bold mb-4">Cuotas</h3>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FinancePanel = () => {
  const [reservations, setReservations] = useState([]);
  const [originalReservations, setOriginalReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [modalReservation, setModalReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchFinancialData();
    }
  }, [currentUser]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reservationsResponse, airportsResponse] = await Promise.all([
        fetch(`http://localhost:4000/api/reservations?userId=${currentUser.id}&userRole=${currentUser.role}`),
        fetch('http://localhost:4000/api/airports')
      ]);

      if (!reservationsResponse.ok) throw new Error('Error al cargar las reservaciones.');
      if (!airportsResponse.ok) {
        const errorData = await airportsResponse.json().catch(() => ({ message: 'Error desconocido' }));
        const errorMessage = `Error al cargar los aeropuertos: ${errorData.message || 'Error desconocido'}. ${errorData.details ? `Detalle: ${errorData.details}` : ''}`;
        throw new Error(errorMessage);
      }

      const reservationsData = await reservationsResponse.json();
      const airportsData = await airportsResponse.json();

      const airportsMap = airportsData.reduce((acc, airport) => {
          acc[airport.iata_code] = airport.city;
          return acc;
      }, {});

      // Filtrar solo reservas confirmadas con factura Y según el rol del usuario
      const confirmedData = reservationsData.filter(res => res.status === 'confirmed' && (res.invoiceNumber || res.invoice_number));
      const filteredData = filterReservationsByRole(confirmedData, currentUser);

      const newPendingChanges = {};
      const formattedData = filteredData.map(res => {
        const firstSegment = res.reservation_segments?.[0];
        const sortedPayments = (res.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        const updatedPayments = sortedPayments.map(p => {
            const effectiveStatus = getEffectiveStatus(p);
            if (effectiveStatus !== p.status) {
                newPendingChanges[p.id] = effectiveStatus;
                return { ...p, status: effectiveStatus };
            }
            return p;
        });

        const originName = airportsMap[firstSegment?.origin] || firstSegment?.origin || 'N/A';
        const destinationName = airportsMap[firstSegment?.destination] || firstSegment?.destination || 'N/A';
        const destinationSummaryWithNames = firstSegment ? `${originName} -> ${destinationName}` : 'Destino no especificado';

        return {
          ...res,
          invoiceNumber: res.invoiceNumber || res.invoice_number,
          clientName: res.clients?.name || '',
          clientIdCard: res.clients?.id_card || '',
          clientPhone: res.clients?.phone || '',
          clientEmail: res.clients?.email || '',
          clientAddress: res.clients?.address || '',
          advisorName: res.advisor?.name || 'No asignado',
          reservationType: res.reservation_type || 'other',
          departureDate: firstSegment?.departure_date,
          returnDate: firstSegment?.return_date,
          destinationSummary: destinationSummaryWithNames,
          paymentOption: res.payment_option,
          payments: updatedPayments,
          totalAmount: res.total_amount
        };
      });

      if (Object.keys(newPendingChanges).length > 0) {
        setPendingStatusChanges(prev => ({...prev, ...newPendingChanges}));
      }

      setReservations(formattedData);
      setOriginalReservations(JSON.parse(JSON.stringify(formattedData)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (reservationId, paymentId, newStatus) => {
    const updatedReservations = reservations.map(res => {
      if (res.id === reservationId) {
        const updatedPayments = res.payments.map(pay =>
          pay.id === paymentId ? { ...pay, status: newStatus } : pay
        );
        return { ...res, payments: updatedPayments };
      }
      return res;
    });
    setReservations(updatedReservations);
    setPendingStatusChanges(prev => ({ ...prev, [paymentId]: newStatus }));
  };

  const handleSaveStatusChanges = async (reservationId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    const paymentIdsToUpdate = reservation.payments.filter(p => pendingStatusChanges[p.id]).map(p => p.id);

    if (paymentIdsToUpdate.length === 0) {
        return;
    }

    const paymentsToChange = reservation.payments.filter(p => paymentIdsToUpdate.includes(p.id));

    const paymentsRequiringReceipt = paymentsToChange.filter(p =>
        (pendingStatusChanges[p.id] === 'paid') && !p.receipt_url && !selectedFiles[p.id]
    );

    if (paymentsRequiringReceipt.length > 0) {
      alert(`Por favor, adjunte un comprobante para la cuota #${paymentsRequiringReceipt.map(p => p.id).join(', ')} y otras marcadas como "Pagado".`);
      return;
    }

    setIsSaving(true);

    try {
      const uploadPromises = paymentsToChange
        .filter(p => (pendingStatusChanges[p.id] === 'paid') && selectedFiles[p.id])
        .map(async (p) => {
          const formData = new FormData();
          formData.append('receipt', selectedFiles[p.id]);
          const response = await fetch(`http://localhost:4000/api/installments/${p.id}/receipt`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`Error al subir el comprobante para la cuota #${p.id}: ${errorData.message}`);
          }
          return response.json();
        });

      await Promise.all(uploadPromises);

      const statusUpdatePromises = paymentsToChange.map(p =>
        fetch(`http://localhost:4000/api/installments/${p.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: pendingStatusChanges[p.id] })
        }).then(res => {
          if (!res.ok) {
            const errorData = res.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(`Error al actualizar el estado para la cuota #${p.id}: ${errorData.message}`);
          }
        })
      );

      await Promise.all(statusUpdatePromises);

      const newPendingChanges = { ...pendingStatusChanges };
      const newSelectedFiles = { ...selectedFiles };
      paymentIdsToUpdate.forEach(id => {
        delete newPendingChanges[id];
        delete newSelectedFiles[id];
      });
      setPendingStatusChanges(newPendingChanges);
      setSelectedFiles(newSelectedFiles);

      await fetchFinancialData();

      alert('¡Cambios guardados con éxito!');

    } catch (err) {
      alert(`Error al guardar los cambios: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelStatusChanges = (reservationId) => {
    const originalReservation = originalReservations.find(r => r.id === reservationId);
    const updatedReservations = reservations.map(res => res.id === reservationId ? originalReservation : res);
    setReservations(updatedReservations);

    const newPendingChanges = { ...pendingStatusChanges };
    originalReservation.payments.forEach(p => delete newPendingChanges[p.id]);
    setPendingStatusChanges(newPendingChanges);
  };

  const handleFileSelect = (paymentId, file) => {
    setSelectedFiles(prev => ({ ...prev, [paymentId]: file }));
  };

  const handleFileRemove = (paymentId) => {
    const newSelectedFiles = { ...selectedFiles };
    delete newSelectedFiles[paymentId];
    setSelectedFiles(newSelectedFiles);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const isReservationPaidUp = (reservation) => {
    if (!reservation || !reservation.payments) return false;
    return reservation.payments.length > 0 && reservation.payments.every(p => p.status === 'paid');
  };

  const getReservationPaymentStatus = (reservation) => {
    if (isReservationPaidUp(reservation)) {
      return 'paid';
    }
    if (reservation.payments.some(p => getEffectiveStatus(p) === 'overdue')) {
      return 'overdue';
    }
    return 'pending';
  };

  const filteredReservations = reservations
    .filter(reservation => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const clientName = reservation.clientName || '';
      const destination = reservation.destinationSummary || '';
      const invoice = reservation.invoiceNumber ? reservation.invoiceNumber.toString() : '';
      return (
        clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
        destination.toLowerCase().includes(lowerCaseSearchTerm) ||
        invoice.toLowerCase().includes(lowerCaseSearchTerm)
      );
    })
    .filter(reservation => {
      if (!statusFilter) return true;
      const paymentStatus = getReservationPaymentStatus(reservation);
      return paymentStatus === statusFilter;
    });

  if (loading) return <div className="text-center p-10">Cargando datos financieros...</div>;
  if (error) return <div className="text-center p-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  if (reservations.length === 0) return <div className="text-center p-10"><h3 className="text-lg font-semibold">No se encontraron reservaciones facturadas</h3></div>;

  return (
    <div>
        <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative w-full max-w-sm">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                type="text"
                placeholder="Buscar por factura, cliente o destino"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option value="">Todos los estados</option>
                <option value="paid">Pagadas</option>
                <option value="pending">Pendientes</option>
                <option value="overdue">Vencidas</option>
            </select>
            <button onClick={handleClearFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                Limpiar Filtros
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isSaving && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg flex items-center">
                <Loader className="animate-spin mr-3" />
                <span className="font-medium">Guardando cambios...</span>
            </div>
            </div>
        )}
        {filteredReservations.map(reservation => {
            const isPaidUp = isReservationPaidUp(reservation);
            const pendingCount = reservation.payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

            const totalPaid = reservation.payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const balance = parseFloat(reservation.totalAmount || 0) - totalPaid;

            return (
            <div key={reservation.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500">
                    <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Factura</p>
                    <p className="text-lg font-bold text-blue-600 font-mono">{reservation.invoiceNumber}</p>
                    </div>
                </div>
                <div className="text-sm text-gray-600 text-right">
                    {isPaidUp ? (
                        <span className="font-semibold text-green-600">Reserva al día</span>
                    ) : (
                        <span className="font-semibold text-orange-600">Cuotas Pendientes: {pendingCount}</span>
                    )}
                </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{reservation.clientName}</h3>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <p className="text-sm font-medium text-gray-900">{reservation.destinationSummary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Salida</p>
                                <p className="font-medium text-gray-900">{reservation.departureDate ? new Date(reservation.departureDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Regreso</p>
                                <p className="font-medium text-gray-900">{reservation.returnDate ? new Date(reservation.returnDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Pagado</p>
                            <p className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider text-right">Saldo</p>
                            <p className="text-xl font-bold text-red-600 text-right">${balance.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={() => setModalReservation(reservation)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                            <Info className="w-4 h-4" />
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
            )}
        )}
        </div>

      {modalReservation && (
        <FinanceDetailModal reservation={modalReservation} onClose={() => setModalReservation(null)}>
            <InstallmentManager 
                reservation={reservations.find(r => r.id === modalReservation.id)} 
                onStatusChange={handleStatusChange} 
                onFileSelect={handleFileSelect} 
                onFileRemove={handleFileRemove}
                selectedFiles={selectedFiles} 
                hasPendingChanges={reservations.find(r => r.id === modalReservation.id).payments.some(p => pendingStatusChanges[p.id])}
                onSave={handleSaveStatusChanges}
                onCancel={handleCancelStatusChanges}
            />
        </FinanceDetailModal>
      )}
    </div>
  );
};

export default FinancePanel;