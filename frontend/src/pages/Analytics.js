import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  Users, 
  Euro, 
  MapPin, 
  Calendar,
  Filter,
  RefreshCcw
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const generateChartData = (reservations, users) => {
  const salesByMonth = {};
  const salesByDestination = {};
  const reservationStatusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  };

  reservations.forEach(res => {
    const month = new Date(res.created_at).toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    salesByMonth[month] = (salesByMonth[month] || 0) + res.total_amount;

    if (res.reservation_segments && res.reservation_segments.length > 0) {
        const destination = res.reservation_segments[0].destination;
        salesByDestination[destination] = (salesByDestination[destination] || 0) + res.total_amount;
    }

    reservationStatusCounts[res.status] = (reservationStatusCounts[res.status] || 0) + 1;
  });

  return {
    salesByMonth: Object.entries(salesByMonth).map(([name, value]) => ({ name, value })),
    salesByDestination: Object.entries(salesByDestination).map(([name, value]) => ({ name, value })),
    reservationStatusCounts: Object.entries(reservationStatusCounts).map(([name, value]) => ({ name, value }))
  };
};

const Analytics = () => {
  const [chartData, setChartData] = useState({ salesByMonth: [], salesByDestination: [], reservationStatusCounts: [] });
  const [timeRange, setTimeRange] = useState('last_6_months');
  const [filterType, setFilterType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const reservationsResponse = await fetch('http://localhost:4000/api/reservations');
      const reservations = await reservationsResponse.json();

      // Users data is not used for now, but could be in the future
      // const usersResponse = await fetch('http://localhost:4000/api/usuarios');
      // const users = await usersResponse.json();

      if (reservationsResponse.ok) {
        const generatedData = generateChartData(reservations, []);
        setChartData(generatedData);
      } else {
        console.error('Error fetching data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, filterType]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => {
    fetchData();
    alert('Datos actualizados. ¡A analizar se ha dicho!');
  };

  const renderChart = (title, data, Icon, colorClass) => (
    <motion.div 
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className={`w-6 h-6 ${colorClass}`} /> {title}
      </h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
        {isLoading ? <p>Cargando...</p> : data.length > 0 ? (
          <ul className="list-disc list-inside">
            {data.map((item, i) => (
              <li key={i}>{item.name}: {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}</li>
            ))}
          </ul>
        ) : (
          <p>No hay datos disponibles para este gráfico.</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Análisis y Métricas Clave</h2>
        <div className="flex flex-wrap gap-3">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_month">Último Mes</option>
              <option value="last_6_months">Últimos 6 Meses</option>
              <option value="last_year">Último Año</option>
              <option value="all_time">Todo el Tiempo</option>
            </select>
          </div>

          {/* Type Filter (e.g., reservation type) */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los Tipos</option>
              <option value="flights_only">Solo Vuelos</option>
              <option value="hotel_only">Solo Hotel</option>
              <option value="all_inclusive">Todo Incluido</option>
              <option value="tours_only">Solo Tours</option>
            </select>
          </div>

          <motion.button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCcw className="w-5 h-5" /> Actualizar Datos
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChart('Ventas por Mes', chartData.salesByMonth, LineChart, 'text-blue-600')}
        {renderChart('Ventas por Destino', chartData.salesByDestination, MapPin, 'text-purple-600')}
        {renderChart('Estado de Reservas', chartData.reservationStatusCounts, PieChart, 'text-orange-600')}
      </div>

      {/* Additional Analytics Sections */}
      <motion.div 
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-600" /> Tendencias y Proyecciones
        </h3>
        <p className="text-gray-600">
          Aquí se mostrarán análisis más avanzados como tendencias de crecimiento, proyecciones de ventas,
          y comparativas de rendimiento a lo largo del tiempo.
        </p>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500 mt-4">
          Gráfico de Tendencias (próximamente)
        </div>
      </motion.div>

      <motion.div 
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="w-6 h-6 text-yellow-600" /> Análisis Financiero Detallado
        </h3>
        <p className="text-gray-600">
          Este espacio contendrá métricas financieras clave como margen de beneficio, costos operativos,
          y análisis de flujo de caja.
        </p>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500 mt-4">
          Gráfico Financiero (próximamente)
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;