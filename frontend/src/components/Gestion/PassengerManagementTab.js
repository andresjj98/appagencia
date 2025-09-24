import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit, Trash2, X, Save, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PassengerForm = ({ passenger, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    passenger || {
      name: '',
      lastname: '',
      document_type: 'DNI',
      document_number: '',
      birth_date: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0.5, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-100 p-4 rounded-lg border border-gray-300 mb-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-bold text-lg">{passenger ? 'Editar Pasajero' : 'Añadir Pasajero'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" required />
          <input name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Apellido" className="p-2 border rounded" required />
          <select name="document_type" value={formData.document_type} onChange={handleChange} className="p-2 border rounded">
            <option>DNI</option>
            <option>Pasaporte</option>
            <option>Otro</option>
          </select>
          <input name="document_number" value={formData.document_number} onChange={handleChange} placeholder="Número de Documento" className="p-2 border rounded" required />
          <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="p-2 border rounded" required />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md text-sm font-medium">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">Guardar Pasajero</button>
        </div>
      </form>
    </motion.div>
  );
};

const PassengerManagementTab = ({ reservation, onUpdate }) => {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState(null);

  const reservationId = reservation._original.id;

  const fetchPassengers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/passengers`);
      if (!response.ok) throw new Error('Failed to fetch passengers');
      const data = await response.json();
      setPassengers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  const handleSave = async (passengerData) => {
    try {
      const response = await fetch(`http://localhost:4000/api/reservations/${reservationId}/passengers/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([passengerData]), // Upsert endpoint expects an array
      });
      if (!response.ok) throw new Error('Failed to save passenger');
      
      fetchPassengers(); // Refetch list
      onUpdate(); // Notify parent
      setIsFormOpen(false);
      setEditingPassenger(null);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleDelete = async (passengerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pasajero?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/passengers/${passengerId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete passenger');
        
        fetchPassengers(); // Refetch list
        onUpdate(); // Notify parent
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Pasajeros de la Reserva</h3>
        {!isFormOpen && (
          <button onClick={() => { setIsFormOpen(true); setEditingPassenger(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
            <UserPlus className="w-4 h-4" />
            Añadir Pasajero
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && <PassengerForm passenger={editingPassenger} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />}
      </AnimatePresence>

      <div className="space-y-3">
        {passengers.map(pax => (
          <div key={pax.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div>
              <p className="font-semibold">{pax.name} {pax.lastname}</p>
              <p className="text-sm text-gray-500">{pax.document_type}: {pax.document_number}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingPassenger(pax); setIsFormOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(pax.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PassengerManagementTab;
