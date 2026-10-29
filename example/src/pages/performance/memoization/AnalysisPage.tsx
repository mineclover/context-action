import { Link } from 'react-router-dom';

const measurements = [
  ['Stable handler identity', 'Memoized lane keeps handler registrations stable while state changes.'],
  ['Derived work', 'Expensive calculations run only when the action or its input changes.'],
  ['Render visibility', 'Both lanes expose render count, rate, and accumulated work in the demo.'],
];

export default function AnalysisPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <Link to="/performance/memoization" className="hover:text-blue-700">Memoization</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Analysis</span>
        </nav>
        <section className="rounded-xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-gray-900">성능 분석 리포트</h1>
          <p className="mt-3 text-gray-600">
            결과 숫자는 실행 환경에 따라 달라질 수 있으므로 절대 시간보다 핸들러
            안정성, 렌더 횟수, 작업량 추세를 비교하는 데 사용합니다.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {measurements.map(([title, description]) => (
            <article key={title} className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold text-blue-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-blue-800">{description}</p>
            </article>
          ))}
        </section>
        <Link to="/performance/memoization/demo" className="inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          비교 데모 실행
        </Link>
      </div>
    </main>
  );
}
