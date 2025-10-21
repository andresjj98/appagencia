import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, File, Trash2, Loader, FileText, FileDown } from 'lucide-react';
import { generateCustomReservationDocument } from '../../utils/reservationDocumentGenerator';
import ReservationDocumentGenerator from './ReservationDocumentGenerator';
import { useAuth } from '../../pages/AuthContext';
import api from '../../utils/api';

const DocumentationTab = ({ reservation, onUpdate }) => {
  const { currentUser } = useAuth();
  const [attachments, setAttachments] = useState(reservation._original.reservation_attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nextId, setNextId] = useState(0);
  const [showCustomDocModal, setShowCustomDocModal] = useState(false);

  // Verificar permisos: admin, gestor y superadmin pueden generar documentos
  const canGenerateDocuments = currentUser?.role === 'administrador' || currentUser?.role === 'gestor' || currentUser?.role === 'superadmin';

  const addNewRow = () => {
    setNewAttachments(prev => [...prev, { id: nextId, title: '', observation: '', file: null }]);
    setNextId(prev => prev + 1);
  };

  const updateNewAttachment = (id, field, value) => {
    setNewAttachments(prev => 
      prev.map(att => (att.id === id ? { ...att, [field]: value } : att))
    );
  };

  const removeNewAttachment = (id) => {
    setNewAttachments(prev => prev.filter(att => att.id !== id));
  };

  const removeExistingAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSave = async () => {
    const filesToUpload = newAttachments.filter(att => att.file && att.title);
    if (newAttachments.some(att => !att.title || !att.file)) {
        alert('Cada nuevo documento debe tener un título y un archivo seleccionado.');
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    const metadata = [
      ...attachments.map(att => ({ id: att.id, title: att.title, observation: att.observation, file_name: att.file_name, file_url: att.file_url })),
      ...filesToUpload.map(att => ({ title: att.title, observation: att.observation, fileName: att.file.name }))
    ];

    formData.append('metadata', JSON.stringify(metadata));

    filesToUpload.forEach(att => {
      formData.append('files', att.file);
    });

    try {
      await api.post(`/reservations/${reservation._original.id}/attachments/upsert`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Documentación actualizada con éxito');
      onUpdate();
      setNewAttachments([]);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateCustomDocument = async (selectedSections) => {
    try {
      await generateCustomReservationDocument(reservation, selectedSections);
      setShowCustomDocModal(false);
    } catch (error) {
      console.error('Error generating custom document:', error);
      throw error;
    }
  };

  const hasChanges = newAttachments.length > 0 || attachments.length !== (reservation._original.reservation_attachments || []).length;

  return (
    <div className="space-y-8">
      {/* Sección de Documentos Personalizados */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Generación de Documentos
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Genera documentos personalizados con la información de la reserva que necesites incluir.
        </p>

        {/* Botón de documento personalizado */}
        {canGenerateDocuments ? (
          <button
            onClick={() => setShowCustomDocModal(true)}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            Crear Documento Personalizado
          </button>
        ) : (
          <p className="text-sm text-gray-600">
            No tienes permisos para generar documentos.
          </p>
        )}
      </div>

      {/* Sección de Adjuntos del Cliente */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Nuevos Documentos Adjuntos</h3>
        <div className="space-y-4">
            <AnimatePresence>
                {newAttachments.map((att, index) => (
                    <motion.div 
                        key={att.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                    >
                        <input value={att.title} onChange={(e) => updateNewAttachment(att.id, 'title', e.target.value)} placeholder="Título del documento*" className="p-2 border rounded w-1/3" />
                        <input value={att.observation} onChange={(e) => updateNewAttachment(att.id, 'observation', e.target.value)} placeholder="Observación" className="p-2 border rounded w-1/3" />
                        <label className="flex-grow w-1/3 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-md text-sm text-gray-600 hover:bg-gray-100">
                            <Upload size={16}/>
                            <span>{att.file ? att.file.name : 'Seleccionar archivo*'}</span>
                            <input type="file" onChange={(e) => updateNewAttachment(att.id, 'file', e.target.files[0])} className="hidden" />
                        </label>
                        <button onClick={() => removeNewAttachment(att.id)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
        <button onClick={addNewRow} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200">
            <Plus size={16}/>
            Agregar otro archivo
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Documentos Adjuntos Existentes</h3>
        <div className="space-y-3">
          {attachments.length > 0 ? attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-medium text-blue-600 hover:underline">
                <File className="h-5 w-5" />
                <span>{att.title || att.file_name}</span>
              </a>
              <button onClick={() => removeExistingAttachment(att.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
            </div>
          )) : <p className="text-sm text-gray-500">No hay documentos para esta reserva.</p>}
        </div>
      </div>

      {hasChanges && (
        <div className="pt-6 border-t flex justify-end">
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="w-48 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-all"
          >
            {isUploading ? <Loader className="animate-spin w-5 h-5" /> : 'Guardar Cambios'}
          </button>
        </div>
      )}

      {/* Modal para generación de documento personalizado */}
      {showCustomDocModal && (
        <ReservationDocumentGenerator
          reservation={reservation}
          onClose={() => setShowCustomDocModal(false)}
          onGenerate={handleGenerateCustomDocument}
        />
      )}
    </div>
  );
};

export default DocumentationTab;
