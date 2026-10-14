export function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'GBP') return `£${amount.toLocaleString()}`;
  if (currency === 'EUR') return `€${amount.toLocaleString()}`;
  return `$${amount.toLocaleString()}`;
}

export function calculateDaysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function formatTimeAgo(dateStr: string): string {
  const days = calculateDaysAgo(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function getCategoryDisplayName(cat: string): string {
  switch (cat) {
    case 'job':
      return 'Remote Job';
    case 'lead':
      return 'Client Lead';
    case 'freelance':
      return 'Contract / Freelance';
    case 'grant':
      return 'Tech Grant';
    case 'scholarship':
      return 'Scholarship';
    case 'partner':
      return 'Partnership';
    case 'consulting':
      return 'Consulting';
    default:
      return cat;
  }
}
