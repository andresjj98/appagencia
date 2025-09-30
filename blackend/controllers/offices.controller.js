const { supabaseAdmin } = require('../supabase');

const OFFICE_SELECT = 'id, name, address, phone, email, manager, active';
const USER_SELECT = 'id, name, last_name, email, username, avatar, active';

const applyFallbackAvatar = (user) => {
  if (user.avatar && user.avatar.trim()) {
    return user.avatar;
  }
  const seed = user.username || user.email || user.name || `user-${user.id || 'seed'}`;
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}`;
};

const mapDbUserToClient = (user) => ({
  id: user.id,
  name: user.last_name ? `${user.name} ${user.last_name}`.trim() : user.name || '',
  email: user.email || '',
  avatar: applyFallbackAvatar(user),
});

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

    const { data: relations, error: relationsError } = await supabaseAdmin
      .from('sales_point_users')
      .select('office_id, usuarios ( id, name, last_name, email, username, avatar )');

    if (relationsError) {
      console.error('Error fetching office relations:', relationsError);
      return res.status(500).json({ message: 'Error al obtener usuarios asociados.' });
    }

    const usersByOffice = new Map();
    for (const relation of relations || []) {
      if (!relation.office_id || !relation.usuarios) continue;
      if (!usersByOffice.has(relation.office_id)) {
        usersByOffice.set(relation.office_id, []);
      }
      usersByOffice.get(relation.office_id).push(mapDbUserToClient(relation.usuarios));
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
      associatedUsers: [],
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

    const { data: relations, error: relationsError } = await supabaseAdmin
      .from('sales_point_users')
      .select('usuarios ( id, name, last_name, email, username, avatar )')
      .eq('office_id', id);

    if (relationsError) {
      console.error('Error fetching office relations after update:', relationsError);
      return res.status(500).json({ message: 'Error al obtener usuarios asociados.' });
    }

    const associatedUsers = (relations || [])
      .map((relation) => relation.usuarios)
      .filter(Boolean)
      .map(mapDbUserToClient);

    return res.json({
      id: data.id,
      name: data.name,
      address: data.address,
      phone: data.phone || '',
      email: data.email || '',
      manager: data.manager || '',
      active: data.active ?? true,
      associatedUsers,
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
    const { error: relationDeleteError } = await supabaseAdmin
      .from('sales_point_users')
      .delete()
      .eq('office_id', id);

    if (relationDeleteError) {
      console.error('Error deleting office relations:', relationDeleteError);
      return res.status(500).json({ message: 'Error al eliminar asociaciones de la oficina.' });
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

const updateOfficeUsers = async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body || {};

  if (!id) {
    return res.status(400).json({ message: 'ID de oficina requerido.' });
  }

  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds debe ser un arreglo.' });
  }

  try {
    const { data: existingRelations, error: relationsError } = await supabaseAdmin
      .from('sales_point_users')
      .select('id, user_id')
      .eq('office_id', id);

    if (relationsError) {
      console.error('Error fetching existing relations:', relationsError);
      return res.status(500).json({ message: 'Error al obtener asociaciones existentes.' });
    }

    const existingIds = new Set((existingRelations || []).map((r) => r.user_id));
    const incomingIds = new Set(userIds.filter(Boolean));

    const toInsert = [];
    for (const userId of incomingIds) {
      if (!existingIds.has(userId)) {
        toInsert.push({ office_id: id, user_id: userId });
      }
    }

    const toDelete = (existingRelations || [])
      .filter((relation) => !incomingIds.has(relation.user_id))
      .map((relation) => relation.id);

    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('sales_point_users')
        .insert(toInsert);

      if (insertError) {
        console.error('Error inserting office relations:', insertError);
        return res.status(500).json({ message: 'Error al asociar usuarios a la oficina.' });
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('sales_point_users')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('Error removing office relations:', deleteError);
        return res.status(500).json({ message: 'Error al eliminar asociaciones de la oficina.' });
      }
    }

    const { data: relations, error: relationsFetchError } = await supabaseAdmin
      .from('sales_point_users')
      .select('usuarios ( id, name, last_name, email, username, avatar )')
      .eq('office_id', id);

    if (relationsFetchError) {
      console.error('Error fetching relations after update:', relationsFetchError);
      return res.status(500).json({ message: 'Error al obtener usuarios asociados.' });
    }

    const associatedUsers = (relations || [])
      .map((relation) => relation.usuarios)
      .filter(Boolean)
      .map(mapDbUserToClient);

    return res.json({ associatedUsers });
  } catch (err) {
    console.error('Unexpected error updating office users:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getUnassociatedUsers = async (_req, res) => {
  try {
    const { data: associatedRows, error: associatedError } = await supabaseAdmin
      .from('sales_point_users')
      .select('user_id');

    if (associatedError) {
      console.error('Error fetching associated users:', associatedError);
      return res.status(500).json({ message: 'Error al obtener usuarios asociados.' });
    }

    const associatedSet = new Set((associatedRows || []).map((row) => row.user_id));

    const { data: users, error: usersError } = await supabaseAdmin
      .from('usuarios')
      .select(USER_SELECT)
      .order('name', { ascending: true });

    if (usersError) {
      console.error('Error fetching users for unassociated list:', usersError);
      return res.status(500).json({ message: 'Error al obtener usuarios.' });
    }

    const response = (users || [])
      .filter((user) => !associatedSet.has(user.id))
      .map(mapDbUserToClient);

    return res.json(response);
  } catch (err) {
    console.error('Unexpected error fetching unassociated users:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  updateOfficeUsers,
  getUnassociatedUsers,
};
