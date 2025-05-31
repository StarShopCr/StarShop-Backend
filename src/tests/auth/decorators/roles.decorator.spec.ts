import { SetMetadata } from '@nestjs/common';
import { Roles } from '../../../modules/auth/decorators/roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata with roles', () => {
    const roles = ['admin', 'buyer'] as const;
    const decorator = Roles(...roles);

    // Create a mock class
    class TestClass {
      @decorator
      testMethod() {}
    }

    // Get the metadata
    const metadata = Reflect.getMetadata('roles', TestClass.prototype.testMethod);

    expect(metadata).toEqual(roles);
  });
});
