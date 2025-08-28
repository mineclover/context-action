import React from 'react'
import { Link } from 'react-router-dom'

const AnalysisPage: React.FC = () => {
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
              <li>
                <Link to="/performance/memoization" className="text-gray-500 hover:text-gray-700">
                  Memoization
                </Link>
              </li>
              <li className="text-gray-900">Analysis</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            성능 분석 리포트
          </h1>
          
          <p className="text-gray-600 mb-6">
            다양한 시나리오에서 메모이제이션의 성능 효과를 상세히 분석합니다.
          </p>

          <div className="space-y-8">
            {/* 시나리오 1: 간단한 계산 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                시나리오 1: 간단한 계산
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded p-4">
                  <h3 className="font-medium text-red-900 mb-2">메모이제이션 미사용</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-4">
                  <h3 className="font-medium text-green-900 mb-2">메모이제이션 사용</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 시나리오 2: 복잡한 객체 생성 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                시나리오 2: 복잡한 객체 생성
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded p-4">
                  <h3 className="font-medium text-red-900 mb-2">메모이제이션 미사용</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-4">
                  <h3 className="font-medium text-green-900 mb-2">메모이제이션 사용</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 시나리오 3: API 호출 결과 */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                시나리오 3: API 호출 결과
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded p-4">
                  <h3 className="font-medium text-red-900 mb-2">메모이제이션 미사용</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded p-4">
                  <h3 className="font-medium text-green-900 mb-2">메모이제이션 사용</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 렌더링 횟수: 측정 중...</li>
                    <li>• 평균 시간: 측정 중...</li>
                    <li>• 메모리 사용량: 측정 중...</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalysisPage
