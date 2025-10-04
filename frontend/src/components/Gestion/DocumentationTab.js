import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, File, Trash2, Loader, Download, FileText, Eye } from 'lucide-react';
import { generateInvoice, saveDocumentRecord } from '../../utils/documentGenerator';
import { useAuth } from '../../pages/AuthContext';

const DocumentationTab = ({ reservation, onUpdate }) => {
  const { currentUser } = useAuth();
  const [attachments, setAttachments] = useState(reservation._original.reservation_attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nextId, setNextId] = useState(0);

  // Verificar permisos: solo admin y superadmin pueden generar documentos
  const canGenerateDocuments = currentUser?.role === 'administrador' || currentUser?.role === 'superadmin';

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
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation._original.id}/attachments/upsert`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al guardar los documentos.');
      }

      alert('Documentación actualizada con éxito');
      onUpdate();
      setNewAttachments([]);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);

      // Obtener datos completos de la reserva incluyendo business_settings
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation._original.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos de la reserva');
      }

      const fullReservationData = await response.json();
      console.log('Datos completos de reserva:', fullReservationData);

      // Generar factura con datos completos
      generateInvoice(fullReservationData);

      await saveDocumentRecord(
        reservation._original.id,
        'invoice',
        fullReservationData
      );

      alert('Factura generada correctamente');
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('No se pudo generar la factura');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateVoucher = async () => {
    try {
      setGenerating(true);
      alert('Funcionalidad de voucher en desarrollo');
    } catch (error) {
      console.error('Error generating voucher:', error);
      alert('No se pudo generar el voucher');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewInvoice = () => {
    generateInvoice(reservation._original);
  };

  const hasChanges = newAttachments.length > 0 || attachments.length !== (reservation._original.reservation_attachments || []).length;

  return (
    <div className="space-y-8">
      {/* Sección de Documentos Oficiales (Factura, Voucher) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Documentos Oficiales
        </h3>

        {/* Información de factura */}
        {reservation._original.invoice_number && (
          <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">N° Factura:</span> {reservation._original.invoice_number}
            </p>
            {reservation._original.approved_at && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Aprobada:</span> {new Date(reservation._original.approved_at).toLocaleDateString('es-CO')}
              </p>
            )}
          </div>
        )}

        {/* Botones según permisos */}
        {canGenerateDocuments ? (
          <div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateInvoice}
                disabled={generating || !reservation._original.invoice_number}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={!reservation._original.invoice_number ? 'La reserva debe estar aprobada' : ''}
              >
                <Download className="w-4 h-4" />
                {generating ? 'Generando...' : 'Generar Factura'}
              </button>
              <button
                onClick={handleGenerateVoucher}
                disabled={generating || !reservation._original.invoice_number}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Generar Voucher
              </button>
            </div>
            {!reservation._original.invoice_number && (
              <p className="text-sm text-amber-600 mt-3 flex items-center gap-1">
                ⚠️ La reserva debe estar aprobada para generar documentos oficiales
              </p>
            )}
          </div>
        ) : (
          <div>
            {reservation._original.invoice_number ? (
              <button
                onClick={handleViewInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver Factura
              </button>
            ) : (
              <p className="text-sm text-gray-600">
                Los documentos oficiales estarán disponibles una vez la reserva sea aprobada.
              </p>
            )}
          </div>
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
    </div>
  );
};

export default DocumentationTab;