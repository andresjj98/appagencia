import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Euro, TrendingUp } from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentReservations from '../components/Dashboard/RecentReservations';
import { mockReservations } from '../mock/reservations';

const Dashboard = () => {
  const totalReservations = mockReservations.length;
  const confirmedReservations = mockReservations.filter(r => r.status === 'confirmed').length;
  const totalRevenue = mockReservations
    .filter(r => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const totalClients = new Set(mockReservations.map(r => r.clientEmail)).size;

  const stats = [
    {
      title: 'Total Reservas',
      value: totalReservations,
      change: '+12%',
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Reservas Confirmadas',
      value: confirmedReservations,
      change: '+8%',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Ingresos Totales',
      value: `€${totalRevenue.toLocaleString()}`,
      change: '+15%',
      icon: Euro,
      color: 'purple'
    },
    {
      title: 'Clientes Únicos',
      value: totalClients,
      change: '+5%',
      icon: Users,
      color: 'orange'
    }
  ];

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
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            index={index}
          />
        ))}
      </div>

      {/* Recent Reservations */}
      <RecentReservations reservations={mockReservations} />
    </motion.div>
  );
};

export default Dashboard;