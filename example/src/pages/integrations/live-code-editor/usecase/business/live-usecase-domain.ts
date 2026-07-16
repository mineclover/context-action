export type UsecasePhase =
  | 'idle'
  | 'validating'
  | 'packaging'
  | 'ready'
  | 'blocked';

export interface UsecasePacket {
  priority: 'normal' | 'high';
  scope: string;
}

export interface UsecaseWorkflowState {
  resourceId: string;
  reason: string;
  phase: UsecasePhase;
  error: string | null;
  packet: UsecasePacket | null;
}
