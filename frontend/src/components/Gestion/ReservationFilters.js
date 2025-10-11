import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  ChevronDown,
  Calendar,
  Building2,
  AlertCircle,
  CreditCard,
  User,
  RotateCcw,
  Globe,
  Plane,
  Hotel,
  Ticket,
  HeartPulse,
  Briefcase
} from 'lucide-react';
import { RESERVATION_STATUS, PAYMENT_STATUS } from '../../utils/constants';

const ReservationFilters = ({
  reservations,
  onFilterChange,
  currentUser,
  availableOffices = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    office: '',
    status: '',
    paymentStatus: '',
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    urgency: '',
    reservationType: '',
  });

  // Usar las oficinas proporcionadas desde el backend
  const offices = availableOffices;

  // Niveles de urgencia
  const urgencyLevels = [
    { value: 'today', label: 'Sale hoy' },
    { value: 'urgent', label: 'Urgente (≤3 días)' },
    { value: 'soon', label: 'Próxima salida (≤7 días)' },
    { value: 'past', label: 'Viajes pasados' }
  ];

  // Tipos de reserva
  const reservationTypes = [
    { value: 'all_inclusive', label: 'Paquete Completo', icon: Globe },
    { value: 'flights_only', label: 'Solo Vuelos', icon: Plane },
    { value: 'hotel_only', label: 'Solo Hotel', icon: Hotel },
    { value: 'tours_only', label: 'Tours y Actividades', icon: Ticket },
    { value: 'medical_assistance', label: 'Asistencia Médica', icon: HeartPulse },
    { value: 'other', label: 'Servicios Varios', icon: Briefcase }
  ];

  // Contar filtros activos
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== ''
  ).length;

  // Aplicar filtros cuando cambien
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      office: '',
      status: '',
      paymentStatus: '',
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      urgency: '',
      reservationType: '',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header del filtro */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Filtros de Búsqueda</h3>
            <p className="text-xs text-gray-500">
              {activeFiltersCount > 0
                ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}`
                : 'No hay filtros aplicados'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Limpiar filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Panel de filtros expandible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Búsqueda por texto */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Buscar por Cliente o Pasajero
                </label>
                <input
                  type="text"
                  placeholder="Nombre del titular o pasajero..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Grid de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Tipo de Reserva */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4" />
                    Tipo de Reserva
                  </label>
                  <select
                    value={filters.reservationType}
                    onChange={(e) => handleFilterChange('reservationType', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Todos los tipos</option>
                    {reservationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Oficina */}
                {(currentUser?.isSuperAdmin || currentUser?.role === 'administrador') && offices.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Building2 className="w-4 h-4" />
                      Oficina
                    </label>
                    <select
                      value={filters.office}
                      onChange={(e) => handleFilterChange('office', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">Todas las oficinas</option>
                      {offices.map(office => (
                        <option key={office.id} value={office.id}>
                          {office.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro por Estado de Reserva */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Estado de Reserva
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Todos los estados</option>
                    {Object.entries(RESERVATION_STATUS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado de Pago */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4" />
                    Estado de Pago
                  </label>
                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Todos los estados</option>
                    {Object.entries(PAYMENT_STATUS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Urgencia */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Prioridad/Urgencia
                  </label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="">Todas las prioridades</option>
                    {urgencyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Fecha Desde */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Fecha Salida Desde
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Filtro por Fecha Hasta */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Fecha Salida Hasta
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Badges de filtros activos */}
              {activeFiltersCount > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Filtros activos:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.searchTerm && (
                      <FilterBadge
                        label={`Búsqueda: ${filters.searchTerm}`}
                        onRemove={() => handleFilterChange('searchTerm', '')}
                      />
                    )}
                    {filters.reservationType && (
                      <FilterBadge
                        label={`Tipo: ${reservationTypes.find(t => t.value === filters.reservationType)?.label}`}
                        onRemove={() => handleFilterChange('reservationType', '')}
                      />
                    )}
                    {filters.office && (
                      <FilterBadge
                        label={`Oficina: ${offices.find(o => o.id === filters.office)?.name || filters.office}`}
                        onRemove={() => handleFilterChange('office', '')}
                      />
                    )}
                    {filters.status && (
                      <FilterBadge
                        label={`Estado: ${RESERVATION_STATUS[filters.status]?.label}`}
                        onRemove={() => handleFilterChange('status', '')}
                      />
                    )}
                    {filters.paymentStatus && (
                      <FilterBadge
                        label={`Pago: ${PAYMENT_STATUS[filters.paymentStatus]?.label}`}
                        onRemove={() => handleFilterChange('paymentStatus', '')}
                      />
                    )}
                    {filters.urgency && (
                      <FilterBadge
                        label={`Urgencia: ${urgencyLevels.find(u => u.value === filters.urgency)?.label}`}
                        onRemove={() => handleFilterChange('urgency', '')}
                      />
                    )}
                    {filters.dateFrom && (
                      <FilterBadge
                        label={`Desde: ${filters.dateFrom}`}
                        onRemove={() => handleFilterChange('dateFrom', '')}
                      />
                    )}
                    {filters.dateTo && (
                      <FilterBadge
                        label={`Hasta: ${filters.dateTo}`}
                        onRemove={() => handleFilterChange('dateTo', '')}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente Badge para filtros activos
const FilterBadge = ({ label, onRemove }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
  >
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </motion.div>
);

export default ReservationFilters;
