import { Repository } from 'typeorm';
import { Session } from '../entities/Session';
import { User } from '../entities/User';
import { DataSource } from 'typeorm';

export class SessionService {
  // Repository for managing session entities
  private sessionRepository: Repository<Session>;

  constructor(dataSource: DataSource) {
    // Initialize the session repository with the provided data source
    this.sessionRepository = dataSource.getRepository(Session);
  }

  // Create a new session for a user
  async createSession(user: User, token: string, expiresAt: Date): Promise<Session> {
    // Create a session object
    const session = this.sessionRepository.create({ user, token, expiresAt });
    // Save the session to the database
    return await this.sessionRepository.save(session);
  }

  // Validate an existing session using the token
  async validateSession(token: string): Promise<Session | null> {
    // Find the session by token
    const session = await this.sessionRepository.findOne({ where: { token } });
    // Check if the session is valid (not expired)
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    // Return null if the session is invalid or not found
    return null;
  }
}
