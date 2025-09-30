export interface AttributeValueDTO {
  attributeId: string; // UUID or numeric depending on schema
  valueId: string; // references attribute value entity
  value?: string; // optional human-readable value
}

export class ProductVariantDTO {
  id?: string;
  productId!: string;
  sku!: string;
  price!: number;
  stock!: number;
  attributes?: AttributeValueDTO[];
}
