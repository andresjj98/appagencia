import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  Globe as GlobeIcon,
  User,
  Link,
  Users
} from 'lucide-react';
import OfficeForm from '../components/Offices/OfficeForm';
import OfficeUsersForm from '../components/Offices/OfficeUsersForm';

const OfficeManagement = () => {
  const [offices, setOffices] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeForm, setShowOfficeForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [showUsersForm, setShowUsersForm] = useState(false);
  const [officeForUsers, setOfficeForUsers] = useState(null);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/offices');
        const data = await response.json();
        setOffices(data);
      } catch (error) {
        console.error('Error fetching offices', error);
      }
    };
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/users');
        const data = await response.json();
        setAllUsers(data);
      } catch (error) {
        console.error('Error fetching users', error);
      }
    };
    fetchOffices();
    fetchUsers();
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
        const response = await fetch(`http://localhost:4000/api/offices/${officeToDelete.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Error al eliminar oficina');
        }
        setOffices(prevOffices => prevOffices.filter(office => office.id !== officeToDelete.id));
      } catch (error) {
        console.error(error);
      }
    }
  };
const handleAssociateUsers = (office) => {
    setOfficeForUsers(office);
    setShowUsersForm(true);
  };

  const handleSaveAssociation = async (userIds) => {
    try {
      const response = await fetch(`http://localhost:4000/api/offices/${officeForUsers.id}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        throw new Error('Error al asociar usuarios');
      }
      const data = await response.json();
      setOffices(prev => prev.map(o => o.id === officeForUsers.id ? { ...o, associatedUsers: data.users } : o));
    } catch (error) {
      console.error(error);
    }
    setShowUsersForm(false);
    setOfficeForUsers(null);
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
        const response = await fetch(`http://localhost:4000/api/offices/${officeData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(officeData),
        });
        if (!response.ok) {
          throw new Error('Error al actualizar oficina');
        }
        const updatedOffice = await response.json();
        setOffices(prevOffices => prevOffices.map(office => office.id === updatedOffice.id ? updatedOffice : office));
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const response = await fetch('http://localhost:4000/api/offices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(officeData),
        });
        if (!response.ok) {
          throw new Error('Error al crear oficina');
        }
        const newOffice = await response.json();
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
                      onClick={() => handleAssociateUsers(office)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Link className="w-4 h-4" />
                    </motion.button>
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
                <div className="mt-4">
                  <p className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" /> Usuarios Asociados:
                  </p>
                  {office.associatedUsers && office.associatedUsers.length > 0 ? (
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      {office.associatedUsers.map(user => (
                        <li key={user.id} className="flex items-center gap-2">
                          <User className="w-4 h-4" /> {user.name} ({user.email})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 ml-4">Ningún usuario asociado.</p>
                  )}
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
          {showUsersForm && officeForUsers && (
          <OfficeUsersForm
            office={officeForUsers}
            allUsers={allUsers}
            onSave={handleSaveAssociation}
            onClose={() => setShowUsersForm(false)}
          />
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