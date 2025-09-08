require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { hashPassword, comparePassword } = require('./passwordUtils');
const { supabaseAdmin } = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan credenciales' });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, id_card, username, email, role, password, active, avatar')
      .eq('email', email)
      .single();

    if (error || !user) {
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user from Supabase:', error);
        return res.status(500).json({ message: 'Error del servidor' });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const match = await comparePassword(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    delete user.password;
    const userResponse = {
      id: user.id,
      name: user.name,
      lastName: user.last_name,
      idCard: user.id_card,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      avatar: user.avatar,
    };
    res.json({ user: userResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});



app.get('/api/usuarios', async (req, res) => {
  try {
    const { data: supabaseData, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, last_name, id_card, username, email, role, active, avatar');
    if (supabaseError) {
      console.error('Error al obtener usuarios de Supabase:', supabaseError);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    const usuarios = (supabaseData || []).map((row) => ({
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      idCard: row.id_card,
      username: row.username,
      email: row.email,
      role: row.role,
      active: row.active,
      avatar: row.avatar,
    }));

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  if (!name || !lastName || !idCard || !username || !email || !role || !password) {
    return res.status(400).json({ message: 'Faltan datos del usuario' });
  }
  try {
    const hashedPassword = await hashPassword(password);
    const { data, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .insert({
          name,
          last_name: lastName,
          id_card: idCard,
          username,
          email,
          role,
          password: hashedPassword,
          active,
          avatar,
        })
      .select('id, name, last_name, id_card, username, email, role, active, avatar')
      .single();

    if (supabaseError) {
      console.error('Error al insertar en Supabase:', supabaseError);
      if (supabaseError.code === '23505') {
        return res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }
    const newUser = {
      id: data.id,
      name: data.name,
      lastName: data.last_name,
      idCard: data.id_card,
      username: data.username,
      email: data.email,
      role: data.role,
      active: data.active,
      avatar: data.avatar,
    };
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { name, lastName, idCard, username, email, role, password, active, avatar } = req.body;
  try {
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('usuarios')
      .select('name, last_name, id_card, username, email, role, active, avatar')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user from Supabase:', fetchError);
        return res.status(500).json({ message: 'Error del servidor' });
      }
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (
      existingUser.name === name &&
      existingUser.last_name === lastName &&
      existingUser.id_card === idCard &&
      existingUser.username === username &&
      existingUser.email === email &&
      existingUser.role === role &&
      existingUser.active === active &&
      existingUser.avatar === avatar &&
      !password
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    const supabaseUpdate = {
      name,
      last_name: lastName,
      id_card: idCard,
      username,
      email,
      role,
      active,
      avatar,
    };
    if (password) {
      supabaseUpdate.password = await hashPassword(password);
    }

    const { data, error: supabaseError } = await supabaseAdmin
      .from('usuarios')
      .update(supabaseUpdate)
      .eq('id', id)
      .select('id, name, last_name, id_card, username, email, role, active, avatar')
      .single();

    if (supabaseError) {
      console.error('Error al actualizar en Supabase:', supabaseError);
      if (supabaseError.code === '23505') {
        return res.status(409).json({ message: 'El email o nombre de usuario ya existe.' });
      }
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json({
      id: data.id,
      name: data.name,
      lastName: data.last_name,
      idCard: data.id_card,
      username: data.username,
      email: data.email,
      role: data.role,
      active: data.active,
      avatar: data.avatar,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (!data || data.length === 0) {
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
    const { data: officesData, error } = await supabaseAdmin
      .from('offices')
      .select('*, sales_point_users(usuarios(id, name, last_name, email, avatar))');

    if (error) {
      console.error('Error al obtener oficinas de Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    const offices = officesData.map((office) => ({
      id: office.id,
      name: office.name,
      address: office.address,
      phone: office.phone,
      email: office.email,
      manager: office.manager,
      active: office.active,
      associatedUsers: office.sales_point_users.map((spu) => ({
        id: spu.usuarios.id,
        name: spu.usuarios.name,
        lastName: spu.usuarios.last_name,
        email: spu.usuarios.email,
        avatar: spu.usuarios.avatar,
      })),
    }));

    res.json(offices);
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
    const { data, error } = await supabaseAdmin
      .from('offices')
      .insert({ name, address, phone, email, manager, active })
      .select()
      .single();

    if (error) {
      console.error('Error al insertar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, manager, active } = req.body;
  try {
    const { data: existingOffice, error: fetchError } = await supabaseAdmin
      .from('offices')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching office from Supabase:', fetchError);
      return res.status(500).json({ message: 'Error del servidor' });
    }
    
    if (!existingOffice) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }

    if (
      existingOffice.name === name &&
      existingOffice.address === address &&
      existingOffice.phone === phone &&
      existingOffice.email === email &&
      existingOffice.manager === manager &&
      existingOffice.active === active
    ) {
      return res.status(400).json({ message: 'No hay cambios para actualizar' });
    }

    const { data, error } = await supabaseAdmin
      .from('offices')
      .update({ name, address, phone, email, manager, active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.delete('/api/offices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('offices')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error al eliminar oficina en Supabase:', error);
      return res.status(500).json({ message: 'Error del servidor' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Oficina no encontrada' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

app.put('/api/offices/:id/usuarios', async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds debe ser un arreglo' });
  }
  try {
    // Eliminar asociaciones existentes
    const { error: deleteError } = await supabaseAdmin
      .from('sales_point_users')
      .delete()
      .eq('office_id', id);

    if (deleteError) throw deleteError;

    // Insertar nuevas asociaciones si las hay
    if (userIds.length > 0) {
      const newAssociations = userIds.map((userId) => ({
        office_id: id,
        user_id: userId,
      }));
      const { error: insertError } = await supabaseAdmin
        .from('sales_point_users')
        .insert(newAssociations);

      if (insertError) throw insertError;
    }

    // Obtener la lista actualizada de usuarios asociados
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('sales_point_users')
      .select('usuarios(id, name, last_name, email, avatar)')
      .eq('office_id', id);

    if (usersError) throw usersError;

    const users = usersData.map((item) => ({
      id: item.usuarios.id,
      name: item.usuarios.name,
      lastName: item.usuarios.last_name,
      email: item.usuarios.email,
      avatar: item.usuarios.avatar,
    }));
    res.json({ officeId: id, associatedUsers: users });
  } catch (error) {
    console.error('Error al actualizar usuarios de oficina en Supabase:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});