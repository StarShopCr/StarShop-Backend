import 'reflect-metadata';
import express from 'express';
import SwaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors'; // Import cors package
import helmet from 'helmet';
import AppDataSource from './config/ormconfig';
import indexRoutes from './routes/index';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Load OpenAPI spec
const swaggerDocument = YAML.load('./openapi.yaml');

// Apply security middleware
// Configure Helmet (HTTP security headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'swagger-ui-express'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']; // Fallback to development environment

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json());

// Use the index routes
app.use('/api/v1', indexRoutes);

// Swagger documentation route
app.use('/docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

// Register the global error-handling middleware
app.use(errorHandler);

// Initialize database connection and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

// Export for testing purposes (if needed)
export default app;
