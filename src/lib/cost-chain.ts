export interface CostChainResult {
  total: number;
  tax: number;
  shipping: number;
  landedCost: number;
  margin: number;
  customerPrice: number;
}

export function calculateCostChain(
  unitCost: number,
  quantity: number,
  taxRate: number,
  shippingRate: number,
  marginTarget: number
): CostChainResult {
  const total = unitCost * quantity;
  const tax = total * taxRate;
  const shipping = total * shippingRate;
  const landedCost = total + tax + shipping;
  const margin = landedCost * marginTarget;
  const customerPrice = landedCost + margin;

  return {
    total: Math.round(total * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    landedCost: Math.round(landedCost * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    customerPrice: Math.round(customerPrice * 100) / 100,
  };
}
