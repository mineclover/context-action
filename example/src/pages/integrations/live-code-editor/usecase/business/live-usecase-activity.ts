export type ActivityTone = 'info' | 'success' | 'blocked';

export interface UsecaseActivityEvent {
  id: number;
  layer: 'contract' | 'handler' | 'business' | 'facade' | 'recipe';
  label: string;
  detail: string;
  tone: ActivityTone;
}

export const initialUsecaseActivity: UsecaseActivityEvent[] = [
  {
    id: 1,
    layer: 'contract',
    label: 'Scope mounted',
    detail: 'Action, Store, Facade, Recipe 경계를 준비했습니다.',
    tone: 'info',
  },
];

export function appendUsecaseActivity(
  activity: readonly UsecaseActivityEvent[],
  event: Omit<UsecaseActivityEvent, 'id'>
): UsecaseActivityEvent[] {
  const nextId =
    activity.reduce(
      (currentMax, currentEvent) => Math.max(currentMax, currentEvent.id),
      0
    ) + 1;

  return [...activity.slice(-5), { ...event, id: nextId }];
}
