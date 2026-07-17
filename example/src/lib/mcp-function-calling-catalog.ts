import type { LiveEditorToolsActions } from './live-editor-tools-schema';
import type { LiveWebCodingToolsActions } from './live-web-coding-tools-schema';
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

/** Public tool names used by the browser-owned Live Code Editor catalog. */
export type MCPLiveEditorToolName = keyof LiveEditorToolsActions & string;

/** Public tool names used by the realtime web-coding catalog. */
export type MCPRealtimeWebCodingToolName = keyof LiveWebCodingToolsActions &
  string;

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
    name: 'listAllTools',
    protocol: 'tools/list pagination helper',
    purpose:
      'nextCursor를 따라 모든 tools/list 페이지를 수집해 provider adapter가 cursor를 직접 재구현하지 않게 합니다.',
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
] satisfies readonly MCPCommandReference<MCPStandaloneToolName>[];

export const mcpLiveEditorCommands = [
  {
    id: 'live-editor-inspect-patch',
    title: '문서 확인 후 안전한 patch',
    description:
      'editor 상태·파일·현재 문서를 순서대로 읽고 관찰한 revision으로 bounded patch를 적용합니다.',
    prompt:
      '현재 editor 파일과 문서를 확인한 뒤, 첫 번째로 수정 가능한 줄 끝에 공백 두 칸을 추가하고 preview가 반영됐는지 확인해줘.',
    tools: [
      'editor.getStatus',
      'editor.listFiles',
      'editor.getDocument',
      'editor.applyPatch',
      'editor.getPreviewStatus',
    ],
    expectedChain: [
      'editor.getStatus',
      'editor.listFiles',
      'editor.getDocument',
      'editor.applyPatch',
      'iframe acknowledgement',
      'editor.getPreviewStatus',
    ],
    difficulty: 'Workflow',
  },
  {
    id: 'live-editor-open-save',
    title: '파일 열기 후 명시적 저장',
    description:
      'browser workspace에서 text file을 열고 preview acknowledgement를 받은 뒤 local folder 저장 경계를 설명합니다.',
    prompt:
      'script.js를 열고 preview가 갱신된 것을 확인한 다음 현재 파일을 local folder에 저장해줘.',
    tools: [
      'editor.getStatus',
      'editor.listFiles',
      'editor.openFile',
      'editor.saveFile',
    ],
    expectedChain: [
      'editor.getStatus',
      'editor.listFiles',
      'editor.openFile',
      'iframe acknowledgement',
      'editor.saveFile → approval/filesystem boundary',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'live-editor-preview-scenario',
    title: 'Preview scenario 확인',
    description:
      '문서 변경과 iframe acknowledgement를 분리해 안전한 preview scenario 전환을 확인합니다.',
    prompt:
      '현재 문서를 읽고 preview scenario를 invalid로 바꾼 뒤 preview 상태를 알려줘.',
    tools: [
      'editor.getDocument',
      'editor.setScenario',
      'editor.getPreviewStatus',
    ],
    expectedChain: [
      'editor.getDocument',
      'editor.setScenario',
      'iframe acknowledgement',
      'editor.getPreviewStatus',
    ],
    difficulty: 'Starter',
  },
] satisfies readonly MCPCommandReference<MCPLiveEditorToolName>[];

export const mcpRealtimeWebCodingCommands = [
  {
    id: 'realtime-theme-feature',
    title: '테마와 feature를 연속 반영',
    description:
      'realtime workspace revision을 확인하고 CSS·HTML mutation을 순차 실행한 뒤 preview를 확인합니다.',
    prompt:
      '현재 web workspace를 확인하고 emerald 테마로 바꾼 다음 "Tool result" feature를 추가해줘.',
    tools: [
      'web.getWorkspace',
      'web.setTheme',
      'web.addFeature',
      'web.runPreview',
    ],
    expectedChain: [
      'web.getWorkspace',
      'web.setTheme',
      'iframe acknowledgement',
      'web.addFeature',
      'iframe acknowledgement',
      'web.runPreview',
    ],
    difficulty: 'Workflow',
  },
  {
    id: 'realtime-revision-patch',
    title: 'Revision guard가 있는 patch',
    description:
      '파일을 읽어 얻은 workspace revision을 patch mutation에 전달해 stale edit를 거부하는 흐름입니다.',
    prompt:
      'index.html을 읽고 hero 제목 뒤에 " · live"를 추가하되, 읽은 revision이 바뀌었으면 덮어쓰지 말고 알려줘.',
    tools: [
      'web.getWorkspace',
      'web.readFile',
      'web.applyPatch',
      'web.runPreview',
    ],
    expectedChain: [
      'web.getWorkspace',
      'web.readFile',
      'web.applyPatch(expectedRevision)',
      'iframe acknowledgement',
      'web.runPreview',
    ],
    difficulty: 'Advanced',
  },
  {
    id: 'realtime-hero-update',
    title: 'Hero copy 업데이트',
    description:
      '범용 source 편집 대신 semantic visual tool을 사용해 hero 영역을 업데이트합니다.',
    prompt:
      'hero 제목을 "Build with tool calls"로, 설명을 "Every result is visible"로 바꿔줘.',
    tools: ['web.getWorkspace', 'web.updateHero', 'web.runPreview'],
    expectedChain: [
      'web.getWorkspace',
      'web.updateHero',
      'iframe acknowledgement',
      'web.runPreview',
    ],
    difficulty: 'Starter',
  },
] satisfies readonly MCPCommandReference<MCPRealtimeWebCodingToolName>[];

export type MCPFunctionCallingCommand =
  (typeof mcpFunctionCallingCommands)[number];
