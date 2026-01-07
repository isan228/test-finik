import dotenv from 'dotenv';
import app from './app.js';

// Загружаем переменные окружения
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${process.env.FINIK_ENV || 'beta'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


