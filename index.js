
const express = require('express');
const axios = require('axios');
const app = express();


// Middleware para parsear JSON
app.use(express.json());



// Calendario de Bloqueos embebido 
const bloqueos = {

  //Bloqueo Rojo -> Corresponde al Bloqueo Total 

  "2025-01-14":"bloqueo_total", "2025-01-15":"bloqueo_total","2025-01-16":"bloqueo_total","2025-01-30":"bloqueo_total","2025-01-31":"bloqueo_total",
  "2025-02-01":"bloqueo_total","2025-02-02":"bloqueo_total","2025-02-14":"bloqueo_total","2025-02-15":"bloqueo_total","2025-02-16":"bloqueo_total","2025-02-17":"bloqueo_total","2025-02-27":"bloqueo_total","2025-02-28":"bloqueo_total",
  "2025-03-01":"bloqueo_total","2025-03-02":"bloqueo_total","2025-03-14":"bloqueo_total","2025-03-15":"bloqueo_total","2025-03-16":"bloqueo_total","2025-03-17":"bloqueo_total","2025-03-29":"bloqueo_total","2025-03-30":"bloqueo_total","2025-03-31":"bloqueo_total",
  "2025-04-29":"bloqueo_total","2025-04-30":"bloqueo_total",
  "2025-05-01":"bloqueo_total","2025-05-14":"bloqueo_total","2025-05-15":"bloqueo_total","2025-05-16":"bloqueo_total","2025-05-30":"bloqueo_total","2025-05-31":"bloqueo_total",
  "2025-06-01":"bloqueo_total","2025-06-02":"bloqueo_total","2025-06-03":"bloqueo_total","2025-06-14":"bloqueo_total","2025-06-16":"bloqueo_total","2025-06-29":"bloqueo_total","2025-06-30":"bloqueo_total",
  "2025-07-01":"bloqueo_total","2025-07-14":"bloqueo_total","2025-07-15":"bloqueo_total","2025-07-16":"bloqueo_total","2025-07-29":"bloqueo_total","2025-07-30":"bloqueo_total",
  "2025-08-01":"bloqueo_total","2025-08-14":"bloqueo_total","2025-08-15":"bloqueo_total","2025-08-16":"bloqueo_total","2025-08-29":"bloqueo_total","2025-08-30":"bloqueo_total",
  "2025-09-01":"bloqueo_total","2025-09-14":"bloqueo_total","2025-09-15":"bloqueo_total","2025-09-16":"bloqueo_total","2025-09-29":"bloqueo_total","2025-09-30":"bloqueo_total",
  "2025-10-01":"bloqueo_total","2025-10-14":"bloqueo_total","2025-10-15":"bloqueo_total","2025-10-16":"bloqueo_total","2025-10-29":"bloqueo_total","2025-10-30":"bloqueo_total",
  "2025-11-01":"bloqueo_total","2025-11-02":"bloqueo_total","2025-11-03":"bloqueo_total","2025-11-04":"bloqueo_total","2025-11-14":"bloqueo_total","2025-11-15":"bloqueo_total","2025-11-16":"bloqueo_total",


  //Bloqueo Amarillo -> Corresponde al Bloqueo Parcial hasta las 5am  
  "2025-01-13":"bloqueo_parcial", "2025-01-29":"bloqueo_parcial",
  "2025-02-13":"bloqueo_parcial", "2025-02-26":"bloqueo_parcial",
  "2025-03-13":"bloqueo_parcial", "2025-03-28":"bloqueo_parcial",
  "2025-04-28":"bloqueo_parcial",
  "2025-05-13":"bloqueo_parcial", "2025-05-29":"bloqueo_parcial", 
  "2025-06-10":"bloqueo_parcial", "2025-06-28":"bloqueo_parcial",
  "2025-07-13":"bloqueo_parcial", "2025-07-29":"bloqueo_parcial",
  "2025-08-13":"bloqueo_parcial", "2025-08-29":"bloqueo_parcial",
  "2025-09-13":"bloqueo_parcial", "2025-09-28":"bloqueo_parcial",
  "2025-10-13":"bloqueo_parcial", "2025-10-29":"bloqueo_parcial",
  "2025-11-13":"bloqueo_parcial", 


  //Bloqueo Gris -> Corresponde al Bloqueo de Semana Santa 
  "2025-04-14": "especial", "2025-04-15": "especial", "2025-04-16": "especial",
  "2025-04-17": "especial", "2025-04-18": "especial", "2025-04-19": "especial", "2025-04-20": "especial",
  "2025-05-11": "especial", "2025-06-15": "especial",



  //Bloqueo Azul -> Corresponde al Bloqueo de Diciembre 
    ...Object.fromEntries([
    //Ultima Semana de Noviembre 
    ...Array.from({length: 7}, (_, i) => {
      const dia = (24 + i ).toString().padStart(2, '0'); 
      return[`2025-11-${dia}`, "freeze_anual"]
    }), 
  
    //Todo Diciembre
    ...Array.from({length: 31}, (_, i) => {
      const dia = (i + 1 ).toString().padStart(2, '0'); 
      return[`2025-12-${dia}`, "freeze_anual"]
    }), 

    //Primeros 5 días de enero de 2026
    ...Array.from({length: 5}, (_, i) => {
      const dia = (i + 1 ).toString().padStart(2, '0'); 
      return[`2026-01-${dia}`, "freeze_anual"]
    }), 
  ])
}

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

// Definicion del EndPoint que nos permite validar la fecha 
app.post('/validar-dia', async (req, res) => {
  const { fecha } = req.body;

  // Validar formato de fecha
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Formato de fecha inválido (use YYYY-MM-DD)' });
  }

  try {
    const ahora = new Date();
    const hoy = ahora.toLocaleDateString('sv-SE');
    const dateObj = new Date(fecha); 

    console.log("Fecha ingresada:", fecha);
    console.log("Fecha actual (sistema):", hoy);
    console.log("Hora actual (sistema):", ahora.getHours());

    //Bloqueos a nivel del calendario 

    const tipo = bloqueos[fecha]; 

    if(tipo == "bloqueo_total"){
      return res.status(423).json({
        esNoHabil: true, 
        codigo: "BLQ-01",
        motivo: "Bloqueo total para cambios (día pre/post/quincena)"
      }); 
    }

    if (tipo === "bloqueo_parcial") {
      if (ahora.getHours() >= 5) {
        return res.status(429).json({
          esNoHabil: true,
          codigo: "BLQ-02",
          motivo: "Bloqueo parcial desde las 05:00 (vigente desde las 05:00)"
        });
      }
    }

    if (tipo === "especial") {
      return res.status(412).json({
        esNoHabil: true,
        codigo: "ESP-01",
        motivo: "Día especial bloqueado para cambios (Semana Santa, Día del Padre, etc.)"
    });
  }

    if (tipo === "freeze_anual") {
      return res.status(428).json({
        esNoHabil: true,
        codigo: "FZ-01",
        motivo: "Freeze de fin de año (todo diciembre)"
      });
    }

    // Día hábil
    return res.status(200).json({
      esNoHabil: false,
      codigo: "OK-00",
      motivo: 'Día hábil'
    });

  } catch (error) {
    console.error('Error al validar:', error.message);
    return res.status(500).json({ error: 'Error al procesar fecha' });
  }
});

// Calendario completo
app.get('/calendario-bloqueos', (req, res) => {
  res.status(200).json(bloqueos);
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
