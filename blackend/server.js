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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});