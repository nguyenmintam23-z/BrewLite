import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: {
    create: jest.Mock;
    cancelForCustomer: jest.Mock;
    findOne: jest.Mock;
    findOneForCustomer: jest.Mock;
    findByCustomer: jest.Mock;
  };

  beforeEach(async () => {
    ordersService = {
      create: jest.fn(),
      cancelForCustomer: jest.fn(),
      findOne: jest.fn(),
      findOneForCustomer: jest.fn(),
      findByCustomer: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: ordersService,
        },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses the JWT and role guards', () => {
    const guards = Reflect.getMetadata('__guards__', OrdersController);
    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('uses the authenticated customer ID when creating orders', async () => {
    const dto = { items: [] } as never;
    await controller.create(dto, {
      user: { sub: 'jwt-customer-id', role: UserRole.CUSTOMER },
    } as never);
    expect(ordersService.create).toHaveBeenCalledWith(dto, 'jwt-customer-id');
  });
});
