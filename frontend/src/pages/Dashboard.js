import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Euro, TrendingUp } from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentReservations from '../components/Dashboard/RecentReservations';
import { useSettings } from '../context/SettingsContext';

const Dashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency } = useSettings();

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/reservations');
      const data = await response.json();
      if (response.ok) {
        setReservations(data);
      } else {
        console.error('Error fetching reservations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
  // The paymentStatus is not in the new schema, so I'm assuming totalRevenue is based on confirmed reservations for now.
  const totalRevenue = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + parseFloat(r.total_amount), 0);
  const totalClients = new Set(reservations.map(r => r.clients?.email)).size;

  const stats = [
    {
      title: 'Total Reservas',
      value: totalReservations,
      change: '+12%', // This is static, would need historical data to be dynamic
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Reservas Confirmadas',
      value: confirmedReservations,
      change: '+8%', // static
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Ingresos Totales (Confirmados)',
      value: formatCurrency(totalRevenue),
      change: '+15%', // static
      icon: Euro,
      color: 'purple'
    },
    {
      title: 'Clientes Únicos',
      value: totalClients,
      change: '+5%', // static
      icon: Users,
      color: 'orange'
    }
  ];

  const transformReservationDataForRecent = (apiData) => {
    return apiData.map(res => {
      const firstSegment = res.reservation_segments && res.reservation_segments[0];
      const passengers = (res.passengers_adt || 0) + (res.passengers_chd || 0) + (res.passengers_inf || 0);
      return {
        id: res.id,
        clientName: res.clients?.name,
        destination: firstSegment ? `${firstSegment.origin} - ${firstSegment.destination}` : 'N/A',
        departureDate: firstSegment ? firstSegment.departure_date : null,
        status: res.status,
        totalAmount: res.total_amount,
        passengers: passengers,
      };
    }).sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate)).slice(0, 5); // Get the 5 most recent
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={isLoading ? 'Cargando...' : stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </div>

      {/* Recent Reservations */}
      {isLoading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <RecentReservations reservations={transformReservationDataForRecent(reservations)} />
      )}
    </motion.div>
  );
};

export default Dashboard;