import type { AccountSnapshot } from '../api/account-client';

export function formatDuration(seconds: number) {
  const value = Math.max(0, Math.round(seconds || 0));
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  return `${Math.round(value / 360) / 10}h`;
}

function sourceLabel(source: string) {
  if (source === 'android' || source === 'ios') return 'mobile';
  if (source === 'web') return 'browser';
  return source;
}

export function describeAccountActivity(snapshot: AccountSnapshot | null) {
  const activity = snapshot?.accountActivity;
  if (!activity) {
    return 'Refresh account to load global activity.';
  }

  const sources = activity.sourceBreakdown
    .filter((item) => item.recordingsToday > 0 || item.audioSecondsToday > 0)
    .map((item) => `${sourceLabel(item.source)} ${item.recordingsToday}`)
    .join(' • ');

  return `${activity.recordingsToday} recordings // ${formatDuration(activity.audioSecondsToday)} audio // ${activity.processingCallsToday} calls${sources ? ` // ${sources}` : ''}`;
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
  return `${status} // ${remaining} bonus left today // ${floor} guaranteed // ${limit} available`;
}
