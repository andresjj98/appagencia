import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHANGE_OPTIONS = [
  { value: 'holder', label: 'Modificar información del titular' },
  { value: 'itinerary', label: 'Modificar ciclo de viaje' },
  { value: 'hotels', label: 'Modificar hoteles' },
  { value: 'other', label: 'Otro' }
];

const ChangeRequestModal = ({ reservation, onClose }) => {
  const [step, setStep] = useState(1);
  const [option, setOption] = useState('');
  const [field, setField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:4000/api/reservations/${reservation.id}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: option, field, newValue })
      });
      onClose();
    } catch (error) {
      console.error('Error sending change request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg p-6 w-full max-w-md"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
        >
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Solicitud de cambio</h2>
              <ul className="space-y-2 mb-6">
                {CHANGE_OPTIONS.map(opt => (
                  <li key={opt.value}>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                      onClick={() => { setOption(opt.value); setStep(2); }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="text-right">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-4">{CHANGE_OPTIONS.find(o => o.value === option)?.label}</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Campo a modificar</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={field}
                  onChange={e => setField(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nuevo dato</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setStep(1)}
                >
                  Atrás
                </button>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !field || !newValue}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChangeRequestModal;