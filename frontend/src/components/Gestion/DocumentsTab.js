import React, { useState } from 'react';
import { Download, FileText, Eye } from 'lucide-react';
import { generateInvoice, generateVoucher, saveDocumentRecord } from '../../utils/documentGenerator';
import { useAuth } from '../../pages/AuthContext';

const DocumentsTab = ({ reservation, showAlert }) => {
  const { currentUser } = useAuth();
  const [generating, setGenerating] = useState(false);

  // Verificar permisos: solo admin y superadmin pueden generar documentos
  const canGenerateDocuments = currentUser?.role === 'administrador' || currentUser?.role === 'superadmin';

  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);

      // Generar y abrir la factura
      generateInvoice(reservation);

      // Guardar registro en la BD
      await saveDocumentRecord(
        reservation.id,
        'invoice',
        reservation
      );

      if (showAlert) {
        showAlert('Éxito', 'Factura generada correctamente');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      if (showAlert) {
        showAlert('Error', 'No se pudo generar la factura');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVoucher = async () => {
    try {
      setGenerating(true);

      if (showAlert) {
        showAlert('Info', 'Funcionalidad de voucher en desarrollo');
      }
    } catch (error) {
      console.error('Error generating voucher:', error);
      if (showAlert) {
        showAlert('Error', 'No se pudo generar el voucher');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleViewInvoice = () => {
    // Solo ver la factura ya generada
    generateInvoice(reservation);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Documentos de la Reserva</h2>

      {/* Información de factura */}
      {reservation.invoice_number && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">N° Factura:</span>
            <span className="text-gray-900">{reservation.invoice_number}</span>
          </div>
          {reservation.approved_at && (
            <p className="text-sm text-gray-600">
              Fecha de aprobación: {new Date(reservation.approved_at).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      )}

      {/* Acciones de documentos */}
      <div className="space-y-4">
        {canGenerateDocuments ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Generar Documentos</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generating || !reservation.invoice_number}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={!reservation.invoice_number ? 'La reserva debe estar aprobada para generar factura' : ''}
                >
                  <Download className="w-4 h-4" />
                  {generating ? 'Generando...' : 'Generar Factura'}
                </button>
                <button
                  onClick={handleGenerateVoucher}
                  disabled={generating || !reservation.invoice_number}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Generar Voucher
                </button>
              </div>
              {!reservation.invoice_number && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ La reserva debe estar aprobada para generar documentos
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Solo ver documentos para usuarios sin permisos */}
            {reservation.invoice_number && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Ver Documentos</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleViewInvoice}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Factura
                  </button>
                </div>
              </div>
            )}
            {!reservation.invoice_number && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">No hay documentos disponibles aún.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Los documentos estarán disponibles una vez la reserva sea aprobada.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;
