import { Link } from 'react-router-dom';

const guidelines = [
  [
    '먼저 측정하기',
    '렌더 횟수와 실제 작업량을 확인한 뒤 병목이 있는 경로에 적용합니다.',
  ],
  [
    '안정적인 의존성 유지하기',
    'useCallback/useMemo의 의존성을 줄이는 대신 최신 상태를 안전하게 읽는 구조를 사용합니다.',
  ],
  [
    '작은 값에는 과도하게 적용하지 않기',
    '메모이제이션 비용이 계산 비용보다 크면 단순한 구현이 더 낫습니다.',
  ],
  [
    '데모 수치는 참고값으로 보기',
    '브라우저·CPU·개발 모드에 따라 절대 시간은 달라지므로 추세를 비교합니다.',
  ],
];

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <Link to="/performance/memoization" className="hover:text-blue-700">
            Memoization
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Guidelines</span>
        </nav>
        <section className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-gray-900">
            메모이제이션 가이드라인
          </h1>
          <p className="mt-3 text-gray-600">
            Context-Action에서는 컴포넌트 전체를 무조건 감싸기보다, 안정적인
            command와 비싼 계산 경계를 분리해 필요한 곳에만 메모이제이션을
            적용합니다.
          </p>
        </section>
        <section className="space-y-3">
          {guidelines.map(([title, description], index) => (
            <article
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="font-semibold text-gray-900">
                {index + 1}. {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
              </p>
            </article>
          ))}
        </section>
        <Link
          to="/performance/memoization/demo"
          className="inline-flex rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700"
        >
          데모에서 확인
        </Link>
      </div>
    </main>
  );
}
