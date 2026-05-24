export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(angka);
}

export function calculateMoM(thisMonth, lastMonth) {
  if (lastMonth === 0) return thisMonth > 0 ? "+100%" : "0%";
  const change = ((thisMonth - lastMonth) / lastMonth) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}
