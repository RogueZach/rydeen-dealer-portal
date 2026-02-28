export function calculateDealerPrice(msrp: number, discountPercentage: number): number {
  const price = msrp * (1 - discountPercentage / 100)
  return Math.round(price * 100) / 100
}
