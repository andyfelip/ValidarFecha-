const express = require('express')
const axios = require('axios')
const app = express()



app.use(express.json())

app.post('/validar-dia', async (req, res) => {
  const { fecha } = req.body;

  // Validar formato
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido (use YYYY-MM-DD)' });
  }

  const dateObj = new Date(fecha);
  const dayOfWeek = dateObj.getUTCDay(); // 0 = domingo, 6 = sábado

  // 1. Validar fin de semana
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({
      esNoHabil: true,
      motivo: 'Fin de semana'
    });
  }

  const year = fecha.split('-')[0];

  // 2. Verificar feriados nacionales en Colombia
  try {
    const respuesta = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`);
    const feriados = respuesta.data;

    const encontrado = feriados.find(d => d.date === fecha);

    if (encontrado) {
      return res.json({
        esNoHabil: true,
        motivo: `Feriado nacional: ${encontrado.localName}`
      });
    }

    // Día hábil
    res.json({
      esNoHabil: false,
      motivo: 'Día hábil'
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error al consultar feriados' });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});