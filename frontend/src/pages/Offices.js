import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  Globe as GlobeIcon,
  User,
  Users
} from 'lucide-react';
import OfficeForm from '../components/Offices/OfficeForm';
import api from '../utils/api';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await api.get('/offices');
        setOffices(response.data);
      } catch (error) {
        console.error('Error fetching offices', error);
      }
    };
    fetchOffices();
  }, []);

  const filteredOffices = offices.filter(office => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      office.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      office.address.toLowerCase().includes(lowerCaseSearchTerm) ||
      office.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      office.manager.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const handleNewOffice = () => {
    setEditingOffice(null);
    setShowOfficeForm(true);
  };

  const handleEditOffice = (office) => {
    setEditingOffice(office);
    setShowOfficeForm(true);
  };

  const handleDeleteOffice = async (officeToDelete) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la oficina ${officeToDelete.name}?`)) {
      try {
        await api.delete(`/offices/${officeToDelete.id}`);
        setOffices(prevOffices => prevOffices.filter(office => office.id !== officeToDelete.id));
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || 'Error al eliminar oficina');
      }
    }
  };

  const handleSaveOffice = async (officeData) => {
    if (editingOffice) {
      const hasChanges = ['name', 'address', 'phone', 'email', 'manager', 'active'].some(
        key => officeData[key] !== editingOffice[key]
      );
      if (!hasChanges) {
        setShowOfficeForm(false);
        setEditingOffice(null);
        return;
      }
      try {
        const response = await api.put(`/offices/${officeData.id}`, officeData);
        const updatedOffice = response.data;
        setOffices(prevOffices => prevOffices.map(office => office.id === updatedOffice.id ? updatedOffice : office));
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const response = await api.post('/offices', officeData);
        const newOffice = response.data;
        setOffices(prevOffices => [...prevOffices, newOffice]);
      } catch (error) {
        console.error(error);
      }
    }
    setShowOfficeForm(false);
    setEditingOffice(null);
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
            placeholder="Buscar oficina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>

        {/* New Office Button */}
        <motion.button
          onClick={handleNewOffice}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Building className="w-5 h-5" />
          Nueva Oficina
        </motion.button>
      </div>

      {/* Offices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredOffices.length > 0 ? (
            filteredOffices.map((office, index) => (
              <motion.div
                key={office.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{office.name}</h3>
                    <p className="text-sm text-gray-500">{office.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleEditOffice(office)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => handleDeleteOffice(office)}
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
                    <Phone className="w-4 h-4 text-gray-400" /> {office.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> {office.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Gerente: {office.manager}
                  </p>
                  <p className="flex items-center gap-2">
                    <GlobeIcon className="w-4 h-4 text-gray-400" /> Estado: {office.active ? (
                      <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactiva
                      </span>
                    )}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-600" /> Usuarios Asignados:
                  </p>
                  {office.associatedUsers && office.associatedUsers.length > 0 ? (
                    <div className="space-y-2">
                      {office.associatedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">No hay usuarios asignados a esta oficina</p>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Para asignar usuarios, edita el usuario y selecciona esta oficina
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="col-span-full text-center py-12 text-gray-500 text-lg"
            >
              No se encontraron oficinas.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Office Form Modal */}
      <AnimatePresence>
        {showOfficeForm && (
          <OfficeForm
            office={editingOffice}
            onSave={handleSaveOffice}
            onClose={() => setShowOfficeForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OfficeManagement;