import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings as SettingsIcon, 
  Lock, 
  Mail, 
  Image, 
  Save, 
  Palette, 
  Bell, 
  Globe,
  Key,
  CheckCircle,
  XCircle,
  Briefcase, // For Business Settings
  Building,
  FileText as FileTextIcon,
  SlidersHorizontal
} from 'lucide-react';
import { currentUser, setCurrentUser } from '../mock/users';
import { USER_ROLES } from '../utils/constants';

const SectionWrapper = ({ title, icon: Icon, children }) => (
  <motion.div
    className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.5 }}
  >
    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
      <Icon className="w-7 h-7 text-blue-600" />
      {title}
    </h3>
    <div className="space-y-5">
      {children}
    </div>
  </motion.div>
);

const BusinessSettings = () => {
  const [settings, setSettings] = useState({
    // General and Fiscal Info
    id: null,
    agencyName: '',
    logoUrl: '',
    legalName: '',
    contactInfo: '',
    taxIdNumber: '', // NIT
    taxRegistry: '', // RUT
    legalRepresentativeName: '',
    legalRepresentativeId: '',
    taxRegime: '',
    operatingCity: '',
    operatingCountry: '',
    tourismRegistryNumber: '',

    // Documentation
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

    // System and Finance
    nextInvoiceNumber: 1001,
    invoiceFormat: 'INV-####',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
    taxRate: 21,
    preferredDateFormat: 'DD/MM/AAAA'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState('');

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
        // Rellena los valores nulos de la BD con cadenas vacías para los componentes controlados
        const sanitizedData = {};
        for (const key in data) {
            sanitizedData[key] = data[key] === null ? '' : data[key];
        }
        setSettings(sanitizedData);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setUpdateSuccess(false);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar la configuración.');
      }
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <p className="text-lg text-gray-600">Cargando configuración del negocio...</p>
      </div>
    );
  }

  if (error && !isSaving) {
    return <div className="text-red-600 p-10">Error: {error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <SectionWrapper title="Información General y Fiscal" icon={Building}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Nombre Comercial (Agencia)</label><input type="text" name="agencyName" value={settings.agencyName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Razón Social (Nombre Jurídico)</label><input type="text" name="legalName" value={settings.legalName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">URL del Logo</label><input type="url" name="logoUrl" value={settings.logoUrl} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Información de Contacto (Dirección, Teléfonos, etc.)</label><textarea name="contactInfo" value={settings.contactInfo} onChange={handleChange} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">NIT (Número Identificación Tributaria)</label><input type="text" name="taxIdNumber" value={settings.taxIdNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">RUT (Registro Único Tributario)</label><input type="text" name="taxRegistry" value={settings.taxRegistry} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Representante Legal</label><input type="text" name="legalRepresentativeName" value={settings.legalRepresentativeName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Documento del Representante</label><input type="text" name="legalRepresentativeId" value={settings.legalRepresentativeId} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Régimen Tributario</label><input type="text" name="taxRegime" value={settings.taxRegime} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: Régimen Común, Simple..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Número de Registro de Turismo</label><input type="text" name="tourismRegistryNumber" value={settings.tourismRegistryNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: RNT-12345" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Ciudad de Operación</label><input type="text" name="operatingCity" value={settings.operatingCity} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">País de Operación</label><input type="text" name="operatingCountry" value={settings.operatingCountry} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
      </SectionWrapper>

      <SectionWrapper title="Configuración de Documentación" icon={FileTextIcon}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Encabezado para Vouchers</label><input type="text" name="voucherHeader" value={settings.voucherHeader} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Encabezado para Contratos</label><input type="text" name="contractHeader" value={settings.contractHeader} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Términos y Condiciones</label><textarea name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Contrato de Viaje</label><textarea name="travelContract" value={settings.travelContract} onChange={handleChange} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Políticas de Cancelación</label><textarea name="cancellationPolicies" value={settings.cancellationPolicies} onChange={handleChange} rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Información Adicional para Voucher</label><textarea name="voucherInfo" value={settings.voucherInfo} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Pie de Página Predeterminado</label><input type="text" name="defaultFooter" value={settings.defaultFooter} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Firma Digital (URL o Texto)</label><input type="text" name="digitalSignature" value={settings.digitalSignature} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Logo Secundario / Marca de Agua (URL)</label><input type="url" name="secondaryLogoUrl" value={settings.secondaryLogoUrl} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
        <div className="pt-4 border-t">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Mensajes Automáticos por Documento</h4>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Factura</label><textarea name="invoiceMessage" value={settings.invoiceMessage} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Voucher</label><textarea name="voucherMessage" value={settings.voucherMessage} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Mensaje en Contrato</label><textarea name="contractMessage" value={settings.contractMessage} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
        </div>
      </SectionWrapper>

      <SectionWrapper title="Configuración de Sistema y Finanzas" icon={SlidersHorizontal}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Inicializar Consecutivo de Facturas</label><input type="number" name="nextInvoiceNumber" value={settings.nextInvoiceNumber} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Formato de Factura</label><input type="text" name="invoiceFormat" value={settings.invoiceFormat} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Ej: DV-2025-####" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Moneda Principal</label><select name="currency" value={settings.currency} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg"><option value="EUR">Euro (€)</option><option value="USD">Dólar Americano ($)</option><option value="COP">Peso Colombiano ($)</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Impuesto (IVA %)</label><input type="number" name="taxRate" value={settings.taxRate} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Formato de Fecha</label><select name="preferredDateFormat" value={settings.preferredDateFormat} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg"><option value="DD/MM/AAAA">DD/MM/AAAA</option><option value="MM/DD/AAAA">MM/DD/AAAA</option><option value="AAAA-MM-DD">AAAA-MM-DD</option></select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label><select name="timezone" value={settings.timezone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg"><option value="Europe/Madrid">Europa/Madrid</option><option value="America/Bogota">América/Bogotá</option><option value="America/New_York">América/New York</option></select></div>
      </SectionWrapper>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        {updateSuccess && (
          <motion.p className="text-green-600 font-medium flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle className="w-5 h-5" /> ¡Configuración guardada con éxito!
          </motion.p>
        )}
        {error && isSaving && (
           <motion.p className="text-red-600 font-medium flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <XCircle className="w-5 h-5" /> {error}
          </motion.p>
        )}
        <motion.button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Save className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar Configuración del Negocio'}
        </motion.button>
      </div>
    </form>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'business'

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar,
    newPassword: '',
    confirmNewPassword: ''
  });
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    notificationsEnabled: true,
    defaultCurrency: 'EUR',
    language: 'es',
  });
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [appSettingsUpdateSuccess, setAppSettingsUpdateSuccess] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setCurrentUser({ ...currentUser, name: profileData.name, email: profileData.email, avatar: profileData.avatar });
    setProfileUpdateSuccess(true);
    setTimeout(() => setProfileUpdateSuccess(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordChangeSuccess(false);
    setPasswordChangeError('');

    if (profileData.newPassword !== profileData.confirmNewPassword) {
      setPasswordChangeError('Las contraseñas no coinciden. ¡Asegúrate de que tus dedos saben lo que hacen!');
      return;
    }
    if (profileData.newPassword.length < 6) {
      setPasswordChangeError('La contraseña debe tener al menos 6 caracteres. ¡No seas tan fácil!');
      return;
    }

    setCurrentUser({ ...currentUser, password: profileData.newPassword });
    setProfileData(prev => ({ ...prev, newPassword: '', confirmNewPassword: '' }));
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  const handleAppSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAppSettingsSubmit = (e) => {
    e.preventDefault();
    console.log('App Settings Saved:', appSettings);
    setAppSettingsUpdateSuccess(true);
    setTimeout(() => setAppSettingsUpdateSuccess(false), 3000);
  };

  return (
    <motion.div
      className="p-6 space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Navigation Bar for Settings */}
      <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100 flex items-center justify-around">
        <motion.button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <User className="w-5 h-5" />
          Mi Perfil
        </motion.button>
        {['admin', 'manager'].includes(currentUser.role) && (
          <motion.button
            onClick={() => setActiveTab('business')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'business'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Briefcase className="w-5 h-5" />
            Configuración del Negocio
          </motion.button>
        )}
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Profile Settings */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <User className="w-7 h-7 text-blue-600" />
              Información Personal
            </h3>
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <img src={profileData.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-md" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Avatar
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={profileData.avatar}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {profileUpdateSuccess && (
                <motion.p 
                  className="text-green-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle className="w-5 h-5" /> ¡Perfil actualizado con éxito!
                </motion.p>
              )}
              <motion.button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-5 h-5" />
                Guardar Cambios
              </motion.button>
            </form>
          </motion.div>

          {/* Password Change */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Lock className="w-7 h-7 text-purple-600" />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={profileData.confirmNewPassword}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              {passwordChangeError && (
                <motion.p 
                  className="text-red-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <XCircle className="w-5 h-5" /> {passwordChangeError}
                </motion.p>
              )}
              {passwordChangeSuccess && (
                <motion.p 
                  className="text-green-600 font-medium flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle className="w-5 h-5" /> ¡Contraseña cambiada con éxito!
                </motion.p>
              )}
              <motion.button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Key className="w-5 h-5" />
                Cambiar Contraseña
              </motion.button>
            </form>
          </motion.div>
        </>
      )}

      {activeTab === 'business' && ['admin', 'manager'].includes(currentUser.role) && (
        <BusinessSettings />
      )}
    </motion.div>
  );
};

export default Settings;