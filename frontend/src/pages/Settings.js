import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  CheckCircle,
  XCircle,
  Building,
  FileText as FileTextIcon,
  SlidersHorizontal,
  Pencil,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Users,
  MapPin
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { hasPermission } from '../utils/constants';
import UserManagement from './Users';
import OfficeManagement from './Offices';

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General y Fiscal', title: 'Información General y Fiscal', icon: Building },
  { id: 'documents', label: 'Documentación', title: 'Documentación y Mensajes', icon: FileTextIcon },
  { id: 'system', label: 'Sistema y Finanzas', title: 'Configuración de Sistema y Finanzas', icon: SlidersHorizontal },
  { id: 'users', label: 'Usuarios', title: 'Gestión de Usuarios', icon: Users },
  { id: 'offices', label: 'Oficinas', title: 'Gestión de Oficinas', icon: MapPin },
];

const DEFAULT_SETTINGS = {
  id: null,
  agencyName: '',
  logoUrl: '',
  legalName: '',
  contactInfo: '',
  taxIdNumber: '',
  taxRegistry: '',
  legalRepresentativeName: '',
  legalRepresentativeId: '',
  taxRegime: '',
  operatingCity: '',
  operatingCountry: '',
  tourismRegistryNumber: '',
  termsAndConditions: '',
  travelContract: '',
  cancellationPolicies: '',
  voucherInfo: '',
  voucherHeader: '',
  contractHeader: '',
  defaultFooter: '',
  digitalSignature: '',
  secondaryLogoUrl: '',
  invoiceMessage: '',
  voucherMessage: '',
  contractMessage: '',
  nextInvoiceNumber: 1001,
  invoiceFormat: 'INV-####',
  currency: 'EUR',
  timezone: 'Europe/Madrid',
  taxRate: 21,
  preferredDateFormat: 'DD/MM/AAAA',
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
};

const ReadOnlyValue = ({ value, placeholder = 'Sin definir', multiline = false, children }) => {
  if (children) {
    return (
      <div className="px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-700 overflow-hidden">
        {children}
      </div>
    );
  }

  const display = hasValue(value) ? value : <span className="text-gray-400 italic">{placeholder}</span>;
  return (
    <div
      className={`px-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-sm text-gray-700 ${
        multiline ? 'whitespace-pre-wrap' : ''
      }`}
    >
      {display}
    </div>
  );
};

const SectionWrapper = ({ section, children }) => {
  const Icon = section.icon;
  return (
    <motion.section
      key={section.id}
      className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200 ring-2 ring-blue-200"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <Icon className="w-7 h-7 text-blue-600" />
        {section.title}
      </h3>
      {children}
    </motion.section>
  );
};

const BusinessSettings = ({ activeSection }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [formValues, setFormValues] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadMessage, setLogoUploadMessage] = useState({ text: '', type: '' });
  const logoInputRef = useRef(null);
  const secondaryLogoInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:4000/api/business-settings');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar la configuración.');
        }

        const sanitized = { ...DEFAULT_SETTINGS };
        Object.entries(data || {}).forEach(([key, value]) => {
          if (key === 'contactInfo' && value && typeof value === 'object') {
            sanitized[key] = JSON.stringify(value, null, 2);
            return;
          }
          sanitized[key] = value === null || value === undefined ? DEFAULT_SETTINGS[key] ?? '' : value;
        });
        if (!('id' in sanitized)) {
          sanitized.id = data?.id ?? null;
        }

        setSettings(sanitized);
        setFormValues(sanitized);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!updateSuccess) return undefined;
    const timer = setTimeout(() => setUpdateSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [updateSuccess]);

  const bindField = (name) => ({
    name,
    value: formValues[name] ?? '',
    onChange: (event) => {
      const { value } = event.target;
      setFormValues((prev) => ({ ...prev, [name]: value }));
    },
  });

  const handleStartEditing = () => {
    setError('');
    setFormValues(settings);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setError('');
    setFormValues(settings);
    setIsEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditing || isSaving) return;

    setIsSaving(true);
    setUpdateSuccess(false);
    setError('');

    const payload = { ...formValues };
    if (typeof payload.contactInfo === 'string') {
      const trimmed = payload.contactInfo.trim();
      if (trimmed.length === 0) {
        payload.contactInfo = null;
      } else {
        try {
          payload.contactInfo = JSON.parse(trimmed);
        } catch (parseError) {
          setError('La información de contacto debe ser un JSON válido.');
          setIsSaving(false);
          return;
        }
      }
    }

    try {
      const response = await fetch('http://localhost:4000/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar la configuración.');
      }

      const sanitized = { ...DEFAULT_SETTINGS };
      Object.entries(data || {}).forEach(([key, value]) => {
        if (key === 'contactInfo' && value && typeof value === 'object') {
          sanitized[key] = JSON.stringify(value, null, 2);
          return;
        }
        sanitized[key] = value === null || value === undefined ? DEFAULT_SETTINGS[key] ?? '' : value;
      });
      if (!('id' in sanitized)) {
        sanitized.id = data?.id ?? formValues.id ?? null;
      }

      setSettings(sanitized);
      setFormValues(sanitized);
      setIsEditing(false);
      setUpdateSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (file, type) => {
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoUploadMessage({ text: 'Solo se permiten imágenes JPG, PNG, WEBP o SVG', type: 'error' });
      setTimeout(() => setLogoUploadMessage({ text: '', type: '' }), 4000);
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadMessage({ text: 'La imagen no debe superar los 5MB', type: 'error' });
      setTimeout(() => setLogoUploadMessage({ text: '', type: '' }), 4000);
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadMessage({ text: `Subiendo logo ${type === 'primary' ? 'principal' : 'secundario'}...`, type: 'info' });

    try {
      const formData = new FormData();
      formData.append('logo', file);

      console.log(`Uploading ${type} logo to:`, `http://localhost:4000/api/business-settings/logo/${type}`);

      const response = await fetch(`http://localhost:4000/api/business-settings/logo/${type}`, {
        method: 'PUT',
        body: formData,
      });

      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload result:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Error al subir logo');
      }

      // Actualizar settings con la respuesta
      const sanitized = { ...DEFAULT_SETTINGS };
      Object.entries(result.settings || {}).forEach(([key, value]) => {
        if (key === 'contactInfo' && value && typeof value === 'object') {
          sanitized[key] = JSON.stringify(value, null, 2);
          return;
        }
        sanitized[key] = value === null || value === undefined ? DEFAULT_SETTINGS[key] ?? '' : value;
      });

      setSettings(sanitized);
      setFormValues(sanitized);
      setLogoUploadMessage({ text: result.message || '¡Logo actualizado con éxito!', type: 'success' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoUploadMessage({ text: error.message || 'Error al subir el logo', type: 'error' });
    } finally {
      setIsUploadingLogo(false);
      setTimeout(() => setLogoUploadMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleLogoDelete = async (type) => {
    if (!window.confirm(`¿Estás seguro de eliminar el logo ${type === 'primary' ? 'principal' : 'secundario'}?`)) {
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadMessage({ text: 'Eliminando logo...', type: 'info' });

    try {
      const response = await fetch(`http://localhost:4000/api/business-settings/logo/${type}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar logo');
      }

      // Actualizar settings con la respuesta
      const sanitized = { ...DEFAULT_SETTINGS };
      Object.entries(result.settings || {}).forEach(([key, value]) => {
        if (key === 'contactInfo' && value && typeof value === 'object') {
          sanitized[key] = JSON.stringify(value, null, 2);
          return;
        }
        sanitized[key] = value === null || value === undefined ? DEFAULT_SETTINGS[key] ?? '' : value;
      });

      setSettings(sanitized);
      setFormValues(sanitized);
      setLogoUploadMessage({ text: result.message || '¡Logo eliminado con éxito!', type: 'success' });
    } catch (error) {
      console.error('Error deleting logo:', error);
      setLogoUploadMessage({ text: error.message || 'Error al eliminar el logo', type: 'error' });
    } finally {
      setIsUploadingLogo(false);
      setTimeout(() => setLogoUploadMessage({ text: '', type: '' }), 5000);
    }
  };

  const renderContactInfo = () => {
    const { contactInfo } = settings;
    if (!hasValue(contactInfo)) {
      return <ReadOnlyValue value="" placeholder="Sin información" multiline />;
    }
    try {
      const json = typeof contactInfo === 'string' ? JSON.parse(contactInfo) : contactInfo;
      return (
        <ReadOnlyValue>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(json, null, 2)}</pre>
        </ReadOnlyValue>
      );
    } catch (err) {
      return <ReadOnlyValue value={contactInfo} multiline />;
    }
  };

  const renderGeneralSection = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Comercial</label>
          {isEditing ? (
            <input type="text" {...bindField('agencyName')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Viajes Global" />
          ) : (
            <ReadOnlyValue value={settings.agencyName} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Legal</label>
          {isEditing ? (
            <input type="text" {...bindField('legalName')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre legal registrado" />
          ) : (
            <ReadOnlyValue value={settings.legalName} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Identificación Tributaria (NIT)</label>
          {isEditing ? (
            <input type="text" {...bindField('taxIdNumber')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: 123456789-0" />
          ) : (
            <ReadOnlyValue value={settings.taxIdNumber} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Registro Tributario (RUT)</label>
          {isEditing ? (
            <input type="text" {...bindField('taxRegistry')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.taxRegistry} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Régimen Tributario</label>
          {isEditing ? (
            <input type="text" {...bindField('taxRegime')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.taxRegime} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Registro Nacional de Turismo</label>
          {isEditing ? (
            <input type="text" {...bindField('tourismRegistryNumber')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.tourismRegistryNumber} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Representante Legal</label>
          {isEditing ? (
            <input type="text" {...bindField('legalRepresentativeName')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre completo" />
          ) : (
            <ReadOnlyValue value={settings.legalRepresentativeName} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Documento del Representante Legal</label>
          {isEditing ? (
            <input type="text" {...bindField('legalRepresentativeId')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.legalRepresentativeId} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad de Operación</label>
          {isEditing ? (
            <input type="text" {...bindField('operatingCity')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.operatingCity} />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">País de Operación</label>
          {isEditing ? (
            <input type="text" {...bindField('operatingCountry')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.operatingCountry} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo Principal</label>
          <div className="space-y-3">
            {hasValue(settings.logoUrl) && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg p-2 shadow-sm flex items-center justify-center">
                    <img src={settings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Logo cargado</p>
                    <a href={settings.logoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                      Ver en tamaño completo
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleLogoDelete('primary')}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 w-full justify-center text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar logo
                </button>
              </div>
            )}
            <input
              type="file"
              ref={logoInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleLogoUpload(file, 'primary');
                e.target.value = '';
              }}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {hasValue(settings.logoUrl) ? 'Cambiar logo' : 'Subir logo'}
                </>
              )}
            </button>
            {isEditing && (
              <input type="url" {...bindField('logoUrl')} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="O ingrese una URL directamente" />
            )}
            <p className="text-xs text-gray-500">
              Formatos: JPG, PNG, WEBP, SVG • Máx: 5MB
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Información de Contacto (JSON)</label>
          {isEditing ? (
            <textarea {...bindField('contactInfo')} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder='Ej: {"telefono": "+34 000 000", "email": "contacto@empresa.com"}' />
          ) : (
            renderContactInfo()
          )}
        </div>
      </div>
    </>
  );

  const renderDocumentsSection = () => (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Términos y Condiciones</label>
          {isEditing ? (
            <textarea {...bindField('termsAndConditions')} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.termsAndConditions} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contrato de Viaje</label>
          {isEditing ? (
            <textarea {...bindField('travelContract')} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.travelContract} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Políticas de Cancelación</label>
          {isEditing ? (
            <textarea {...bindField('cancellationPolicies')} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.cancellationPolicies} multiline />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Información adicional para Voucher</label>
          {isEditing ? (
            <textarea {...bindField('voucherInfo')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.voucherInfo} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado de Voucher</label>
          {isEditing ? (
            <textarea {...bindField('voucherHeader')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.voucherHeader} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Encabezado de Contrato</label>
          {isEditing ? (
            <textarea {...bindField('contractHeader')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.contractHeader} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pie de página predeterminado</label>
          {isEditing ? (
            <input type="text" {...bindField('defaultFooter')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.defaultFooter} multiline />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Firma Digital (URL o Texto)</label>
          {isEditing ? (
            <input type="text" {...bindField('digitalSignature')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          ) : (
            <ReadOnlyValue value={settings.digitalSignature} multiline />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo Secundario / Marca de Agua</label>
          <div className="space-y-3">
            {hasValue(settings.secondaryLogoUrl) && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-20 h-20 bg-white rounded-lg p-2 shadow-sm flex items-center justify-center">
                    <img src={settings.secondaryLogoUrl} alt="Logo Secundario" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 mb-1">Logo secundario cargado</p>
                    <a href={settings.secondaryLogoUrl} target="_blank" rel="noreferrer" className="text-xs text-purple-600 hover:underline break-all">
                      Ver en tamaño completo
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleLogoDelete('secondary')}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 w-full justify-center text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar logo secundario
                </button>
              </div>
            )}
            <input
              type="file"
              ref={secondaryLogoInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleLogoUpload(file, 'secondary');
                e.target.value = '';
              }}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => secondaryLogoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 w-full justify-center"
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {hasValue(settings.secondaryLogoUrl) ? 'Cambiar logo secundario' : 'Subir logo secundario'}
                </>
              )}
            </button>
            {isEditing && (
              <input type="url" {...bindField('secondaryLogoUrl')} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" placeholder="O ingrese una URL directamente" />
            )}
            <p className="text-xs text-gray-500">
              Formatos: JPG, PNG, WEBP, SVG • Máx: 5MB
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Mensajes automáticos por documento</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Factura</label>
            {isEditing ? (
              <textarea {...bindField('invoiceMessage')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            ) : (
              <ReadOnlyValue value={settings.invoiceMessage} multiline />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Voucher</label>
            {isEditing ? (
              <textarea {...bindField('voucherMessage')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            ) : (
              <ReadOnlyValue value={settings.voucherMessage} multiline />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Contrato</label>
            {isEditing ? (
              <textarea {...bindField('contractMessage')} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            ) : (
              <ReadOnlyValue value={settings.contractMessage} multiline />
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderSystemSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Consecutivo de Facturas</label>
      
            {isEditing ? (
              <input type="number" {...bindField('nextInvoiceNumber')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
            ) : (
              <ReadOnlyValue value={settings.nextInvoiceNumber} />
            )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Factura</label>
        {isEditing ? (
          <input type="text" {...bindField('invoiceFormat')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: DV-2025-####" />
        ) : (
          <ReadOnlyValue value={settings.invoiceFormat} />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda Principal</label>
        {isEditing ? (
          <select {...bindField('currency')} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="COP">Peso Colombiano (COP)</option>
          </select>
        ) : (
          <ReadOnlyValue value={{ EUR: 'Euro (EUR)', USD: 'Dólar Americano (USD)', COP: 'Peso Colombiano (COP)' }[settings.currency] || settings.currency} />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Impuesto (IVA %)</label>
        {isEditing ? (
          <input type="number" {...bindField('taxRate')} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
        ) : (
          <ReadOnlyValue value={settings.taxRate} />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Fecha Preferido</label>
        {isEditing ? (
          <select {...bindField('preferredDateFormat')} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="DD/MM/AAAA">DD/MM/AAAA</option>
            <option value="MM/DD/AAAA">MM/DD/AAAA</option>
            <option value="AAAA-MM-DD">AAAA-MM-DD</option>
          </select>
        ) : (
          <ReadOnlyValue value={settings.preferredDateFormat} />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
        {isEditing ? (
          <select {...bindField('timezone')} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
            <option value="Europe/Madrid">Europe/Madrid</option>
            <option value="America/Bogota">America/Bogota</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        ) : (
          <ReadOnlyValue value={settings.timezone} />
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 flex items-center justify-center">
        <p className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando configuración...
        </p>
      </div>
    );
  }

  const sectionConfig = SETTINGS_SECTIONS.find((section) => section.id === activeSection) || SETTINGS_SECTIONS[0];

  let sectionContent = null;
  if (sectionConfig.id === 'general') {
    sectionContent = renderGeneralSection();
  } else if (sectionConfig.id === 'documents') {
    sectionContent = renderDocumentsSection();
  } else {
    sectionContent = renderSystemSection();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Consulta la información actual y modifica solo cuando sea necesario.</p>
          {error && !isSaving && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {updateSuccess && (
            <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Configuración guardada con éxito.</span>
            </div>
          )}
          {logoUploadMessage.text && (
            <div className={`mt-2 flex items-center gap-2 text-sm ${
              logoUploadMessage.type === 'success' ? 'text-green-600' :
              logoUploadMessage.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {logoUploadMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
               logoUploadMessage.type === 'error' ? <XCircle className="w-4 h-4" /> :
               <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{logoUploadMessage.text}</span>
            </div>
          )}
        </div>
        {!isEditing ? (
          <motion.button
            type="button"
            onClick={handleStartEditing}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Pencil className="w-4 h-4" />
            Editar configuración
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleCancelEditing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancelar cambios
          </motion.button>
        )}
      </div>

      <SectionWrapper section={sectionConfig}>{sectionContent}</SectionWrapper>

      <div className="flex flex-wrap items-center justify-end gap-4 pt-6 border-t border-gray-200">
        {error && isSaving && (
          <motion.p className="text-red-600 font-medium flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <XCircle className="w-5 h-5" /> {error}
          </motion.p>
        )}
        <div className="flex items-center gap-3">
          {isEditing && (
            <motion.button
              type="button"
              onClick={handleCancelEditing}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Descartar
            </motion.button>
          )}
          <motion.button
            type="submit"
            disabled={!isEditing || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: isEditing && !isSaving ? 1.02 : 1 }}
            whileTap={{ scale: isEditing && !isSaving ? 0.98 : 1 }}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar configuración'}
          </motion.button>
        </div>
      </div>
    </form>
  );
};

const Settings = () => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState(SETTINGS_SECTIONS[0].id);

  if (!hasPermission(currentUser, ['administrador', 'gestor'])) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Acceso denegado</h2>
        <p className="text-gray-600 mt-2">No tienes permisos para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Configuración del Negocio</h2>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Menú de secciones</h3>
          <nav className="flex flex-col gap-2">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="space-y-8">
          {activeSection === 'users' ? (
            <UserManagement />
          ) : activeSection === 'offices' ? (
            <OfficeManagement />
          ) : (
            <BusinessSettings activeSection={activeSection} />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
