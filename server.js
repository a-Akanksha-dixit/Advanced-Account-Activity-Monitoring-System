import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
import dashboardRoutes from './routes/dashboard.js';
import loginRoutes from './routes/login.js';
import screenshotsRoutes from './routes/screenshots.js';
import apiRoutes from './routes/api.js';

app.use('/', dashboardRoutes);
app.use('/login', loginRoutes);
app.use('/screenshots', screenshotsRoutes);
app.use('/api', apiRoutes);

// health check (for EB)
// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'OK', message: 'Server is healthy' });
// });

// 404 handler
app.use((req, res) => {
  res.status(404).send('<h1>404 - Not Found</h1>');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('<h1>500 - Internal Server Error</h1>');
});

// Initialize database connection
import { initializeDatabase } from './config/database.js';

const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    console.log('⚠️ Starting server without DB connection');
  }
    app.listen(PORT, () => {
      console.log(`🚀 Security Dashboard running on port ${PORT}`);
    });
  };

startServer();


