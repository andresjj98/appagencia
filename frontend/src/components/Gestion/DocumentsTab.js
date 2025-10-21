import React from 'react';
import { FileText } from 'lucide-react';

const DocumentsTab = ({ reservation }) => {
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

      {/* Información sobre documentación */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Generación de Documentos</h3>
        <p className="text-gray-600 mb-3">
          Los documentos de esta reserva se gestionan desde las siguientes secciones:
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li><strong>Factura:</strong> Disponible en la pestaña "Factura"</li>
          <li><strong>Documentos Personalizados:</strong> Disponibles en la pestaña "Documentación"</li>
        </ul>
      </div>

      {!reservation.invoice_number && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">⚠️ Reserva pendiente de aprobación</p>
          <p className="text-sm text-amber-700 mt-1">
            La factura estará disponible una vez que un administrador apruebe la reserva.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
