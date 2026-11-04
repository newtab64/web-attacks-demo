export function formatRelativeTimeVi(dateStr: string): string {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
  const now = new Date();
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return 'vừa xong';
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  }
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}
