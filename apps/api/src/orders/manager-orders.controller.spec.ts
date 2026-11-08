import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { ManagerOrdersController } from './manager-orders.controller';

describe('ManagerOrdersController', () => {
  it('requires a JWT and the MANAGER role for every management route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ManagerOrdersController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ManagerOrdersController)).toEqual([
      UserRole.MANAGER,
    ]);
  });
});
