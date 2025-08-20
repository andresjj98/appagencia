import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, 
  FileText, 
  Download, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Users,
  Euro,
  MapPin,
  List,
  Info // Import Info icon
} from 'lucide-react';

// Mock data for existing reports
const mockReports = [
  {
    id: 'rep1',
    name: 'Reporte de Ventas Mensuales',
    type: 'Ventas',
    description: 'Resumen de ingresos por reservas confirmadas en el último mes.',
    lastGenerated: '2024-07-01',
    frequency: 'Mensual',
    status: 'Listo'
  },
  {
    id: 'rep2',
    name: 'Reporte de Ocupación Hotelera',
    type: 'Hoteles',
    description: 'Detalle de noches de hotel reservadas por destino.',
    lastGenerated: '2024-06-28',
    frequency: 'Trimestral',
    status: 'Listo'
  },
  {
    id: 'rep3',
    name: 'Reporte de Rendimiento de Asesores',
    type: 'Usuarios',
    description: 'Número de reservas y monto total gestionado por cada asesor.',
    lastGenerated: '2024-07-05',
    frequency: 'Semanal',
    status: 'Listo'
  },
  {
    id: 'rep4',
    name: 'Reporte de Destinos Populares',
    type: 'Viajes',
    description: 'Los destinos más reservados en el último año.',
    lastGenerated: '2024-01-01',
    frequency: 'Anual',
    status: 'Listo'
  }
];

const Reports = () => {
  const [reports, setReports] = useState(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const filteredReports = reports.filter(report => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      report.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      report.description.toLowerCase().includes(lowerCaseSearchTerm) ||
      report.type.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const handleCreateReport = () => {
    setEditingReport(null);
    setShowReportForm(true);
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setShowReportForm(true);
  };

  const handleDeleteReport = (reportToDelete) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el reporte "${reportToDelete.name}"?`)) {
      setReports(prev => prev.filter(report => report.id !== reportToDelete.id));
    }
  };

  const handleGenerateReport = (reportId) => {
    alert(`Generando reporte ${reportId}... (En una aplicación real, esto iniciaría la generación del reporte)`);
    // Simulate generation time
    setReports(prev => prev.map(rep => 
      rep.id === reportId ? { ...rep, status: 'Generando...', lastGenerated: new Date().toISOString().split('T')[0] } : rep
    ));
    setTimeout(() => {
      setReports(prev => prev.map(rep => 
        rep.id === reportId ? { ...rep, status: 'Listo' } : rep
      ));
      alert(`Reporte ${reportId} generado con éxito.`);
    }, 2000);
  };

  const handleSaveReport = (reportData) => {
    if (editingReport) {
      setReports(prev => prev.map(rep => rep.id === reportData.id ? reportData : rep));
    } else {
      setReports(prev => [...prev, { ...reportData, id: `rep${prev.length + 1}`, status: 'Listo' }]);
    }
    setShowReportForm(false);
    setEditingReport(null);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar reporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>

        {/* Create New Report Button */}
        <motion.button
          onClick={handleCreateReport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusCircle className="w-5 h-5" />
          Crear Nuevo Reporte
        </motion.button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredReports.length > 0 ? (
            filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-blue-600" />
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleEditReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteReport(report)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <List className="w-4 h-4 text-gray-400" /> Tipo: {report.type}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Última Generación: {report.lastGenerated}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" /> Frecuencia: {report.frequency}
                  </p>
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" /> Estado: {report.status}
                  </p>
                </div>

                <motion.button
                  onClick={() => handleGenerateReport(report.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 bg-green-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={report.status === 'Generando...'}>
                  <Download className="w-5 h-5" /> 
                  {report.status === 'Generando...' ? 'Generando...' : 'Generar Reporte'}
                </motion.button>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="col-span-full text-center py-12 text-gray-500 text-lg"
            >
              No se encontraron reportes.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Form Modal */}
      <AnimatePresence>
        {showReportForm && (
          <ReportForm
            report={editingReport}
            onSave={handleSaveReport}
            onClose={() => setShowReportForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reports;