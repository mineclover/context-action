import React from 'react'
import { Link } from 'react-router-dom'

const MemoizationPerformancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/performance" className="text-gray-500 hover:text-gray-700">
                  Performance
                </Link>
              </li>
              <li className="text-gray-900">Memoization</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            메모이제이션 성능 비교
          </h1>
          
          <p className="text-gray-600 mb-6">
            Context-Action에서 메모이제이션 사용 여부에 따른 성능 차이를 비교하고 분석합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/performance/memoization/demo"
              className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                실시간 성능 비교 데모
              </h3>
              <p className="text-blue-700">
                메모이제이션 사용/미사용 시나리오를 실시간으로 비교하고 성능 지표를 확인합니다.
              </p>
            </Link>

            <Link
              to="/performance/memoization/analysis"
              className="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                성능 분석 리포트
              </h3>
              <p className="text-green-700">
                다양한 시나리오에서의 메모이제이션 효과를 상세히 분석합니다.
              </p>
            </Link>

            <Link
              to="/performance/memoization/guidelines"
              className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                메모이제이션 가이드라인
              </h3>
              <p className="text-purple-700">
                언제 메모이제이션을 사용해야 하는지에 대한 실용적인 가이드라인입니다.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoizationPerformancePage
