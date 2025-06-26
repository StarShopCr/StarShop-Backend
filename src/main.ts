import express from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/users/routes/user.routes';
import errorHandler from './modules/shared/middleware/error.middleware';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use((err: any, req: express.Request, res: express.Response) => {
  errorHandler(err, req, res);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
