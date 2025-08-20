import React from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin, Users, User, XCircle, PlusCircle } from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

const SalesPointCard = ({ salesPoint, onRemoveUser, onAssignUser, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            {salesPoint.name}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {salesPoint.address}
          </p>
        </div>
        <motion.button
          onClick={() => onAssignUser(salesPoint)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PlusCircle className="w-5 h-5" /> Asignar Usuario
        </motion.button>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <Users className="w-5 h-5" /> Usuarios Asociados:
        </p>
        {salesPoint.associatedUsers && salesPoint.associatedUsers.length > 0 ? (
          <ul className="list-disc list-inside ml-4 space-y-2">
            {salesPoint.associatedUsers.map(user => (
              <li key={user.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" /> 
                  <span>{user.name} (<span className="font-medium">{USER_ROLES[user.role]?.label || user.role}</span>)</span>
                </div>
                <motion.button
                  onClick={() => onRemoveUser(salesPoint.id, user.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XCircle className="w-4 h-4" /> Quitar
                </motion.button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 ml-4">Ningún usuario asociado.</p>
        )}
      </div>
    </motion.div>
  );
};

export default SalesPointCard;