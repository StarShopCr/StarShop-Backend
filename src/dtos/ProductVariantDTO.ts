export class ProductVariantDTO {
  id?: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, unknown>[];
}
