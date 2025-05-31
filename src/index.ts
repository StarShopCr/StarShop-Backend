import 'reflect-metadata';
import express from 'express';
import SwaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import AppDataSource from './config/ormconfig';
import indexRoutes from './routes/index';

// import { errorHandler } from './middleware/error.middleware';
import wishlistRouter from './modules/wishlist/route/wishlist.routes';

// import errorHandler from './middleware/error.middleware';
import { NotFoundError } from './middleware/error.classes';

const app = express();
const PORT = process.env.PORT || 3000;

// Load OpenAPI spec
const swaggerDocument = YAML.load('./openapi.yaml');

app.use(express.json());

// Use the index routes
app.use('/api/v1', indexRoutes);

// Use wishlist routes
app.use('/api/v1/wishlist', wishlistRouter); // Integrate wishlist routes here

// Swagger documentation route
app.use('/docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

app.use('*', (req, res, next) => next(new NotFoundError()));

// Register the global error-handling middleware
// app.use(errorHandler);

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

// app.use('/', router)
