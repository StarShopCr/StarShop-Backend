import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/SessionService';
import AppDataSource from '../config/ormconfig';

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

// Middleware function to handle session validation
export const sessionMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Extracting the token from the authorization header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // Responding with an error if the token is missing
    res.status(401).json({ message: 'Authentication token is missing' });
    return;
  }

  try {
    // Creating an instance of SessionService to validate the session
    const sessionService = new SessionService(AppDataSource);
    const session = await sessionService.validateSession(token);

    if (!session) {
      // Responding with an error if the session is invalid or expired
      res.status(401).json({ message: 'Session expired or invalid' });
      return;
    }

    // Attaching user information to the request object
    req.user = { id: session.user.id, role: session.user.role };
    next(); // Proceeding to the next middleware
  } catch (error) {
    // Handling any internal server errors
    res.status(500).json({ message: 'Internal server error' });
  }
};