// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración CORS más permisiva para pruebas
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'anthropic-version']
};

app.use(cors(corsOptions));
app.use(express.json());

// Verificación más detallada de la API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY no está definida en las variables de entorno');
  process.exit(1);
} else {
  console.log('API key configurada correctamente');
}

// Ruta raíz explícita
app.get('/', (req, res) => {
  res.send('Claude API Server is running');
});

// Ruta de verificación de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Ruta para manejar las solicitudes a Claude
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Recibida solicitud a /api/claude');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    console.log('Respuesta de Claude recibida correctamente');
    res.json(response.data);
  } catch (error) {
    console.error('Error en la solicitud a Claude:', error.response?.data || error.message);
    
    if (error.response) {
      // Devolver el error de la API de Anthropic
      res.status(error.response.status).json(error.response.data);
    } else {
      // Error del servidor
      res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
      });
    }
  }
});

// En producción, servir los archivos estáticos de la build
if (process.env.NODE_ENV === 'production') {
  console.log('Modo producción: Configurando para servir archivos estáticos');
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Ruta para cualquier otra solicitud que no sea API
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Middleware para manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
}); 