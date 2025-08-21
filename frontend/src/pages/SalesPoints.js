import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search
} from 'lucide-react';
import { mockUsers } from '../mock/users';
import { mockOffices as importedMockOffices } from '../mock/offices';
import SalesPointForm from '../components/SalesPoints/SalesPointForm';
import SalesPointCard from '../components/SalesPoints/SalesPointCard'; // Import the new card component

// Initial mock data for sales points
const initialSalesPoints = importedMockOffices && importedMockOffices.length > 0 ? importedMockOffices.map(office => ({
  ...office,
  // Example association: randomly assign some advisors to offices for initial load
  // In a real app, this would come from a database
  associatedUsers: mockUsers.filter(user => user.role === 'advisor' && Math.random() > 0.5)
})) : [];

const SalesPointManagement = () => {
  const [salesPoints, setSalesPoints] = useState(initialSalesPoints);
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

  const handleAssignUser = (salesPoint) => {
    setEditingSalesPoint(salesPoint);
    setShowSalesPointForm(true);
  };

  const handleRemoveUser = (salesPointId, userIdToRemove) => {
    setSalesPoints(prev => prev.map(sp => 
      sp.id === salesPointId 
        ? { ...sp, associatedUsers: sp.associatedUsers.filter(user => user.id !== userIdToRemove) }
        : sp
    ));
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
      </div>

      {/* Sales Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredSalesPoints.length > 0 ? (
            filteredSalesPoints.map((sp, index) => (
              <SalesPointCard
                key={sp.id}
                salesPoint={sp}
                onRemoveUser={handleRemoveUser}
                onAssignUser={handleAssignUser}
                index={index}
              />
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
            allUsers={mockUsers.filter(u => u.role === 'advisor' || u.role === 'manager')} // Only show relevant roles for association
            onSave={handleSaveAssociation}
            onClose={() => setShowSalesPointForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SalesPointManagement;