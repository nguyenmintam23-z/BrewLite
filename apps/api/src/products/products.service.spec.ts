import { Repository } from 'typeorm';
import { ProductOption, ProductOptionType } from './product-option.entity';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let optionRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    productRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    optionRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new ProductsService(
      productRepository as unknown as Repository<Product>,
      optionRepository as unknown as Repository<ProductOption>,
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('lists hidden drinks and maps their options without exposing relations', async () => {
    const hiddenProduct = {
      id: 'hidden-product-id',
      name: 'Hidden tea',
      description: null,
      price: '4.50',
      stockQuantity: 3,
      isAvailable: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    productRepository.find.mockResolvedValue([hiddenProduct]);
    optionRepository.find.mockResolvedValue([
      {
        id: 'option-id',
        optionType: ProductOptionType.SIZE,
        name: 'Large',
        priceAdjustment: '1.00',
        isAvailable: false,
        product: hiddenProduct,
      },
    ]);

    await expect(service.findAllForManager()).resolves.toEqual([
      {
        ...hiddenProduct,
        options: [
          {
            id: 'option-id',
            optionType: ProductOptionType.SIZE,
            name: 'Large',
            priceAdjustment: '1.00',
            isAvailable: false,
          },
        ],
      },
    ]);
    expect(productRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
    expect(optionRepository.find).toHaveBeenCalledWith({
      where: { product: { id: expect.anything() } },
      relations: { product: true },
      order: { optionType: 'ASC', name: 'ASC' },
    });
  });
});
