const jwt = require('jsonwebtoken');
const { comparePassword } = require('../passwordUtils');
const { supabaseAdmin } = require('../supabase');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, id_card, username, email, role, password, active, avatar, office_id, is_super_admin')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const isSuperAdmin = Boolean(user.is_super_admin);
    const effectiveRole = isSuperAdmin ? 'superadmin' : user.role;
    const officeId = user.office_id ?? null;

    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: effectiveRole,
        officeId,
        isSuperAdmin
      },
      secret,
      { expiresIn: '24h' }
    );

    const { password: _, ...safeUser } = user;

    res.json({
      user: {
        ...safeUser,
        office_id: officeId,
        is_super_admin: isSuperAdmin,
        effective_role: effectiveRole
      },
      token
    });
  } catch (err) {
    console.error('Error in login controller:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  login,
};