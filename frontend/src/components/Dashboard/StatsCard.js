import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, icon: Icon, color = 'blue', index = 0 }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm font-medium mt-2 ${
              change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {change} vs mes anterior
            </p>
          )}
        </div>
        <motion.div 
          className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatsCard;