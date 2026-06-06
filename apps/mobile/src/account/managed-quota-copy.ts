import type { AccountSnapshot } from '../api/account-client';

function formatDuration(seconds: number) {
  const value = Math.max(0, Math.round(seconds || 0));
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  return `${Math.round(value / 360) / 10}h`;
}

export function describeManagedQuota(snapshot: AccountSnapshot | null) {
  const managed = snapshot?.capabilities.managed;
  if (!managed) {
    return 'Managed mode unavailable';
  }

  const usage = managed.usage;
  const used = formatDuration(usage.audioSecondsUsed);
  const limit = formatDuration(usage.audioSecondsLimit);
  const status = managed.available ? 'Available' : 'Unavailable';

  if (usage.source !== 'dynamic_free') {
    return `${status} // ${used}/${limit} // ${usage.requestCountUsed}/${usage.requestCountLimit} requests`;
  }

  const floor = formatDuration(usage.guaranteedFloorSeconds || 300);
  const remaining = formatDuration(usage.audioSecondsLimit - usage.audioSecondsUsed);
  return `${status} // ${remaining} left today // ${floor} guaranteed // ${limit} quiet-pool limit`;
}
