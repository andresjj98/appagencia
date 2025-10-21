import React, { useState } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Eye, Download, Paperclip } from 'lucide-react';
import { useAuth } from '../../pages/AuthContext';
import api from '../../utils/api';

/**
 * Pestaña de solo lectura para Finanzas y Pagos
 * Muestra información de pagos y archivos adjuntos
 */
const FinanceViewTab = ({ reservation }) => {
  const { currentUser } = useAuth();
  const [loadingFile, setLoadingFile] = useState(null);

  const payments = (reservation._original?.reservation_installments || []).sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date)
  );

  const totalAmount = reservation._original?.total_amount || 0;
  const paidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = date.split('T')[0].split('-');
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusConfig = (payment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(payment.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (payment.status === 'paid') {
      return {
        label: 'Pagado',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        borderColor: 'border-green-300',
        icon: CheckCircle
      };
    }

    if (dueDate < today && payment.status === 'pending') {
      return {
        label: 'Vencida',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-300',
        icon: AlertCircle
      };
    }

    return {
      label: 'Pendiente',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300',
      icon: Clock
    };
  };

  const getSecureUrl = async (path) => {
    try {
      // ✅ SEGURO: userId se obtiene automáticamente del token JWT
      const response = await api.post('/files/get-secure-url', { path });
      return response.data.signedUrl;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No se pudo obtener el enlace seguro.');
    }
  };

  const handleViewFile = async (path) => {
    if (!path) return;
    setLoadingFile(path);
    try {
      const secureUrl = await getSecureUrl(path);
      window.open(secureUrl, '_blank');
    } catch (error) {
      alert('Error al abrir archivo: ' + error.message);
    } finally {
      setLoadingFile(null);
    }
  };

  const handleDownloadFile = async (path, filename) => {
    if (!path) return;
    setLoadingFile(path);
    try {
      const secureUrl = await getSecureUrl(path);
      const fileResponse = await fetch(secureUrl);
      if (!fileResponse.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await fileResponse.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert('Error al descargar archivo: ' + error.message);
    } finally {
      setLoadingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con resumen financiero */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-blue-600" />
          Finanzas y Pagos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 font-medium mb-1">Total de la Reserva</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
            <p className="text-sm text-green-700 font-medium mb-1">Total Pagado</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-orange-200 bg-orange-50">
            <p className="text-sm text-orange-700 font-medium mb-1">Saldo Pendiente</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>
      </div>

      {/* Cuotas de Pago */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Plan de Pagos</h3>
        </div>
        <div className="p-6">
          {payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment, index) => {
                const statusConfig = getStatusConfig(payment);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={payment.id || index}
                    className={`border-2 ${statusConfig.borderColor} rounded-lg p-4 ${statusConfig.bgColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Cuota #{index + 1}</h4>
                          <p className={`text-sm font-medium ${statusConfig.textColor}`}>
                            {statusConfig.label}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Fecha de vencimiento:</span>
                        <span className="font-semibold text-gray-900">
                          {formatDate(payment.due_date)}
                        </span>
                      </div>
                      {payment.paid_date && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-gray-600">Fecha de pago:</span>
                          <span className="font-semibold text-gray-900">
                            {formatDate(payment.paid_date)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comprobante de pago */}
                    {payment.receipt_url && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Comprobante de Pago</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewFile(payment.receipt_url)}
                            disabled={loadingFile === payment.receipt_url}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                          >
                            <Eye className="w-4 h-4" />
                            {loadingFile === payment.receipt_url ? 'Cargando...' : 'Ver'}
                          </button>
                          <button
                            onClick={() => handleDownloadFile(payment.receipt_url, `comprobante-cuota-${index + 1}.pdf`)}
                            disabled={loadingFile === payment.receipt_url}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay cuotas de pago registradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Archivos Adjuntos Adicionales */}
      {reservation._original?.reservation_attachments &&
       reservation._original.reservation_attachments.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Archivos Adjuntos
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservation._original.reservation_attachments.map((attachment, index) => (
                <div
                  key={attachment.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Paperclip className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {attachment.file_name || 'Archivo'}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {attachment.description || 'Sin descripción'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewFile(attachment.file_url)}
                          disabled={loadingFile === attachment.file_url}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleDownloadFile(attachment.file_url, attachment.file_name)}
                          disabled={loadingFile === attachment.file_url}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceViewTab;
