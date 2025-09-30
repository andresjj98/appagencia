const { supabaseAdmin } = require('../supabase');

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

const sanitizeSettings = (record = {}) => {
  const keys = new Set([
    ...Object.keys(DEFAULT_SETTINGS),
    ...Object.keys(record || {}),
  ]);

  const sanitized = {};

  for (const key of keys) {
    const incoming = record[key];

    if (incoming === null || incoming === undefined || incoming === '') {
      sanitized[key] = DEFAULT_SETTINGS.hasOwnProperty(key)
        ? DEFAULT_SETTINGS[key]
        : '';
      continue;
    }

    if (NUMBER_FIELDS.has(key)) {
      const numericValue = Number(incoming);
      sanitized[key] = Number.isFinite(numericValue)
        ? numericValue
        : DEFAULT_SETTINGS[key];
      continue;
    }

    sanitized[key] = incoming;
  }

  if (!sanitized.hasOwnProperty('id')) {
    sanitized.id = record.id ?? null;
  }

  return sanitized;
};

const mapPayloadToRow = (payload = {}) => {
  const row = {};

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key === 'id') {
      continue;
    }

    if (!payload.hasOwnProperty(key)) {
      continue;
    }

    const value = payload[key];

    if (value === '' || value === undefined) {
      row[key] = null;
      continue;
    }

    if (NUMBER_FIELDS.has(key)) {
      const numericValue = Number(value);
      row[key] = Number.isFinite(numericValue) ? numericValue : null;
      continue;
    }

    row[key] = value;
  }

  if (payload.id) {
    row.id = payload.id;
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
      return res.status(500).json({ message: 'Error al obtener la configuración del negocio.' });
    }

    const response = data ? sanitizeSettings(data) : { ...DEFAULT_SETTINGS };

    return res.json(response);
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
      return res.status(500).json({ message: 'Error al preparar la actualización de la configuración.' });
    }

    if (existing?.id && !row.id) {
      row.id = existing.id;
    }

    const { data, error } = await supabaseAdmin
      .from('business_settings')
      .upsert(row, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error upserting business settings:', error);
      return res.status(500).json({ message: 'Error al guardar la configuración del negocio.' });
    }

    const response = data ? sanitizeSettings(data) : sanitizeSettings(row);

    return res.json(response);
  } catch (err) {
    console.error('Unexpected error upserting business settings:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getBusinessSettings,
  upsertBusinessSettings,
};
