import { DataSource } from 'typeorm';
import { TestEntity } from '../entities/testEntity';
import { User } from '../entities/User';
import { Product } from '../entities/Product';
import { ProductType } from '../entities/ProductType';
import { ProductVariant } from '../entities/ProductVariant';
import { Attribute } from '../entities/Attribute';
import { AttributeValue } from '../entities/AttributeValue';

const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  entities: [TestEntity, User, Product, ProductType, ProductVariant, Attribute, AttributeValue],
  logging: false,
});

export default testDataSource;
