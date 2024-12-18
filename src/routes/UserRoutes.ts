import { Router } from 'express';
import { createUser, deleteUser, getAllUsers, getUser, updateUser } from '../controllers/UserController';
import { validationMiddleware } from '../middleware/userValidation.middleware';
import { CreateUserDto, UpdateUserDto } from '../dtos/UserDTO';
import { sessionMiddleware } from '../middleware/session.middleware'; 

const router = Router();

// Route to get all users
router.get('/', sessionMiddleware, getAllUsers); 
// Route to create a new user with validation
router.post('/create', validationMiddleware(CreateUserDto), createUser);
// Route to get a specific user by ID
router.get('/show/:id', sessionMiddleware, getUser); 
// Route to update a user by ID with validation
router.put('/update/:id', sessionMiddleware, validationMiddleware(UpdateUserDto), updateUser); 
// Route to delete a user by ID
router.delete('/delete/:id', sessionMiddleware, deleteUser); 

export default router;
