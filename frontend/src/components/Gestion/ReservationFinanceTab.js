import React, { useState, useEffect } from 'react';
import { Upload, File as FileIcon, Loader } from 'lucide-react';

const ReservationFinanceTab = ({ reservation: initialReservation, onUpdate }) => {
  // Defensively create a safe reservation object to use in state
  const safeInitialReservation = {
    ...(initialReservation || {}),
    payments: (initialReservation?.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
    totalAmount: initialReservation?.total_amount || 0,
  };

  const [reservation, setReservation] = useState(safeInitialReservation);
  const [originalReservation, setOriginalReservation] = useState(safeInitialReservation);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});

  const getEffectiveStatus = (payment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (payment.status === 'pending' && new Date(payment.due_date) < today) {
      return 'overdue';
    }
    return payment.status;
  };

  useEffect(() => {
    // When the reservation prop updates from the parent, re-initialize the state
    const newSafeReservation = {
        ...(initialReservation || {}),
        payments: (initialReservation?.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        totalAmount: initialReservation?.total_amount || 0,
    };
    setReservation(newSafeReservation);
    setOriginalReservation(newSafeReservation);

    const newPendingChanges = {};
    (newSafeReservation.payments || []).forEach(p => {
        const effectiveStatus = getEffectiveStatus(p);
        if (effectiveStatus !== p.status) {
            newPendingChanges[p.id] = effectiveStatus;
        }
    });

    if (Object.keys(newPendingChanges).length > 0) {
        // Also update the visual state immediately
        setReservation(prev => ({
            ...prev,
            payments: prev.payments.map(p => ({...p, status: newPendingChanges[p.id] || p.status}))
        }));
        setPendingStatusChanges(prev => ({...prev, ...newPendingChanges}));
    }

  }, [initialReservation]);

  const handleStatusChange = (paymentId, newStatus) => {
    const updatedPayments = (reservation.payments || []).map(pay =>
      pay.id === paymentId ? { ...pay, status: newStatus } : pay
    );
    setReservation(prev => ({ ...prev, payments: updatedPayments }));
    setPendingStatusChanges(prev => ({ ...prev, [paymentId]: newStatus }));
  };

  const handleSaveStatusChanges = async () => {
    const pendingPaymentIds = Object.keys(pendingStatusChanges);
    const paymentsToChange = (reservation.payments || []).filter(p => pendingPaymentIds.includes(p.id.toString()));

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

      alert('¡Cambios guardados con éxito!');
      onUpdate(); // Notify parent to refetch all data
      setPendingStatusChanges({});
      setSelectedFiles({});

    } catch (err) {
      alert(`Error al guardar los cambios: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelStatusChanges = () => {
    setReservation(originalReservation);
    const newPendingChanges = { ...pendingStatusChanges };
    (originalReservation.payments || []).forEach(p => delete newPendingChanges[p.id]);
    setPendingStatusChanges(newPendingChanges);
  };

  const handleFileSelect = (paymentId, file) => {
    setSelectedFiles(prev => ({ ...prev, [paymentId]: file }));
  };

  const statusColors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const payments = reservation.payments || [];
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const balance = parseFloat(reservation.totalAmount || 0) - totalPaid;
  const hasPendingChanges = Object.keys(pendingStatusChanges).length > 0;

  return (
    <div className="space-y-6">
      {isSaving && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <Loader className="animate-spin mr-3" />
          <span>Guardando...</span>
        </div>
      )}
      {hasPendingChanges && (
        <div className="bg-yellow-100 p-3 rounded-lg flex justify-between items-center">
          <p className="text-sm font-medium text-yellow-800">Tienes cambios de estado sin guardar.</p>
          <div className="space-x-2">
            <button onClick={handleSaveStatusChanges} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Estados</button>
            <button onClick={handleCancelStatusChanges} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {payments.map((payment, index) => {
          const effectiveStatus = getEffectiveStatus(payment);
          return (
            <div key={payment.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-lg border border-gray-200">
              <div className="md:col-span-1">
                <p className="text-sm font-medium text-gray-800">Cuota #{index + 1} (${payment.amount})</p>
                <p className="text-sm text-gray-500">Vence: {new Date(payment.due_date).toLocaleDateString()}</p>
              </div>
              <div className="md:col-span-1">
                <select 
                  value={effectiveStatus}
                  onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                  className={`w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${statusColors[effectiveStatus] || ''}`}>
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
        {payments.length === 0 && <p className='text-sm text-gray-500'>No hay cuotas definidas para esta reserva.</p>}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold text-md text-gray-800 mb-2">Resumen Financiero</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="font-medium text-gray-600">Total Reserva:</div>
          <div className="col-span-2 text-right font-semibold text-gray-900">${parseFloat(reservation.totalAmount || 0).toFixed(2)}</div>

          <div className="font-medium text-gray-600">Total Pagado:</div>
          <div className="col-span-2 text-right font-semibold text-green-600">${totalPaid.toFixed(2)}</div>

          <div className="font-medium text-gray-600 border-t pt-2 mt-2">Saldo Pendiente:</div>
          <div className="col-span-2 text-right font-bold text-red-600">${balance.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFinanceTab;
