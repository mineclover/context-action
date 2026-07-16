import type { UIToolsActions } from './ui-tools-schema';

export type MCPCommandDifficulty = 'Starter' | 'Workflow' | 'Advanced';

export interface MCPCommandReference<TToolName extends string = string> {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tools: readonly TToolName[];
  expectedChain: readonly string[];
  difficulty: MCPCommandDifficulty;
}

export interface MCPStandaloneCommandReference<
  TToolName extends string = string,
> {
  id: string;
  title: string;
  description: string;
  prompt: string;
  tools: readonly TToolName[];
  expectedChain: readonly string[];
  difficulty: MCPCommandDifficulty;
}

/** Public tool names used by the standalone web-coding catalog. */
export type MCPStandaloneToolName =
  | 'workspace.getStatus'
  | 'workspace.reset'
  | 'workspace.listFiles'
  | 'workspace.readFile'
  | 'workspace.downloadFile'
  | 'workspace.openFile'
  | 'workspace.createFile'
  | 'workspace.renameFile'
  | 'workspace.deleteFile'
  | 'workspace.writeFile'
  | 'workspace.saveAll'
  | 'workspace.saveCheckpoint'
  | 'workspace.reloadFolder'
  | 'workspace.disconnectFolder'
  | 'workspace.applyPatch'
  | 'workspace.revertFile'
  | 'workspace.undo'
  | 'workspace.redo'
  | 'preview.setTheme'
  | 'preview.addFeature'
  | 'preview.updateHero'
  | 'preview.getStatus'
  | 'preview.refresh';

export const mcpExecutionStages = [
  {
    label: 'Discover',
    protocol: 'tools/list',
    description:
      'MCP tool definitions expose names, descriptions, and input schemas.',
  },
  {
    label: 'Decide',
    protocol: 'model tool call',
    description:
      'The model selects a tool and produces arguments that match its schema.',
  },
  {
    label: 'Execute',
    protocol: 'tools/call',
    description:
      'The browser bridge dispatches the call through ToolContext validation and handlers.',
  },
  {
    label: 'Continue',
    protocol: 'tool result',
    description:
      'The result returns to the model so it can complete or continue the chain.',
  },
] as const;

export const mcpToolManagementMethods = [
  {
    name: 'listTools',
    protocol: 'tools/list',
    purpose:
      '등록된 표준 ToolDefinition 목록과 inputSchema·선택적 outputSchema를 조회합니다.',
  },
  {
    name: 'getToolDefinition',
    protocol: 'definition lookup',
    purpose: '모델·UI·검증기가 동일한 입력·출력 도구 계약을 참조하게 합니다.',
  },
  {
    name: 'callTool',
    protocol: 'tools/call',
    purpose:
      '검증된 인자로 ToolContext 핸들러를 실행하고 표준 결과를 반환합니다.',
  },
  {
    name: 'executeModelToolCall',
    protocol: 'model tool call → tools/call',
    purpose:
      'Provider별 모델 호출을 canonical tools/call 요청으로 정규화합니다.',
  },
  {
    name: 'toolPolicy',
    protocol: 'allow / ask / deny',
    purpose:
      '허용 목록과 destructive tool 승인 정책을 discovery와 execution 양쪽에 적용합니다.',
  },
  {
    name: 'onToolCall',
    protocol: 'started / completed / failed',
    purpose:
      'toolCallId와 source context를 기준으로 병렬 호출과 실패를 추적합니다.',
  },
] as const;

export const mcpFunctionCallingCommands = [
  {
    id: 'inspect-update-heading',
    title: '상태 확인 후 화면 갱신',
    description:
      '읽기 도구와 변경 도구를 한 번의 대화에서 순서대로 실행합니다.',
    prompt:
      '현재 UI 상태를 확인하고 counter를 3 증가시킨 뒤, heading을 "MCP function calling 성공"으로 바꿔줘.',
    tools: ['getUiState', 'updateCounter', 'updateHeading'],
    expectedChain: ['getUiState', 'updateCounter', 'updateHeading'],
    difficulty: 'Workflow',
  },
  {
    id: 'add-and-confirm',
    title: '항목 추가 후 결과 확인',
    description:
      '쓰기 호출 뒤 읽기 호출로 실행 결과를 확인하는 기본 체인입니다.',
    prompt:
      '중요도 high인 "MCP toolchain demo" 항목을 추가하고 현재 목록 개수를 확인해줘.',
    tools: ['addListItem', 'getUiState'],
    expectedChain: ['addListItem', 'getUiState'],
    difficulty: 'Starter',
  },
  {
    id: 'theme-notification',
    title: 'UI 변경과 알림 결합',
    description:
      '서로 다른 UI 도구를 연결해 사용자에게 실행 결과를 보여줍니다.',
    prompt:
      '테마를 dark로 바꾸고 "MCP toolchain active" 알림을 3초 동안 보여줘.',
    tools: ['toggleTheme', 'showNotification'],
    expectedChain: ['toggleTheme', 'showNotification'],
    difficulty: 'Workflow',
  },
  {
    id: 'safe-clear',
    title: '읽기 후 안전한 초기화',
    description:
      '파괴적 도구를 실행하기 전에 현재 상태를 읽고 명시적으로 확인합니다.',
    prompt:
      '현재 목록을 먼저 확인하고, 항목이 있으면 confirm=true로 목록을 비워줘.',
    tools: ['getUiState', 'clearList'],
    expectedChain: ['getUiState', 'clearList'],
    difficulty: 'Advanced',
  },
  {
    id: 'read-only-state',
    title: '읽기 전용 상태 질의',
    description: '상태를 변경하지 않고 선택한 필드만 반환하는 호출입니다.',
    prompt: '현재 theme, counter, heading만 알려줘. 상태는 변경하지 마.',
    tools: ['getUiState'],
    expectedChain: ['getUiState'],
    difficulty: 'Starter',
  },
] satisfies readonly MCPCommandReference<keyof UIToolsActions & string>[];

export const mcpStandaloneCommands = [
  {
    id: 'standalone-theme-chain',
    title: 'Preview 테마 변경',
    description:
      'workspace 상태를 먼저 확인한 뒤 preview mutation과 iframe acknowledgement를 확인합니다.',
    prompt: '현재 workspace 상태를 확인하고 emerald 테마로 바꿔줘.',
    tools: ['workspace.getStatus', 'preview.setTheme'],
    expectedChain: [
      'workspace.getStatus',
      'preview.setTheme',
      'iframe acknowledgement',
    ],
    difficulty: 'Starter',
  },
  {
    id: 'standalone-bounded-patch',
    title: '정확한 source patch',
    description:
      '현재 파일을 읽은 revision을 mutation guard로 넘겨 bounded literal patch를 실행합니다.',
    prompt: 'app.js에서 "Interaction received"를 "Clicked!"로 바꿔줘.',
    tools: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.readFile',
      'workspace.applyPatch',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.readFile',
      'workspace.applyPatch',
      'iframe acknowledgement',
    ],
    difficulty: 'Workflow',
  },
  {
    id: 'standalone-browser-save',
    title: '파일 생성 후 browser checkpoint 저장',
    description:
      '새 파일을 만들고 local folder가 없는 경우 saveAll 대신 browser-only checkpoint 경계를 사용합니다.',
    prompt: '파일 notes.md를 만들고 저장해줘.',
    tools: [
      'workspace.getStatus',
      'workspace.createFile',
      'workspace.saveCheckpoint',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.createFile',
      'iframe acknowledgement',
      'workspace.saveCheckpoint',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'standalone-download-approval',
    title: '현재 파일 다운로드 승인',
    description:
      '읽기 preflight 후 browser download가 approval boundary를 통과하는지 확인합니다.',
    prompt: '현재 파일을 다운로드해줘.',
    tools: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.downloadFile',
    ],
    expectedChain: [
      'workspace.getStatus',
      'workspace.listFiles',
      'workspace.downloadFile → approval',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'standalone-reset-recovery',
    title: '데모 workspace 복구',
    description:
      '반복 테스트 중 남은 IndexedDB 상태를 destructive reset으로 초기 seed에 되돌립니다.',
    prompt: '브라우저 데모 workspace를 초기화해줘.',
    tools: ['workspace.getStatus', 'workspace.reset'],
    expectedChain: [
      'workspace.getStatus',
      'workspace.reset → approval',
      'iframe acknowledgement',
    ],
    difficulty: 'Advanced',
  },
] satisfies readonly MCPStandaloneCommandReference<MCPStandaloneToolName>[];

export type MCPFunctionCallingCommand =
  (typeof mcpFunctionCallingCommands)[number];
