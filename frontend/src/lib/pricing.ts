/** Only a positive, explicitly public recorded price may become an Offer. */
export function hasPublicPrice(product: { price_on_request: boolean; indicative_price?: string | number | null }) {
  return !product.price_on_request && product.indicative_price != null
    && Number.isFinite(Number(product.indicative_price)) && Number(product.indicative_price) > 0;
}
