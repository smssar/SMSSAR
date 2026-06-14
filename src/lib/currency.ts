export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid amount");
  }

  const base = from.toUpperCase();
  const target = to.toUpperCase();

  if (base === target) return amount;

  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);

  if (!res.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const data = await res.json();

  const rate = data?.rates?.[target];

  if (typeof rate !== "number") {
    throw new Error(`Rate not found for ${target}`);
  }

  return Math.round((amount * rate + Number.EPSILON) * 100) / 100;
}
