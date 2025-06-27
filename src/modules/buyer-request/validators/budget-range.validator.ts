import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { BuyerRequest } from '../buyer-request.entity';

@ValidatorConstraint({ name: 'BudgetRange', async: false })
export class BudgetRangeValidator implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const request = args.object as BuyerRequest;
    if (request.budgetMin == null || request.budgetMax == null) return true;
    return request.budgetMax >= request.budgetMin;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'budgetMax must be greater than or equal to budgetMin';
  }
}