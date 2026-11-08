import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PasswordResetOtp } from '../auth/password-reset-otp.entity';
import { RegistrationOtp } from '../auth/registration-otp.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';
import { ProductOption } from '../products/product-option.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'brewlite',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'brewlite',

  entities: [
    User,
    Product,
    ProductOption,
    Order,
    OrderItem,
    Payment,
    RegistrationOtp,
    PasswordResetOtp,
  ],
  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});