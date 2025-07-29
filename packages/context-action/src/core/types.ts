// 기본 액션 타입 정의
export interface BaseActionPayloadMap {
  // 기본 액션들은 여기에 정의
}

// 액션 타입 추출 헬퍼
export type ActionType<T extends Record<string, any>> = keyof T;
export type ActionPayload<
  T extends Record<string, any>,
  K extends keyof T
> = T[K];

// 액션 핸들러 타입
export type ActionHandlerMap<T extends Record<string, any>> = {
  [K in keyof T]?: (payload: T[K]) => void | Promise<void>;
};

// 액션 생성 헬퍼
export function createAction<T extends Record<string, any>, K extends keyof T>(
  type: K,
  payload: T[K]
): { type: K; payload: T[K] } {
  return { type, payload };
}

// 타입 가드
export function isAction<T extends Record<string, any>, K extends keyof T>(
  action: any,
  type: K
): action is { type: K; payload: T[K] } {
  return action?.type === type;
}