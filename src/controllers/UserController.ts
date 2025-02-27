import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import { UserService } from '../services/User.service';
import AppDataSource from '../config/ormconfig';
import { NotFoundError } from '../middleware/error.classes';

const userService = new UserService(AppDataSource);

export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User Created Successfully',
      data: user,
    });
  }
);

export const getUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      res.status(404);
      throw new NotFoundError('User not found', {
        field: 'id',
        error: `No user found with id ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'User Retrieved Successfully',
      data: user,
    });
  }
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await userService.updateUser(Number(req.params.id), req.body);
    if (!user) {
      res.status(404);
      throw new NotFoundError('User not found', {
        field: 'id',
        error: `No user found with id ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'User Updated Successfully',
      data: user,
    });
  }
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const success = await userService.deleteUser(Number(req.params.id));
    if (!success) {
      res.status(404);
      throw new NotFoundError('User not found', {
        field: 'id',
        error: `No user found with id ${req.params.id}`,
      });
    } else {
      res.sendStatus(204);
    }
  }
);

export const getAllUsers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'Users Retrieved',
      data: users,
    });
  }
);
