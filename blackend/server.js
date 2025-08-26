const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { hashPassword } = require('./passwordUtils');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT name, last_name, id_card, username, email, role, password, active, avatar FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = rows[0];
    let match;
    try {
      match = await bcrypt.compare(password, user.password);
    } catch {
      match = password === user.password;
    }

    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, last_name, id_card, username, email, role, active, avatar FROM users'
    );
    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      idCard: row.id_card,
      username: row.username,
      email: row.email,
      role: row.role,
      active: row.active === 1,
      avatar: row.avatar,
    }));
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  if (!name || !lastName || !idCard || !username || !email || !role || !password) {
    return res.status(400).json({ message: 'Faltan datos del usuario' });
  }
  try {
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO users (name, last_name, id_card, username, email, role, password, active, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, lastName, idCard, username, email, role, hashedPassword, active ? 1 : 0, avatar]
    );
    const newUser = {
      id: result.insertId,
      name,
      lastName,
      idCard,
      username,
      email,
      role,
      active,
      avatar,
    };
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  try {
    const [existingRows] = await pool.query(
      'SELECT name, last_name, id_card, username, email, role, active, avatar FROM users WHERE id = ?',
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const existing = existingRows[0];
    if (
      existing.name === name &&
      existing.last_name === lastName &&
      existing.id_card === idCard &&
      existing.username === username &&
      existing.email === email &&
      existing.role === role &&
      existing.active === (active ? 1 : 0) &&
      existing.avatar === avatar &&
      !password
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    let query =
      'UPDATE users SET name = ?, last_name = ?, id_card = ?, username = ?, email = ?, role = ?, active = ?, avatar = ?';
    const params = [
      name,
      lastName,
      idCard,
      username,
      email,
      role,
      active ? 1 : 0,
      avatar,
    ];
    if (password) {
      const hashedPassword = await hashPassword(password);
      query += ', password = ?';
      params.push(hashedPassword);
    }
    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ id: Number(id), name, lastName, idCard, username, email, role, active, avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.get('/api/offices', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.name, o.address, o.phone, o.email, o.manager, o.active,
             u.id AS user_id, u.name AS user_name, u.last_name AS user_last_name,
             u.email AS user_email, u.avatar AS user_avatar
      FROM offices o
      LEFT JOIN sales_point_users spu ON o.id = spu.office_id
      LEFT JOIN users u ON spu.user_id = u.id
    `);

    const officesMap = new Map();
    for (const row of rows) {
      if (!officesMap.has(row.id)) {
        officesMap.set(row.id, {
          id: row.id,
          name: row.name,
          address: row.address,
          phone: row.phone,
          email: row.email,
          manager: row.manager,
          active: row.active === 1,
          associatedUsers: [],
        });
      }
      if (row.user_id) {
        officesMap.get(row.id).associatedUsers.push({
          id: row.user_id,
          name: row.user_name,
          lastName: row.user_last_name,
          email: row.user_email,
          avatar: row.user_avatar,
        });
      }
    }
    res.json(Array.from(officesMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/offices', async (req, res) => {
  const { name, address, phone, email, manager, active } = req.body;
  if (!name || !address) {
    return res.status(400).json({ message: 'Faltan datos de la oficina' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO offices (name, address, phone, email, manager, active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, address, phone, email, manager, active ? 1 : 0]
    );
    const newOffice = {
      id: result.insertId,
      name,
      address,
      phone,
      email,
      manager,
      active,
    };
    res.status(201).json(newOffice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, manager, active } = req.body;
  try {
    const [existingRows] = await pool.query(
      'SELECT name, address, phone, email, manager, active FROM offices WHERE id = ?',
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }
    const existing = existingRows[0];
    if (
      existing.name === name &&
      existing.address === address &&
      existing.phone === phone &&
      existing.email === email &&
      existing.manager === manager &&
      existing.active === (active ? 1 : 0)
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    await pool.query(
      'UPDATE offices SET name = ?, address = ?, phone = ?, email = ?, manager = ?, active = ? WHERE id = ?',
      [name, address, phone, email, manager, active ? 1 : 0, id]
    );

    res.json({ id: Number(id), name, address, phone, email, manager, active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM offices WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id/users', async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds debe ser un arreglo' });
  }
  try {
    await pool.query('DELETE FROM sales_point_users WHERE office_id = ?', [id]);
    if (userIds.length > 0) {
      const values = userIds.map((userId) => [id, userId]);
      await pool.query('INSERT INTO sales_point_users (office_id, user_id) VALUES ?', [values]);
    }
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.last_name, u.email, u.avatar FROM users u JOIN sales_point_users spu ON u.id = spu.user_id WHERE spu.office_id = ?',
      [id]
    );
    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      email: row.email,
      avatar: row.avatar,
    }));
    res.json({ officeId: Number(id), users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});