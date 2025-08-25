import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  User, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Link, 
  Users,
  MapPin
} from 'lucide-react';
import { mockUsers } from '../mock/users'; // Assuming mockUsers is available
import { mockOffices as importedMockOffices } from './Offices'; // Assuming mockOffices is available
import SalesPointForm from '../components/SalesPoints/SalesPointForm'; // Form for associating users

// Mock data for sales points (offices with associated users)
const mockSalesPoints = importedMockOffices && importedMockOffices.length > 0 ? importedMockOffices.map(office => ({
  ...office,
  associatedUsers: mockUsers.filter(user => user.role === 'advisor' && user.id === office.id) // Example association
})) : []; // Provide an empty array if importedMockOffices is undefined or empty


const SalesPointManagement = () => {
  const [salesPoints, setSalesPoints] = useState(mockSalesPoints);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSalesPointForm, setShowSalesPointForm] = useState(false);
  const [editingSalesPoint, setEditingSalesPoint] = useState(null);

  const filteredSalesPoints = salesPoints.filter(sp => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      sp.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      sp.address.toLowerCase().includes(lowerCaseSearchTerm) ||
      sp.associatedUsers.some(user => user.name.toLowerCase().includes(lowerCaseSearchTerm))
    );
  });

  const handleAssociateUsers = (salesPoint) => {
    setEditingSalesPoint(salesPoint);
    setShowSalesPointForm(true);
  };

  const handleSaveAssociation = (updatedSalesPoint) => {
    setSalesPoints(prev => prev.map(sp => sp.id === updatedSalesPoint.id ? updatedSalesPoint : sp));
    setShowSalesPointForm(false);
    setEditingSalesPoint(null);
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
            placeholder="Buscar punto de venta o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>

        {/* No "New Sales Point" button as sales points are offices */}
        {/* Instead, a button to manage associations for an existing office could be here, or directly on cards */}
      </div>

      {/* Sales Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSalesPoints.length > 0 ? (
            filteredSalesPoints.map((sp, index) => (
              <motion.div
                key={sp.id}
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
                      {sp.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {sp.address}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handleAssociateUsers(sp)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Link className="w-4 h-4" /> Asociar Usuarios
                  </motion.button>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" /> Usuarios Asociados:
                  </p>
                  {sp.associatedUsers && sp.associatedUsers.length > 0 ? (
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      {sp.associatedUsers.map(user => (
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
              No se encontraron puntos de venta.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sales Point Form Modal (for associating users) */}
      <AnimatePresence>
        {showSalesPointForm && (
          <SalesPointForm
            salesPoint={editingSalesPoint}
            allUsers={mockUsers.filter(u => u.role === 'advisor')} // Only show advisors for association
            onSave={handleSaveAssociation}
            onClose={() => setShowSalesPointForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SalesPointManagement;