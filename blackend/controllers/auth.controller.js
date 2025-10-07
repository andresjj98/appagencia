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
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        officeId: user.office_id
      },
      secret,
      { expiresIn: '24h' } // Token válido por 24 horas
    );

    delete user.password;
    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  login,
};
