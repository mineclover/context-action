import React from 'react'
import { Link } from 'react-router-dom'

const DemoPage: React.FC = () => {
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
              <li className="text-gray-900">Demo</li>
            </ol>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            실시간 성능 비교 데모
          </h1>
          
          <p className="text-gray-600 mb-6">
            메모이제이션 사용 여부에 따른 성능 차이를 실시간으로 확인할 수 있습니다.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 메모이제이션 미사용 섹션 */}
            <div className="bg-red-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-4">
                메모이제이션 미사용
              </h2>
              <div className="space-y-4">
                {/* 여기에 메모이제이션 미사용 컴포넌트들이 들어갈 예정 */}
                <div className="bg-white rounded p-4">
                  <p className="text-gray-600">컴포넌트가 여기에 렌더링됩니다.</p>
                </div>
              </div>
            </div>

            {/* 메모이제이션 사용 섹션 */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                메모이제이션 사용
              </h2>
              <div className="space-y-4">
                {/* 여기에 메모이제이션 사용 컴포넌트들이 들어갈 예정 */}
                <div className="bg-white rounded p-4">
                  <p className="text-gray-600">컴포넌트가 여기에 렌더링됩니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 성능 지표 섹션 */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              성능 지표
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded p-4">
                <h3 className="font-medium text-gray-900">렌더링 횟수</h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="bg-white rounded p-4">
                <h3 className="font-medium text-gray-900">평균 렌더링 시간</h3>
                <p className="text-2xl font-bold text-blue-600">0ms</p>
              </div>
              <div className="bg-white rounded p-4">
                <h3 className="font-medium text-gray-900">메모리 사용량</h3>
                <p className="text-2xl font-bold text-blue-600">0MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoPage
