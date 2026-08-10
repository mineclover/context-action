import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import { parseDate } from '@internationalized/date';
import { type ReactNode, useCallback, useMemo } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  Cell,
  Column,
  Heading,
  Row,
  type Selection,
  Table,
  TableBody,
  TableHeader,
} from 'react-aria-components';

type SortColumn = 'project' | 'owner' | 'status' | 'reviewDate';
type SortDirection = 'ascending' | 'descending';

interface ReviewRow {
  id: string;
  project: string;
  owner: string;
  status: 'Ready' | 'Needs review' | 'Blocked';
  reviewDate: string;
}

interface ReactAriaReferenceActions extends ActionPayloadMap {
  tableSelectionChanged: { keys: string[] };
  tableSortChanged: { column: SortColumn; direction: SortDirection };
  calendarDateCommitted: { value: string | null };
  reviewScheduled: void;
}

interface AuditEntry {
  id: string;
  message: string;
}

const reviewRows: ReviewRow[] = [
  {
    id: 'core-contract',
    project: 'Core public contract',
    owner: 'Mina',
    status: 'Ready',
    reviewDate: '2026-08-12',
  },
  {
    id: 'react-ssr',
    project: 'React SSR consumer',
    owner: 'Jae',
    status: 'Needs review',
    reviewDate: '2026-08-14',
  },
  {
    id: 'tool-protocol',
    project: 'Tool Protocol adapter',
    owner: 'Sora',
    status: 'Ready',
    reviewDate: '2026-08-18',
  },
  {
    id: 'webmcp-boundary',
    project: 'WebMCP boundary',
    owner: 'Hoon',
    status: 'Blocked',
    reviewDate: '2026-08-21',
  },
];

const ReactAriaReferenceStores = createStoreContext('ReactAriaReference', {
  selectedKeys: { initialValue: [] as string[] },
  sort: {
    initialValue: {
      column: 'reviewDate' as SortColumn,
      direction: 'ascending' as SortDirection,
    },
  },
  selectedDate: { initialValue: '2026-08-12' as string | null },
  audit: { initialValue: [] as AuditEntry[] },
});

const ReactAriaReferenceActions =
  createActionContext<ReactAriaReferenceActions>('ReactAriaReference');

function formatDate(value: string | null) {
  if (!value) return '날짜를 선택하세요';
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatSelection(keys: string[]) {
  if (keys.length === 0) return '선택된 행 없음';
  return `${keys.length}개 행 선택됨`;
}

function statusClass(status: ReviewRow['status']) {
  if (status === 'Ready') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Blocked') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
}

function ReactAriaReferenceHandlers({ children }: { children: ReactNode }) {
  const selectedKeysStore = ReactAriaReferenceStores.useStore('selectedKeys');
  const sortStore = ReactAriaReferenceStores.useStore('sort');
  const selectedDateStore = ReactAriaReferenceStores.useStore('selectedDate');
  const auditStore = ReactAriaReferenceStores.useStore('audit');

  const record = useCallback(
    (message: string) => {
      const entries = auditStore.getValue();
      auditStore.setValue(
        [
          {
            id: `${Date.now()}-${entries.length}`,
            message,
          },
          ...entries,
        ].slice(0, 5)
      );
    },
    [auditStore]
  );

  ReactAriaReferenceActions.useActionHandler(
    'tableSelectionChanged',
    useCallback(
      ({ keys }) => {
        selectedKeysStore.setValue(keys);
        record(`Table selection committed: ${keys.length || 'no'} row(s).`);
      },
      [record, selectedKeysStore]
    ),
    { id: 'react-aria-table-selection', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'tableSortChanged',
    useCallback(
      ({ column, direction }) => {
        sortStore.setValue({ column, direction });
        record(`Table sort committed: ${column} (${direction}).`);
      },
      [record, sortStore]
    ),
    { id: 'react-aria-table-sort', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'calendarDateCommitted',
    useCallback(
      ({ value }) => {
        selectedDateStore.setValue(value);
        record(`Calendar date committed: ${value ?? 'cleared'}.`);
      },
      [record, selectedDateStore]
    ),
    { id: 'react-aria-calendar-date', priority: 100 }
  );

  ReactAriaReferenceActions.useActionHandler(
    'reviewScheduled',
    useCallback(() => {
      const date = selectedDateStore.getValue();
      const selection = selectedKeysStore.getValue();
      record(
        date && selection.length > 0
          ? `Scheduled ${selection.length} selected review(s) for ${date}.`
          : 'Scheduling needs both a calendar date and at least one selected row.'
      );
    }, [record, selectedDateStore, selectedKeysStore]),
    { id: 'react-aria-schedule-review', priority: 80 }
  );

  return children;
}

function ReactAriaReferenceContent() {
  const selectedKeysStore = ReactAriaReferenceStores.useStore('selectedKeys');
  const sortStore = ReactAriaReferenceStores.useStore('sort');
  const selectedDateStore = ReactAriaReferenceStores.useStore('selectedDate');
  const auditStore = ReactAriaReferenceStores.useStore('audit');
  const selectedKeys = useStoreValue(selectedKeysStore);
  const sort = useStoreValue(sortStore);
  const selectedDate = useStoreValue(selectedDateStore);
  const audit = useStoreValue(auditStore);
  const dispatch = ReactAriaReferenceActions.useActionDispatch();

  const sortedRows = useMemo(() => {
    const multiplier = sort.direction === 'ascending' ? 1 : -1;
    return [...reviewRows].sort(
      (left, right) =>
        left[sort.column].localeCompare(right[sort.column]) * multiplier
    );
  }, [sort]);

  const onSelectionChange = useCallback(
    (selection: Selection) => {
      const keys =
        selection === 'all'
          ? reviewRows.map((row) => row.id)
          : [...selection].map(String);
      void dispatch('tableSelectionChanged', { keys });
    },
    [dispatch]
  );

  const onSortChange = useCallback(
    (next: { column: React.Key; direction: SortDirection }) => {
      void dispatch('tableSortChanged', {
        column: next.column as SortColumn,
        direction: next.direction,
      });
    },
    [dispatch]
  );

  const onCalendarChange = useCallback(
    (value: { toString(): string } | null) => {
      void dispatch('calendarDateCommitted', {
        value: value?.toString() ?? null,
      });
    },
    [dispatch]
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
          React Aria integration reference
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Table + Calendar, with Context-Action at the domain boundary
        </h1>
        <p className="mt-3 max-w-4xl text-slate-700">
          React Aria owns keyboard navigation, focus, collection behavior, and
          calendar grid interaction. Context-Action persists product-facing
          selection, sort, date, and scheduling actions.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Review queue table
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                행 선택과 정렬은 action으로 기록되지만, 표의
                접근성·포커스·키보드 동작은 React Aria가 유지합니다.
              </p>
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800">
              {formatSelection(selectedKeys)}
            </span>
          </div>

          <Table
            aria-label="Release review queue"
            className="w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 text-left"
            selectionMode="multiple"
            selectedKeys={new Set(selectedKeys)}
            onSelectionChange={onSelectionChange}
            sortDescriptor={sort}
            onSortChange={onSortChange}
          >
            <TableHeader className="bg-slate-50 text-sm text-slate-700">
              <Column
                id="project"
                isRowHeader
                allowsSorting
                className="border-b border-slate-200 px-4 py-3 font-semibold"
              >
                Project
              </Column>
              <Column
                id="owner"
                allowsSorting
                className="border-b border-slate-200 px-4 py-3 font-semibold"
              >
                Owner
              </Column>
              <Column
                id="status"
                allowsSorting
                className="border-b border-slate-200 px-4 py-3 font-semibold"
              >
                Status
              </Column>
              <Column
                id="reviewDate"
                allowsSorting
                className="border-b border-slate-200 px-4 py-3 font-semibold"
              >
                Review date
              </Column>
            </TableHeader>
            <TableBody items={sortedRows}>
              {(item) => (
                <Row
                  id={item.id}
                  className="cursor-default outline-none transition hover:bg-violet-50 data-[selected]:bg-violet-100 data-[focus-visible]:ring-2 data-[focus-visible]:ring-inset data-[focus-visible]:ring-violet-600"
                >
                  <Cell className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">
                    {item.project}
                  </Cell>
                  <Cell className="border-b border-slate-100 px-4 py-3 text-slate-700">
                    {item.owner}
                  </Cell>
                  <Cell className="border-b border-slate-100 px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </Cell>
                  <Cell className="border-b border-slate-100 px-4 py-3 text-slate-700">
                    {item.reviewDate}
                  </Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Review date calendar
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            날짜를 확정하면 Context-Action store에 ISO 날짜로 저장합니다. 월
            이동과 셀 포커스는 Calendar 내부 상태로 남습니다.
          </p>
          <Calendar
            aria-label="Review schedule date"
            value={selectedDate ? parseDate(selectedDate) : null}
            onChange={onCalendarChange}
            className="mt-5 rounded-xl border border-slate-200 p-4"
          >
            <header className="mb-4 flex items-center justify-between">
              <Button
                slot="previous"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                이전
              </Button>
              <Heading className="font-bold text-slate-900" />
              <Button
                slot="next"
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                다음
              </Button>
            </header>
            <CalendarGrid className="w-full border-collapse text-center text-sm text-slate-700">
              {(date) => (
                <CalendarCell
                  date={date}
                  className="m-0.5 inline-flex size-9 items-center justify-center rounded-lg outline-none hover:bg-violet-50 data-[selected]:bg-violet-700 data-[selected]:text-white data-[focus-visible]:ring-2 data-[focus-visible]:ring-violet-600 data-[disabled]:text-slate-300"
                />
              )}
            </CalendarGrid>
          </Calendar>
          <div className="mt-4 rounded-xl bg-violet-50 p-4">
            <p className="text-sm font-semibold text-violet-900">확정 예정일</p>
            <p className="mt-1 text-lg font-bold text-violet-950">
              {formatDate(selectedDate)}
            </p>
          </div>
          <Button
            onPress={() => void dispatch('reviewScheduled')}
            className="mt-4 w-full rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            선택한 행에 리뷰 일정 적용
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Context-Action audit trail
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          UI 상태 머신 자체가 아니라 도메인 경계에서 일어난 확정 이벤트만
          기록합니다.
        </p>
        <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {audit.length === 0 ? (
            <li className="text-sm text-slate-500">
              Table 또는 Calendar를 조작하면 action 기록이 나타납니다.
            </li>
          ) : (
            audit.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
              >
                {entry.message}
              </li>
            ))
          )}
        </ol>
      </section>
    </main>
  );
}

export default function ReactAriaReferencePage() {
  return (
    <ReactAriaReferenceStores.Provider>
      <ReactAriaReferenceActions.Provider>
        <ReactAriaReferenceHandlers>
          <ReactAriaReferenceContent />
        </ReactAriaReferenceHandlers>
      </ReactAriaReferenceActions.Provider>
    </ReactAriaReferenceStores.Provider>
  );
}
