const { supabaseAdmin } = require('../supabase');
const { hashPassword } = require('../passwordUtils');

const USER_SELECT = 'id, name, last_name, id_card, username, email, role, active, avatar, office_id, is_super_admin';

const applyFallbackAvatar = (row) => {
  if (row.avatar && row.avatar.trim()) {
    return row.avatar;
  }
  const seed = row.username || row.email || `user-${row.id || 'seed'}`;
  const encodedSeed = encodeURIComponent(seed.toString());
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodedSeed}`;
};

const mapDbUserToClient = (row) => ({
  id: row.id,
  name: row.name || '',
  lastName: row.last_name || '',
  idCard: row.id_card || '',
  username: row.username || '',
  email: row.email || '',
  role: row.role || 'advisor',
  active: row.active ?? true,
  avatar: applyFallbackAvatar(row),
  officeId: row.office_id || null,
  isSuperAdmin: row.is_super_admin ?? false,
  createdAt: row.created_at || null,
});

const buildUserPayload = async (body, { hashPasswordIfNeeded = true } = {}) => {
  const payload = {};
  const toTrimmed = (value) => {
    if (value === undefined || value === null) return undefined;
    return value.toString().trim();
  };

  if (body.name !== undefined) {
    const name = toTrimmed(body.name);
    if (name !== undefined) payload.name = name;
  }

  if (body.lastName !== undefined) {
    const lastName = toTrimmed(body.lastName);
    payload.last_name = lastName || null;
  }

  if (body.idCard !== undefined) {
    const idCard = toTrimmed(body.idCard);
    payload.id_card = idCard || null;
  }

  if (body.username !== undefined) {
    const username = toTrimmed(body.username);
    if (username !== undefined) payload.username = username;
  }

  if (body.email !== undefined) {
    const email = toTrimmed(body.email);
    if (email !== undefined) payload.email = email.toLowerCase();
  }

  if (body.role !== undefined) {
    const role = toTrimmed(body.role);
    if (role !== undefined) payload.role = role;
  }

  if (body.active !== undefined) {
    payload.active = !!body.active;
  }

  if (body.avatar !== undefined) {
    const avatar = toTrimmed(body.avatar);
    payload.avatar = avatar && avatar.length > 0 ? avatar : null;
  }

  if (body.officeId !== undefined) {
    const officeId = toTrimmed(body.officeId);
    payload.office_id = officeId && officeId.length > 0 ? officeId : null;
  }

  if (body.isSuperAdmin !== undefined) {
    payload.is_super_admin = !!body.isSuperAdmin;
  }

  if (hashPasswordIfNeeded && body.password !== undefined) {
    const password = toTrimmed(body.password);
    if (password && password.length > 0) {
      payload.password = await hashPassword(password);
    }
  }

  return payload;
};

const validateRequiredFields = (body, { isUpdate = false } = {}) => {
  const missing = [];
  const checkField = (key, label) => {
    if (!body[key] || !body[key].toString().trim()) {
      missing.push(label);
    }
  };

  checkField('name', 'name');
  checkField('email', 'email');
  checkField('username', 'username');
  checkField('role', 'role');

  if (!isUpdate) {
    checkField('password', 'password');
  }

  return missing;
};

const getAllUsers = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select(USER_SELECT)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Error al obtener usuarios.' });
    }

    const users = (data || []).map(mapDbUserToClient);
    return res.json(users);
  } catch (err) {
    console.error('Unexpected error fetching users:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const createUser = async (req, res) => {
  try {
    const missing = validateRequiredFields(req.body || {});
    if (missing.length > 0) {
      return res.status(400).json({ message: `Faltan campos obligatorios: ${missing.join(', ')}` });
    }

    const payload = await buildUserPayload(req.body || {});
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .insert(payload)
      .select(USER_SELECT)
      .single();

    if (error) {
      console.error('Error creating user:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'El correo o username ya existe.' });
      }
      return res.status(500).json({ message: 'Error al crear usuario.' });
    }

    return res.status(201).json(mapDbUserToClient(data));
  } catch (err) {
    console.error('Unexpected error creating user:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID de usuario requerido.' });
  }

  try {
    const missing = validateRequiredFields(req.body || {}, { isUpdate: true });
    if (missing.includes('name') || missing.includes('email') || missing.includes('username') || missing.includes('role')) {
      return res.status(400).json({ message: 'Campos obligatorios incompletos.' });
    }

    const payload = await buildUserPayload(req.body || {});

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No hay datos para actualizar.' });
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (error) {
      console.error('Error updating user:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'El correo o username ya existe.' });
      }
      return res.status(500).json({ message: 'Error al actualizar usuario.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json(mapDbUserToClient(data));
  } catch (err) {
    console.error('Unexpected error updating user:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID de usuario requerido.' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Error al eliminar usuario.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Unexpected error deleting user:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const uploadAvatar = async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }

  try {
    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, avatar')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Subir archivo a Supabase Storage
    const filePath = `avatars/${id}/${Date.now()}-${file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading avatar to Supabase Storage:', uploadError);
      throw new Error(uploadError.message);
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Agregar timestamp para evitar caché del navegador
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Actualizar URL en la base de datos
    const { data, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ avatar: avatarUrl })
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (updateError) {
      console.error('Error updating user with avatar URL:', updateError);
      throw new Error('Error al actualizar el avatar del usuario.');
    }

    return res.status(200).json({
      message: 'Avatar subido exitosamente.',
      user: mapDbUserToClient(data)
    });

  } catch (error) {
    console.error('Server error in avatar upload:', error);
    return res.status(500).json({
      message: 'Error del servidor al subir avatar.',
      details: error.message
    });
  }
};

const deleteAvatar = async (req, res) => {
  const { id } = req.params;

  try {
    // Actualizar avatar a null para que use el fallback
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update({ avatar: null })
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (error) {
      console.error('Error deleting avatar:', error);
      return res.status(500).json({ message: 'Error al eliminar avatar.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Avatar eliminado exitosamente.',
      user: mapDbUserToClient(data)
    });
  } catch (err) {
    console.error('Unexpected error deleting avatar:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  deleteAvatar,
};

