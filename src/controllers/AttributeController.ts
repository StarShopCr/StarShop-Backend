import { Request, Response } from 'express';
import { AttributeService } from '../services/attribute.service';
import AppDataSource from '../config/ormconfig';

const attributeService = new AttributeService();

//create new attribute
export const createAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const attribute = await attributeService.create(req.body);
    res
      .status(201)
      .json({ success: true, message: 'Attribute Created Successfully', data: attribute });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get all attributes
export const getAllAttributes = async (req: Request, res: Response): Promise<void> => {
  try {
    const attributes = await attributeService.getAll();
    res
      .status(200)
      .json({ success: true, message: 'Attributes Retrieved  Successfully', data: attributes });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get attribute by id
export const getAttributeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const attribute = await attributeService.getById(Number(req.params.id));
    if (!attribute) {
      res.status(404).json({ success: false, message: 'Attribute Not Found' });
    } else {
      res
        .status(200)
        .json({ success: true, message: 'Attribute Retrieved Successfully', data: attribute });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//update attribute
export const updateAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const attribute = await attributeService.update(Number(req.params.id), req.body);
    if (!attribute) {
      res.status(404).json({ success: false, message: 'Attribute Not Found' });
    } else {
      res
        .status(200)
        .json({ success: true, message: 'Attribute Updated Successfully', data: attribute });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//delete attribute
export const deleteAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await attributeService.delete(Number(req.params.id));
    if (!success) {
      res.status(404).json({ success: false, message: 'Attribute Not Found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
