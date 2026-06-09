import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Punto de entrada del backend.
 * Inicia el servidor HTTP de la API de Oxxito.
 */
app.listen(PORT, () => {
  console.log(`Servidor Oxxito ejecutándose en http://localhost:${PORT}`);
});
