import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { StaffOrdersController } from './staff-orders.controller';

describe('StaffOrdersController', () => {
  it('requires a JWT and the STAFF role for every staff order route', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, StaffOrdersController)).toEqual(
      [JwtAuthGuard, RolesGuard],
    );
    expect(Reflect.getMetadata(ROLES_KEY, StaffOrdersController)).toEqual([
      UserRole.STAFF,
    ]);
  });
});
