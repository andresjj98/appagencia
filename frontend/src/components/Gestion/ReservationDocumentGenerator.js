import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Loader } from 'lucide-react';

const ReservationDocumentGenerator = ({ reservation, onClose, onGenerate }) => {
  const [generating, setGenerating] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    titular: true,
    travel: true,
    hotel: false,
    flights: false,
    transfers: false,
    tours: false,
    assistance: false,
    passengers: false,
    payments: false,
  });

  const sections = [
    { key: 'titular', label: 'Información del Titular/Cliente', description: 'Nombre, documento, email, teléfono, dirección' },
    { key: 'travel', label: 'Información del Viaje', description: 'Origen, destino, fechas, duración del viaje' },
    { key: 'hotel', label: 'Hotel y Alojamiento', description: 'Nombre del hotel, categoría, plan alimenticio, fechas' },
    { key: 'flights', label: 'Vuelos e Itinerarios', description: 'Aerolínea, vuelos, horarios, escalas' },
    { key: 'transfers', label: 'Traslados', description: 'Traslados de llegada y salida, detalles del vehículo' },
    { key: 'tours', label: 'Tours y Actividades', description: 'Tours contratados, fechas y costos' },
    { key: 'assistance', label: 'Asistencia Médica', description: 'Plan de asistencia, proveedor, vigencia' },
    { key: 'passengers', label: 'Lista de Pasajeros', description: 'Nombres completos, documentos, fechas de nacimiento' },
    { key: 'payments', label: 'Información de Pagos', description: 'Desglose de precios, cuotas y estado de pagos' },
  ];

  const toggleSection = (key) => {
    setSelectedSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAll = () => {
    const allSelected = {};
    sections.forEach(section => {
      allSelected[section.key] = true;
    });
    setSelectedSections(allSelected);
  };

  const deselectAll = () => {
    const allDeselected = {};
    sections.forEach(section => {
      allDeselected[section.key] = false;
    });
    setSelectedSections(allDeselected);
  };

  const handleGenerate = async () => {
    const hasAtLeastOne = Object.values(selectedSections).some(v => v);
    if (!hasAtLeastOne) {
      alert('Debes seleccionar al menos una sección para generar el documento');
      return;
    }

    setGenerating(true);
    try {
      await onGenerate(selectedSections);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error al generar el documento');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Generar Documento Personalizado</h2>
                <p className="text-sm text-blue-100">Selecciona las secciones que deseas incluir</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Info Bar */}
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <p className="text-sm text-blue-900">
              <strong>Reserva:</strong> {reservation._original?.invoice_number || reservation.id} •
              <strong className="ml-2">Cliente:</strong> {reservation.clientName || 'N/A'}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={selectAll}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Seleccionar todo
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Deseleccionar todo
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((section) => (
                <motion.div
                  key={section.key}
                  whileHover={{ scale: 1.01 }}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedSections[section.key]
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => toggleSection(section.key)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedSections[section.key]
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedSections[section.key] && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{section.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={generating}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generar y Descargar
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReservationDocumentGenerator;
