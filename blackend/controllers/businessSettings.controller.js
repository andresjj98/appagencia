const { supabaseAdmin } = require('../supabase');

const COLUMN_MAPPING = {
  id: 'id',
  agency_name: 'agencyName',
  legal_name: 'legalName',
  logo_url: 'logoUrl',
  contact_info: 'contactInfo',
  tax_id_number: 'taxIdNumber',
  tax_registry: 'taxRegistry',
  legal_representative_name: 'legalRepresentativeName',
  legal_representative_id: 'legalRepresentativeId',
  tax_regime: 'taxRegime',
  operating_city: 'operatingCity',
  operating_country: 'operatingCountry',
  tourism_registry_number: 'tourismRegistryNumber',
  terms_and_conditions: 'termsAndConditions',
  travel_contract: 'travelContract',
  cancellation_policies: 'cancellationPolicies',
  voucher_info: 'voucherInfo',
  voucher_header: 'voucherHeader',
  contract_header: 'contractHeader',
  default_footer: 'defaultFooter',
  digital_signature: 'digitalSignature',
  secondary_logo_url: 'secondaryLogoUrl',
  invoice_message: 'invoiceMessage',
  voucher_message: 'voucherMessage',
  contract_message: 'contractMessage',
  next_invoice_number: 'nextInvoiceNumber',
  invoice_format: 'invoiceFormat',
  currency: 'currency',
  timezone: 'timezone',
  tax_rate: 'taxRate',
  preferred_date_format: 'preferredDateFormat',
};

const CAMEL_TO_SNAKE = Object.entries(COLUMN_MAPPING).reduce((acc, [snake, camel]) => {
  acc[camel] = snake;
  return acc;
}, {});

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

const NUMBER_FIELDS = new Set(['nextInvoiceNumber', 'taxRate']);

const mapDbToApp = (row = {}) => {
  const mapped = { ...DEFAULT_SETTINGS };

  for (const [snake, camel] of Object.entries(COLUMN_MAPPING)) {
    const value = row[snake];

    if (camel === 'id') {
      mapped.id = value ?? mapped.id ?? null;
      continue;
    }

    if (value === null || value === undefined || value === '') {
      mapped[camel] = DEFAULT_SETTINGS[camel] ?? '';
      continue;
    }

    if (NUMBER_FIELDS.has(camel)) {
      const numericValue = Number(value);
      mapped[camel] = Number.isFinite(numericValue) ? numericValue : DEFAULT_SETTINGS[camel];
      continue;
    }

    mapped[camel] = value;
  }

  return mapped;
};

const sanitizeSettings = (record = {}) => {
  const sanitized = { ...DEFAULT_SETTINGS };

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const incoming = record[key];

    if (incoming === null || incoming === undefined || incoming === '') {
      sanitized[key] = DEFAULT_SETTINGS[key];
      continue;
    }

    if (NUMBER_FIELDS.has(key)) {
      const numericValue = Number(incoming);
      sanitized[key] = Number.isFinite(numericValue) ? numericValue : DEFAULT_SETTINGS[key];
      continue;
    }

    sanitized[key] = incoming;
  }

  sanitized.id = record.id ?? DEFAULT_SETTINGS.id ?? null;
  return sanitized;
};

const mapPayloadToRow = (payload = {}) => {
  const row = {};

  for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
    if (!Object.prototype.hasOwnProperty.call(payload, camel)) {
      continue;
    }

    const value = payload[camel];

    if (camel === 'id') {
      if (value) {
        row[snake] = value;
      }
      continue;
    }

    if (value === '' || value === undefined) {
      row[snake] = null;
      continue;
    }

    if (NUMBER_FIELDS.has(camel)) {
      const numericValue = Number(value);
      row[snake] = Number.isFinite(numericValue) ? numericValue : null;
      continue;
    }

    row[snake] = value;
  }

  return row;
};

const getBusinessSettings = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching business settings:', error);
      return res.status(500).json({ message: 'Error al obtener la configuracion del negocio.' });
    }

    if (!data) {
      return res.json({ ...DEFAULT_SETTINGS });
    }

    const mapped = mapDbToApp(data);
    return res.json(sanitizeSettings(mapped));
  } catch (err) {
    console.error('Unexpected error fetching business settings:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const upsertBusinessSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const row = mapPayloadToRow(payload);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('business_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing business settings:', existingError);
      return res.status(500).json({ message: 'Error al preparar la actualizacion de la configuracion.' });
    }

    if (existing?.id && !row.id) {
      row.id = existing.id;
    }

    const { data, error } = await supabaseAdmin
      .from('business_settings')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error upserting business settings:', error);
      return res.status(500).json({ message: 'Error al guardar la configuracion del negocio.' });
    }

    const source = data ?? row;
    const mapped = mapDbToApp(source);
    return res.json(sanitizeSettings(mapped));
  } catch (err) {
    console.error('Unexpected error upserting business settings:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const uploadLogo = async (req, res) => {
  const { type } = req.params; // 'primary' o 'secondary'
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }

  if (!['primary', 'secondary'].includes(type)) {
    return res.status(400).json({ message: 'Tipo de logo inválido. Use "primary" o "secondary".' });
  }

  try {
    // Obtener configuración actual
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching business settings:', settingsError);
      return res.status(500).json({ message: 'Error al obtener configuración.' });
    }

    // Subir archivo a Supabase Storage
    const filePath = `logos/${type}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('business-assets')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading logo to Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    // Obtener URL pública con timestamp para evitar caché
    const { data: urlData } = supabaseAdmin.storage
      .from('business-assets')
      .getPublicUrl(filePath);

    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Determinar qué campo actualizar
    const fieldToUpdate = type === 'primary' ? 'logo_url' : 'secondary_logo_url';

    // Actualizar o crear configuración
    const upsertData = {
      [fieldToUpdate]: logoUrl
    };

    if (settings?.id) {
      upsertData.id = settings.id;
    }

    const { data, error: updateError } = await supabaseAdmin
      .from('business_settings')
      .upsert(upsertData, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating business settings with logo URL:', updateError);
      throw new Error('Error al actualizar la configuración con el logo.');
    }

    const mapped = mapDbToApp(data);
    return res.status(200).json({
      message: `Logo ${type === 'primary' ? 'principal' : 'secundario'} subido exitosamente.`,
      settings: sanitizeSettings(mapped)
    });

  } catch (error) {
    console.error('Server error in logo upload:', error);
    return res.status(500).json({
      message: 'Error del servidor al subir logo.',
      details: error.message
    });
  }
};

const deleteLogo = async (req, res) => {
  const { type } = req.params; // 'primary' o 'secondary'

  if (!['primary', 'secondary'].includes(type)) {
    return res.status(400).json({ message: 'Tipo de logo inválido. Use "primary" o "secondary".' });
  }

  try {
    // Obtener configuración actual
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching business settings:', settingsError);
      return res.status(500).json({ message: 'Error al obtener configuración.' });
    }

    if (!settings) {
      return res.status(404).json({ message: 'No se encontró configuración del negocio.' });
    }

    // Determinar qué campo actualizar
    const fieldToUpdate = type === 'primary' ? 'logo_url' : 'secondary_logo_url';

    // Actualizar configuración eliminando el logo
    const { data, error: updateError } = await supabaseAdmin
      .from('business_settings')
      .update({ [fieldToUpdate]: null })
      .eq('id', settings.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      console.error('Error removing logo from business settings:', updateError);
      throw new Error('Error al eliminar el logo de la configuración.');
    }

    const mapped = mapDbToApp(data);
    return res.status(200).json({
      message: `Logo ${type === 'primary' ? 'principal' : 'secundario'} eliminado exitosamente.`,
      settings: sanitizeSettings(mapped)
    });

  } catch (error) {
    console.error('Server error in logo deletion:', error);
    return res.status(500).json({
      message: 'Error del servidor al eliminar logo.',
      details: error.message
    });
  }
};

module.exports = {
  getBusinessSettings,
  upsertBusinessSettings,
  uploadLogo,
  deleteLogo,
};
