require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function createAdminUser() {
  const userData = {
    name: 'admin',
    lastName: 'admin',
    idCard: '123456789',
    username: 'admin',
    email: 'admin@demo.com',
    role: 'admin',
    password: '123456', // <-- Envía la contraseña en texto plano
    active: true,
    avatar: null,
  };

  try {
    const response = await axios.post('http://localhost:4000/api/usuarios', userData);
    console.log('Usuario administrador creado con éxito:');
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Error al crear el usuario:', error.response.data.message);
    } else {
      console.error('Error del servidor:', error.message);
    }
  }
}

createAdminUser();