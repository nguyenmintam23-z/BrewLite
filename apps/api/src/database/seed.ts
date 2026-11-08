import { hash } from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import {
  ProductOption,
  ProductOptionType,
} from '../products/product-option.entity';
import dataSource from './data-source';
import { Product } from '../products/product.entity';

const staffPassword = process.env.SEED_STAFF_PASSWORD;
const managerPassword = process.env.SEED_MANAGER_PASSWORD;

if (process.env.NODE_ENV === 'production') {
  if (!staffPassword || !managerPassword) {
    throw new Error(
      'SEED_STAFF_PASSWORD and SEED_MANAGER_PASSWORD must be set in production.',
    );
  }
}

const sampleProducts = [
  {
    name: 'Cà phê sữa',
    description: 'Cà phê sữa đá',
    price: '35000.00',
    stockQuantity: 30,
    isAvailable: true,
  },
  {
    name: 'Bạc xỉu',
    description: 'Cà phê sữa đá ngọt dịu',
    price: '32000.00',
    stockQuantity: 28,
    isAvailable: true,
  },
  {
    name: 'Trà đào',
    description: 'Trà đào cam sả',
    price: '40000.00',
    stockQuantity: 25,
    isAvailable: true,
  },
  {
    name: 'Trà sữa trân châu',
    description: 'Trà sữa thơm ngon, trân châu dai',
    price: '45000.00',
    stockQuantity: 20,
    isAvailable: true,
  },
  {
    name: 'Matcha latte',
    description: 'Sữa matcha tươi mát',
    price: '50000.00',
    stockQuantity: 18,
    isAvailable: true,
  },
  {
    name: 'Espresso',
    description: 'Cà phê đậm đà, hương thơm',
    price: '30000.00',
    stockQuantity: 35,
    isAvailable: true,
  },
  {
    name: 'Soda chanh dây',
    description: 'Nước soda vị chanh dây tươi',
    price: '42000.00',
    stockQuantity: 22,
    isAvailable: true,
  },
  {
    name: 'Yuzu tea',
    description: 'Trà yuzu ngọt thanh mát',
    price: '47000.00',
    stockQuantity: 24,
    isAvailable: true,
  },
];

const defaultSizes = [
  { name: 'S', priceAdjustment: '0.00' },
  { name: 'M', priceAdjustment: '10000.00' },
  { name: 'L', priceAdjustment: '20000.00' },
];

async function seed() {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);
  const staffPasswordHash = await hash(staffPassword ?? '12345678', 10);
  const managerPasswordHash = await hash(managerPassword ?? '12345678', 10);

  const internalAccounts = [
    {
      displayName: 'Nhân viên quầy',
      phone: '0900000002',
      username: 'staff',
      passwordHash: staffPasswordHash,
      role: UserRole.STAFF,
      isActive: true,
    },
    {
      displayName: 'Quản lý cửa hàng',
      phone: '0900000003',
      username: 'manager',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      isActive: true,
    },
  ];

  for (const account of internalAccounts) {
    const existing = await userRepository.findOneBy({
      username: account.username,
    });

    if (!existing) {
      await userRepository.save(userRepository.create(account));
    }
  }

  const productRepository = dataSource.getRepository(Product);

  for (const product of sampleProducts) {
    const existing = await productRepository.findOneBy({
      name: product.name,
    });
if (!existing) {
  await productRepository.save(productRepository.create(product));
}
  }
 

  const existingCustomer = await userRepository.findOneBy({
    phone: '0900000001',
  });

  if (!existingCustomer) {
    await userRepository.save(
      userRepository.create({
        displayName: 'Khách hàng thử nghiệm',
        phone: '0900000001',
        passwordHash: 'seed-only-not-a-real-password',
        role: UserRole.CUSTOMER,
        isActive: true,
      }),
    );
  }
  const optionRepository = dataSource.getRepository(ProductOption);

  for (const product of sampleProducts) {
    const existingProduct = await productRepository.findOneBy({
      name: product.name,
    });

    if (!existingProduct) {
      continue;
    }

    for (const size of defaultSizes) {
      const existingOption = await optionRepository.findOne({
        where: {
          name: size.name,
          product: { id: existingProduct.id },
        },
      });

      if (!existingOption) {
        await optionRepository.save(
          optionRepository.create({
            optionType: ProductOptionType.SIZE,
            name: size.name,
            priceAdjustment: size.priceAdjustment,
            isAvailable: true,
            product: existingProduct,
          }),
        );
      }
    }
  }

  await dataSource.destroy();
  console.log('Seed completed.');
}

seed().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exitCode = 1;
});