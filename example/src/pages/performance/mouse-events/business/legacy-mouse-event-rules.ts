import type {
  BasicMouseEventLogEntry,
  BasicMouseHoverZones,
} from '../contexts/LegacyMouseEventsContexts';

export function createMouseEventLogEntry(input: {
  id: string;
  type: BasicMouseEventLogEntry['type'];
  details: string;
  timestamp: number;
}): BasicMouseEventLogEntry {
  return input;
}

export function appendMouseEventLog(
  entries: BasicMouseEventLogEntry[],
  entry: BasicMouseEventLogEntry,
  options: { maxEntries?: number } = {}
): BasicMouseEventLogEntry[] {
  const nextEntries = [...entries, entry];
  if (options.maxEntries == null) return nextEntries;
  return nextEntries.slice(-options.maxEntries);
}

export function setHoverZone(
  hoverZones: BasicMouseHoverZones,
  target: string,
  isActive: boolean
): BasicMouseHoverZones {
  return { ...hoverZones, [target]: isActive };
}

export function incrementClickCount(clickCount: number): number {
  return clickCount + 1;
}
