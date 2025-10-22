import React, { useState, useEffect } from 'react';
import { Upload, File as FileIcon, Loader, Edit, Save, X, PlusCircle, MinusCircle } from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';
import api from '../../utils/api';

const ReservationFinanceTab = ({ reservation: initialReservation, onUpdate }) => {
  const { currentUser } = useAuth();
  const safeInitialReservation = {
    ...(initialReservation || {}),
    payments: (initialReservation?.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
    totalAmount: initialReservation?.total_amount || 0,
  };

  const [reservation, setReservation] = useState(safeInitialReservation);
  const [originalReservation, setOriginalReservation] = useState(safeInitialReservation);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    const newSafeReservation = {
        ...(initialReservation || {}),
        payments: (initialReservation?.reservation_installments || []).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)),
        totalAmount: initialReservation?.total_amount || 0,
    };
    setReservation(newSafeReservation);
    setOriginalReservation(newSafeReservation);
    setIsEditing(false); // Reset editing mode on prop change

    const newPendingChanges = {};
    (newSafeReservation.payments || []).forEach(p => {
        const effectiveStatus = getEffectiveStatus(p);
        if (effectiveStatus !== p.status) {
            newPendingChanges[p.id] = effectiveStatus;
        }
    });

    if (Object.keys(newPendingChanges).length > 0) {
        setReservation(prev => ({
            ...prev,
            payments: prev.payments.map(p => ({...p, status: newPendingChanges[p.id] || p.status}))
        }));
        setPendingStatusChanges(prev => ({...prev, ...newPendingChanges}));
    }

  }, [initialReservation]);

  // Función para obtener el estado ORIGINAL de la BD (no el del formulario)
  const getOriginalPayment = (paymentId) => {
    return originalReservation?.payments?.find(p => p.id === paymentId);
  };

  const isPaidInDatabase = (payment) => {
    const originalPayment = getOriginalPayment(payment.id);
    return originalPayment?.status === 'paid';
  };

  const canEditStatus = (payment) => {
    // Superadmin puede editar todo
    if (currentUser?.role === 'superadmin') return true;
    // Otros roles no pueden editar cuotas que YA ESTABAN pagadas en la BD
    return !isPaidInDatabase(payment);
  };

  const handleStatusChange = (paymentId, newStatus) => {
    const payment = reservation.payments.find(p => p.id === paymentId);

    // Validar permisos antes de cambiar (usando el estado original de la BD)
    if (!canEditStatus(payment)) {
      alert('No tienes permisos para modificar una cuota que ya ha sido pagada. Solo los superadministradores pueden realizar esta acción.');
      return;
    }

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
          const response = await api.post(`/installments/${p.id}/receipt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data;
        });

      await Promise.all(uploadPromises);

      const statusUpdatePromises = paymentsToChange.map(async (p) => {
        try {
          await api.put(`/installments/${p.id}/status`, { status: p.status });
        } catch (error) {
          // Mensaje específico si es error de permisos
          if (error.response?.status === 403) {
            throw new Error(`No tienes permisos para modificar la cuota. ${error.response?.data?.message || 'Solo superadministradores pueden editar cuotas pagadas.'}`);
          }
          throw new Error(`Error al actualizar el estado: ${error.response?.data?.message || error.message}`);
        }
      });

      await Promise.all(statusUpdatePromises);

      alert('¡Cambios de estado guardados con éxito!');
      onUpdate(); // Notify parent to refetch all data
      setPendingStatusChanges({});
      setSelectedFiles({});

    } catch (err) {
      const errorMessage = err.message || err.response?.data?.message || 'Error al guardar los cambios';
      alert(`Error al guardar los cambios: ${errorMessage}`);
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

  // --- Handlers for Editing Payment Plan ---
  const handleEditPlan = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setReservation(originalReservation);
    setIsEditing(false);
  };

  const handleInstallmentChange = (index, field, value) => {
    const updatedPayments = [...reservation.payments];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setReservation(prev => ({ ...prev, payments: updatedPayments }));
  };

  const addInstallment = () => {
    const newPayment = {
      id: `new-${Date.now()}`,
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setReservation(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
  };

  const removeInstallment = (index) => {
    const updatedPayments = [...reservation.payments];
    updatedPayments.splice(index, 1);
    setReservation(prev => ({ ...prev, payments: updatedPayments }));
  };

  const handleSavePlan = async () => {
    const totalInstallments = reservation.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    if (Math.abs(totalInstallments - reservation.totalAmount) > 0.01) {
      alert('La suma de las cuotas no coincide con el monto total de la reserva.');
      return;
    }

    setIsSaving(true);
    try {
      const installmentsToSave = reservation.payments.map(p => ({
        amount: p.amount,
        dueDate: p.due_date, // Ensure field name matches form state
        status: p.status
      }));

      await api.post(`/reservations/${reservation.id}/installments/upsert`, installmentsToSave);

      alert('¡Plan de pagos actualizado con éxito!');
      setIsEditing(false);
      onUpdate(); // Refresh data from parent

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar el plan de pagos';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
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

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plan de Pagos</h3>
        {reservation.status === 'pending' && !isEditing && (
          <button onClick={handleEditPlan} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <Edit size={14} /> Editar Plan
          </button>
        )}
      </div>

      {hasPendingChanges && !isEditing && (
        <div className="bg-yellow-100 p-3 rounded-lg flex justify-between items-center">
          <p className="text-sm font-medium text-yellow-800">Tienes cambios de estado sin guardar.</p>
          <div className="space-x-2">
            <button onClick={handleSaveStatusChanges} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Guardar Estados</button>
            <button onClick={handleCancelStatusChanges} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {payments.length === 0 && !isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className='text-sm text-blue-800 font-medium'>
              Esta reserva no tiene un plan de pagos por cuotas definido.
              {reservation.status === 'pending' && ' Haz clic en "Editar Plan" para crear un plan de pagos.'}
            </p>
          </div>
        )}
        {payments.map((payment, index) => {
          const effectiveStatus = getEffectiveStatus(payment);
          const paymentLabel = reservation._original?.payment_option === 'full_payment'
            ? 'Pago Total'
            : `Cuota #${index + 1}`;
          const isEditable = canEditStatus(payment);
          const paidAndLocked = isPaidInDatabase(payment) && currentUser?.role !== 'superadmin';

          return (
            <div key={payment.id} className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-lg border border-gray-200 ${paidAndLocked ? 'opacity-75' : ''}`}>
              <div className="md:col-span-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{paymentLabel}</p>
                  {paidAndLocked && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-600">
                      🔒 Bloqueado
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <div className='flex flex-col gap-2'>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="date"
                      value={payment.due_date.split('T')[0]}
                      onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-900">${payment.amount}</p>
                    <p className="text-sm text-gray-500">Vence: {(() => {
                      const [year, month, day] = payment.due_date.split('T')[0].split('-');
                      return new Date(year, month - 1, day).toLocaleDateString('es-CO');
                    })()}</p>
                    {payment.payment_date && (
                      <p className="text-xs text-green-600">
                        ✓ Pagado: {(() => {
                          const [year, month, day] = payment.payment_date.split('T')[0].split('-');
                          return new Date(year, month - 1, day).toLocaleDateString('es-CO');
                        })()}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="md:col-span-1">
                <select
                  value={effectiveStatus}
                  onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                  disabled={isEditing || !isEditable}
                  className={`w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${statusColors[effectiveStatus] || ''} ${(isEditing || !isEditable) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  title={!isEditable ? 'Solo superadministradores pueden modificar cuotas pagadas' : ''}
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
              <div className="md:col-span-1 flex items-center justify-between">
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
                      disabled={isEditing}
                      onChange={(e) => handleFileSelect(payment.id, e.target.files[0])}
                    />
                    <label htmlFor={`file-upload-${payment.id}`} className={`cursor-pointer flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white ${isEditing ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                      <Upload size={14} className="mr-1"/> Adjuntar
                    </label>
                    {selectedFiles[payment.id] && <span className="ml-2 text-xs text-gray-600 truncate w-28">{selectedFiles[payment.id].name}</span>}
                  </div>
                )}
                {isEditing && (
                  <button onClick={() => removeInstallment(index)} className="p-1 text-red-500 hover:text-red-700">
                    <MinusCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
        
        {isEditing && (
          <button onClick={addInstallment} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2">
            <PlusCircle size={16} />
            Añadir Cuota
          </button>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end items-center gap-4 pt-4 border-t">
           <p className={`text-sm font-semibold ${Math.abs(payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) - reservation.totalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
            Total Cuotas: ${payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
          </p>
          <button onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border hover:bg-gray-50">
            <X size={16} /> Cancelar
          </button>
          <button onClick={handleSavePlan} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            <Save size={16} /> Guardar Plan
          </button>
        </div>
      )}

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
