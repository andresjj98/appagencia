const { supabaseAdmin } = require('../supabase');

const OFFICE_SELECT = 'id, name, address, phone, email, manager, active';

const sanitizeOfficePayload = (body = {}) => {
  const toTrimmed = (value) => {
    if (value === undefined || value === null) return undefined;
    return value.toString().trim();
  };

  const payload = {};

  if (body.name !== undefined) {
    const name = toTrimmed(body.name);
    if (name) payload.name = name;
  }

  if (body.address !== undefined) {
    const address = toTrimmed(body.address);
    if (address) payload.address = address;
  }

  if (body.phone !== undefined) {
    const phone = toTrimmed(body.phone);
    payload.phone = phone || null;
  }

  if (body.email !== undefined) {
    const email = toTrimmed(body.email);
    payload.email = email || null;
  }

  if (body.manager !== undefined) {
    const manager = toTrimmed(body.manager);
    payload.manager = manager || null;
  }

  if (body.active !== undefined) {
    payload.active = !!body.active;
  }

  return payload;
};

const ensureRequiredOfficeFields = (body = {}) => {
  const missing = [];
  if (!body.name || !body.name.toString().trim()) missing.push('name');
  if (!body.address || !body.address.toString().trim()) missing.push('address');
  return missing;
};

const getAllOffices = async (_req, res) => {
  try {
    const { data: offices, error: officesError } = await supabaseAdmin
      .from('offices')
      .select(OFFICE_SELECT)
      .order('name', { ascending: true });

    if (officesError) {
      console.error('Error fetching offices:', officesError);
      return res.status(500).json({ message: 'Error al obtener oficinas.' });
    }

    // Obtener usuarios asignados a cada oficina
    const { data: users, error: usersError } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, email, username, avatar, office_id')
      .not('office_id', 'is', null);

    if (usersError) {
      console.error('Error fetching users for offices:', usersError);
      return res.status(500).json({ message: 'Error al obtener usuarios de oficinas.' });
    }

    // Agrupar usuarios por oficina
    const usersByOffice = new Map();
    for (const user of users || []) {
      if (!usersByOffice.has(user.office_id)) {
        usersByOffice.set(user.office_id, []);
      }
      usersByOffice.get(user.office_id).push({
        id: user.id,
        name: user.last_name ? `${user.name} ${user.last_name}`.trim() : user.name || '',
        email: user.email || '',
        avatar: user.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${user.username || user.email}`,
      });
    }

    const response = (offices || []).map((office) => ({
      id: office.id,
      name: office.name || '',
      address: office.address || '',
      phone: office.phone || '',
      email: office.email || '',
      manager: office.manager || '',
      active: office.active ?? true,
      associatedUsers: usersByOffice.get(office.id) || [],
    }));

    return res.json(response);
  } catch (err) {
    console.error('Unexpected error fetching offices:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const createOffice = async (req, res) => {
  try {
    const missing = ensureRequiredOfficeFields(req.body || {});
    if (missing.length > 0) {
      return res.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}` });
    }

    const payload = sanitizeOfficePayload(req.body || {});

    const { data, error } = await supabaseAdmin
      .from('offices')
      .insert(payload)
      .select(OFFICE_SELECT)
      .single();

    if (error) {
      console.error('Error creating office:', error);
      return res.status(500).json({ message: 'Error al crear oficina.' });
    }

    return res.status(201).json({
      id: data.id,
      name: data.name,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      manager: data.manager || '',
      active: data.active ?? true,
    });
  } catch (err) {
    console.error('Unexpected error creating office:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const updateOffice = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID de oficina requerido.' });
  }

  try {
    const missing = ensureRequiredOfficeFields(req.body || {});
    if (missing.includes('name') || missing.includes('address')) {
      return res.status(400).json({ message: 'Campos obligatorios incompletos.' });
    }

    const payload = sanitizeOfficePayload(req.body || {});

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No hay datos para actualizar.' });
    }

    const { data, error } = await supabaseAdmin
      .from('offices')
      .update(payload)
      .eq('id', id)
      .select(OFFICE_SELECT)
      .single();

    if (error) {
      console.error('Error updating office:', error);
      return res.status(500).json({ message: 'Error al actualizar oficina.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Oficina no encontrada.' });
    }

    return res.json({
      id: data.id,
      name: data.name,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      manager: data.manager || '',
      active: data.active ?? true,
    });
  } catch (err) {
    console.error('Unexpected error updating office:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const deleteOffice = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID de oficina requerido.' });
  }

  try {
    // Verificar si hay usuarios asignados a esta oficina
    const { data: usersInOffice, error: usersError } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('office_id', id)
      .limit(1);

    if (usersError) {
      console.error('Error checking users in office:', usersError);
      return res.status(500).json({ message: 'Error al verificar usuarios de la oficina.' });
    }

    if (usersInOffice && usersInOffice.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar la oficina porque tiene usuarios asignados.' });
    }

    const { data, error } = await supabaseAdmin
      .from('offices')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Error deleting office:', error);
      return res.status(500).json({ message: 'Error al eliminar oficina.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Oficina no encontrada.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting office:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Esta función ya no es necesaria - la asociación se hace desde usuarios
// const updateOfficeUsers = async (req, res) => { ... }

// Esta función ya no es necesaria - la asociación se hace desde usuarios
// const getUnassociatedUsers = async (_req, res) => { ... }

module.exports = {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
};
