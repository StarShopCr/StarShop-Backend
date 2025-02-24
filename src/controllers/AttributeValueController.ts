import { Request, Response } from 'express';
import { AttributeValueService } from '../services/attributeValue.service';

const attributeValueService = new AttributeValueService();

//create new attribute value
export const createAttributeValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const attributeValue = await attributeValueService.create(req.body);
    if (!attributeValue) {
      res.status(400).json({ success: false, message: 'Attribute not found' });
    } else {
      res
        .status(201)
        .json({
          success: true,
          message: 'Attribute Value Created Successfully',
          data: attributeValue,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get all attribute values
export const getAllAttributesValues = async (req: Request, res: Response): Promise<void> => {
  try {
    const attributeValues = await attributeValueService.getAll();
    res
      .status(200)
      .json({
        success: true,
        message: 'Attribute Values Retrieved  Successfully',
        data: attributeValues,
      });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//get attribute value by id
export const getAttributeValueById = async (req: Request, res: Response): Promise<void> => {
  try {
    const attributeValue = await attributeValueService.getById(Number(req.params.id));
    if (!attributeValue) {
      res.status(404).json({ success: false, message: 'Attribute Value Not Found' });
    } else {
      res
        .status(200)
        .json({
          success: true,
          message: 'Attribute Value Retrieved Successfully',
          data: attributeValue,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//update attribute value
export const updateAttributeValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const attributeValue = await attributeValueService.update(Number(req.params.id), req.body);
    if (!attributeValue) {
      res.status(404).json({ success: false, message: 'Attribute Value Not Found' });
    } else {
      res
        .status(200)
        .json({
          success: true,
          message: 'Attribute Value Updated Successfully',
          data: attributeValue,
        });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

//delete attribute value
export const deleteAttributeValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await attributeValueService.delete(Number(req.params.id));
    if (!success) {
      res.status(404).json({ success: false, message: 'Attribute Value Not Found' });
    } else {
      res.status(204).send();
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
