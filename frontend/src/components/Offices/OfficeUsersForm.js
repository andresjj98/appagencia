import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Check, PlusCircle } from 'lucide-react';

const OfficeUsersForm = ({ office, allUsers, onSave, onClose }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    setSelectedUserIds(office.associatedUsers.map((u) => u.id));
  }, [office]);

  const handleUserToggle = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
     onSave(selectedUserIds);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
       
        <div className="flex items-center justify-between p-2 border-b border-gray-200 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
             Asociar Usuarios a {office.name}
          </h2>
          <motion.button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

       
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-gray-600 text-sm">
            Selecciona los usuarios que deseas asociar a esta oficina.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {allUsers.length > 0 ? (
             allUsers.map((user) => (
                <motion.div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => handleUserToggle(user.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  {selectedUserIds.includes(user.id) ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-gray-400" />
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500">No hay usuarios disponibles para asociar.</p>
            )}
          </div>

         
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <motion.button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-5 h-5" />
              Guardar Asociación
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default OfficeUsersForm;