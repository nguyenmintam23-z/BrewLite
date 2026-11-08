import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { UpdateProductOptionDto } from './dto/update-product-option.dto';

type ManagerProductOption = Pick<
  ProductOption,
  'id' | 'optionType' | 'name' | 'priceAdjustment' | 'isAvailable'
>;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductOption)
    private readonly optionRepository: Repository<ProductOption>,
  ) {}

  async findAll() {
    const products = await this.productRepository.find({
      where: { isAvailable: true },
      order: { name: 'ASC' },
    });
    if (products.length === 0) return [];

    const options = await this.optionRepository.find({
      where: {
        product: { id: In(products.map((product) => product.id)) },
        isAvailable: true,
      },
      relations: { product: true },
      order: { optionType: 'ASC', name: 'ASC' },
    });
    const optionsByProduct = new Map<string, ProductOption[]>();
    for (const option of options) {
      const current = optionsByProduct.get(option.product.id) ?? [];
      current.push(option);
      optionsByProduct.set(option.product.id, current);
    }

    return products.map((product) =>
      this.toManagerProduct(
        product,
        (optionsByProduct.get(product.id) ?? []).map((option) =>
          this.toManagerOption(option),
        ),
      ),
    );
  }

  async findAllForManager() {
    const products = await this.productRepository.find({
      order: { name: 'ASC' },
    });

    if (products.length === 0) return [];

    const options = await this.optionRepository.find({
      where: { product: { id: In(products.map((product) => product.id)) } },
      relations: { product: true },
      order: { optionType: 'ASC', name: 'ASC' },
    });

    const optionsByProduct = new Map<string, ProductOption[]>();
    for (const option of options) {
      const current = optionsByProduct.get(option.product.id) ?? [];
      current.push(option);
      optionsByProduct.set(option.product.id, current);
    }

    return products.map((product) =>
      this.toManagerProduct(
        product,
        (optionsByProduct.get(product.id) ?? []).map((option) =>
          this.toManagerOption(option),
        ),
      ),
    );
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stockQuantity: dto.stockQuantity,
      isAvailable: dto.isAvailable ?? true,
    });

    return this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Cần cung cấp ít nhất một trường để cập nhật',
      );
    }

    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Không tìm thấy đồ uống');
    }

    Object.assign(product, dto);
    await this.productRepository.save(product);
    return this.findManagerProduct(id);
  }

  async createOption(productId: string, dto: CreateProductOptionDto) {
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException('Không tìm thấy đồ uống');
    }

    const option = this.optionRepository.create({
      optionType: dto.optionType,
      name: dto.name,
      priceAdjustment: dto.priceAdjustment,
      isAvailable: dto.isAvailable ?? true,
      product,
    });

    const savedOption = await this.optionRepository.save(option);
    return this.toManagerOption(savedOption);
  }

  async updateOption(
    productId: string,
    optionId: string,
    dto: UpdateProductOptionDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Cần cung cấp ít nhất một trường để cập nhật',
      );
    }

    const option = await this.optionRepository.findOne({
      where: { id: optionId, product: { id: productId } },
    });
    if (!option) {
      throw new NotFoundException('Không tìm thấy tùy chọn của đồ uống');
    }

    Object.assign(option, dto);
    const savedOption = await this.optionRepository.save(option);
    return this.toManagerOption(savedOption);
  }

  private async findManagerProduct(id: string) {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException('Không tìm thấy đồ uống');
    }

    const options = await this.optionRepository.find({
      where: { product: { id } },
      order: { optionType: 'ASC', name: 'ASC' },
    });

    return this.toManagerProduct(
      product,
      options.map((option) => this.toManagerOption(option)),
    );
  }

  private toManagerProduct(product: Product, options: ManagerProductOption[]) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      isAvailable: product.isAvailable,
      createdAt: product.createdAt,
      options,
    };
  }

  private toManagerOption(option: ProductOption): ManagerProductOption {
    return {
      id: option.id,
      optionType: option.optionType,
      name: option.name,
      priceAdjustment: option.priceAdjustment,
      isAvailable: option.isAvailable,
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, isAvailable: true },
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy đồ uống');
    }

    const options = await this.optionRepository.find({
      where: {
        product: { id: product.id },
        isAvailable: true,
      },
      order: { optionType: 'ASC', name: 'ASC' },
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      isAvailable: product.isAvailable,
      createdAt: product.createdAt,
      options,
    };
  }
}
