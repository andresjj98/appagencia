import React, { useState, useEffect } from 'react';
import { useAuth } from '../../pages/AuthContext';
import { ChevronDown, ChevronRight, Upload, File as FileIcon, Loader } from 'lucide-react';

const FinancePanel = () => {
  const [reservations, setReservations] = useState([]);
  const [originalReservations, setOriginalReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedReservation, setExpandedReservation] = useState(null);
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const { currentUser } = useAuth();

  const getEffectiveStatus = (payment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (payment.status === 'pending' && new Date(payment.due_date) < today) {
      return 'overdue';
    }
    return payment.status;
  };

  useEffect(() => {
    if (currentUser) {
      fetchFinancialData();
    }
  }, [currentUser]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:4000/api/reservations?userId=${currentUser.id}&userRole=${currentUser.role}`);
      if (!response.ok) throw new Error('Error al cargar los datos desde el backend.');
      const data = await response.json();
      
      const newPendingChanges = {};
      const formattedData = data.map(res => {
        const sortedPayments = (res.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        const updatedPayments = sortedPayments.map(p => {
            const effectiveStatus = getEffectiveStatus(p);
            if (effectiveStatus !== p.status) {
                newPendingChanges[p.id] = effectiveStatus;
                return { ...p, status: effectiveStatus };
            }
            return p;
        });

        return {
          ...res,
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
    const pendingPaymentIds = Object.keys(pendingStatusChanges);
    const paymentsToChange = reservation.payments.filter(p => pendingPaymentIds.includes(p.id.toString()));

    const paymentsRequiringReceipt = paymentsToChange.filter(p =>
        (pendingStatusChanges[p.id] === 'paid' || p.status === 'paid') && !p.receipt_url && !selectedFiles[p.id]
    );

    if (paymentsRequiringReceipt.length > 0) {
      alert(`Por favor, adjunte un comprobante para la cuota #${paymentsRequiringReceipt.map(p => p.id).join(', ')} y otras marcadas como "Pagado".`);
      return;
    }

    setIsSaving(true);

    try {
      const uploadPromises = paymentsToChange
        .filter(p => (pendingStatusChanges[p.id] === 'paid' || p.status === 'paid') && selectedFiles[p.id])
        .map(async (p) => {
          const formData = new FormData();
          formData.append('receipt', selectedFiles[p.id]);
          const response = await fetch(`http://localhost:4000/api/installments/${p.id}/receipt`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error(`Error al subir el comprobante para la cuota #${p.id}`);
          return response.json();
        });

      await Promise.all(uploadPromises);

      const statusUpdatePromises = paymentsToChange.map(p =>
        fetch(`http://localhost:4000/api/installments/${p.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: p.status })
        }).then(res => {
          if (!res.ok) throw new Error(`Error al actualizar el estado para la cuota #${p.id}`);
        })
      );

      await Promise.all(statusUpdatePromises);

      await fetchFinancialData();
      setPendingStatusChanges({});
      setSelectedFiles({});

      alert('¡Cambios guardados con éxito!');

    } catch (err) {
      alert(`Error al guardar los cambios: ${err.message}`);
      fetchFinancialData();
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

  const toggleReservation = (id) => {
    setExpandedReservation(expandedReservation === id ? null : id);
  };

  const statusColors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const isReservationPaidUp = (reservation) => {
    if (!reservation || !reservation.payments) return false;
    return reservation.payments.length > 0 && reservation.payments.every(p => p.status === 'paid');
  };

  if (loading) return <div className="text-center p-10">Cargando datos financieros...</div>;
  if (error) return <div className="text-center p-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  if (reservations.length === 0) return <div className="text-center p-10"><h3 className="text-lg font-semibold">No se encontraron reservaciones facturadas</h3></div>;

  return (
    <div className="space-y-2">
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <Loader className="animate-spin mr-3" />
            <span className="font-medium">Guardando cambios...</span>
          </div>
        </div>
      )}
      {reservations.map(reservation => {
        const originalReservation = originalReservations.find(r => r.id === reservation.id);
        const isPaidUp = isReservationPaidUp(originalReservation);
        const hasPendingChanges = reservation.payments.some(p => pendingStatusChanges[p.id]);
        const pendingCount = reservation.payments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

        const totalPaid = reservation.payments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const balance = parseFloat(reservation.totalAmount || 0) - totalPaid;

        return (
          <div key={reservation.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-3 grid grid-cols-5 gap-4 items-center cursor-pointer hover:bg-gray-50" onClick={() => toggleReservation(reservation.id)}>
              <div className="font-medium text-gray-900 col-span-2">Factura: {reservation.invoiceNumber}</div>
              <div className="text-sm text-gray-600">{reservation.clientName}</div>
              <div className="text-sm text-gray-600">
                {isPaidUp ? (
                  <span className="font-semibold text-green-600">Reserva al día</span>
                ) : (
                  <span className="font-semibold text-orange-600">Cuotas Pendientes: {pendingCount}</span>
                )}
              </div>
              <div className="flex justify-end">{expandedReservation === reservation.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</div>
            </div>

            {expandedReservation === reservation.id && (
              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50">
                {hasPendingChanges && (
                  <div className="bg-yellow-100 p-3 rounded-lg flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-yellow-800">Tienes cambios de estado sin guardar.</p>
                    <div className="space-x-2">
                      <button onClick={() => handleSaveStatusChanges(reservation.id)} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Estados</button>
                      <button onClick={() => handleCancelStatusChanges(reservation.id)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50">Cancelar</button>
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
                            onChange={(e) => handleStatusChange(reservation.id, payment.id, e.target.value)}
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
                                onChange={(e) => handleFileSelect(payment.id, e.target.files[0])}
                              />
                              <label htmlFor={`file-upload-${payment.id}`} className="cursor-pointer flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                                <Upload size={14} className="mr-1"/> Adjuntar
                              </label>
                              {selectedFiles[payment.id] && <span className="ml-2 text-xs text-gray-600 truncate w-28">{selectedFiles[payment.id].name}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {reservation.payments.length === 0 && <p className='text-sm text-gray-500'>No hay cuotas definidas para esta reserva.</p>}
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

              </div>
            )}
          </div>
        )}
      )}
    </div>
  );
};

export default FinancePanel;