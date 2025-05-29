const express = require('express');
const axios = require('axios');
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Middleware de autenticación Basic Auth
app.use((req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).send('Autenticación requerida');
  }

  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [user, pass] = credentials.split(':');

  if (user === process.env.AUTH_USER && pass === process.env.AUTH_PASS) {
    return next();
  } else {
    return res.status(403).send('Credenciales incorrectas');
  }
});

// Ruta principal para validar si un día es hábil
app.post('/validar-dia', async (req, res) => {
  const { fecha } = req.body;

  // Validar formato de fecha
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido (use YYYY-MM-DD)' });
  }

  try {
    const dateObj = new Date(fecha);
    const dayOfWeek = dateObj.getUTCDay(); // 0 = domingo, 6 = sábado

    // Validar si es fin de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(409).json({
        esNoHabil: true,
        motivo: 'Fin de semana'
      });
    }

    // Consultar feriados nacionales en Colombia
    const year = fecha.split('-')[0];
    const respuesta = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`);
    const feriados = respuesta.data;

    const feriadoEncontrado = feriados.find(d => d.date === fecha);

    if (feriadoEncontrado) {
      return res.status(409).json({
        esNoHabil: true,
        motivo: `Feriado nacional: ${feriadoEncontrado.localName}`
      });
    }

    // Día hábil
    return res.status(200).json({
      esNoHabil: false,
      motivo: 'Día hábil'
    });

  } catch (error) {
    console.error('Error al consultar feriados:', error.message);
    return res.status(500).json({ error: 'Error al consultar feriados' });
  }
});

// Inicializar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
