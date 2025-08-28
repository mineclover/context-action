import { Link } from 'react-router-dom';

export default function FoundationsOverview() {
  return (
    <div className="catalog-overview p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🏗️ Foundations</h1>
        <p className="text-xl text-gray-700 mb-6">
          Context-Action 프레임워크의 핵심 개념과 기본 사용법을 학습합니다.
        </p>
      </div>

      <div className="learning-path bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">📚 추천 학습 순서</h2>
        <ol className="space-y-3">
          <li className="flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">1</span>
            <div>
              <Link 
                to="/foundations/core/basics" 
                className="text-blue-600 hover:text-blue-800 font-medium text-lg"
              >
                Core Basics
              </Link>
              <p className="text-gray-600">ActionRegister의 기본 개념과 사용법</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">2</span>
            <div>
              <Link 
                to="/foundations/store/basics" 
                className="text-blue-600 hover:text-blue-800 font-medium text-lg"
              >
                Store Basics
              </Link>
              <p className="text-gray-600">Store 시스템의 기초와 상태 관리</p>
            </div>
          </li>
          <li className="flex items-center">
            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-semibold">3</span>
            <div>
              <Link 
                to="/foundations/react/provider" 
                className="text-blue-600 hover:text-blue-800 font-medium text-lg"
              >
                React Integration
              </Link>
              <p className="text-gray-600">React와 Context-Action의 통합</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="categories grid md:grid-cols-3 gap-6">
        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">⚙️ Core</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/foundations/core/basics" className="text-blue-600 hover:underline">
                Basic Concepts
              </Link>
            </li>
            <li>
              <Link to="/foundations/core/advanced" className="text-blue-600 hover:underline">
                Advanced Features
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">🏪 Store</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/foundations/store/basics" className="text-blue-600 hover:underline">
                Store Basics
              </Link>
            </li>
            <li>
              <Link to="/foundations/store/immutability-test" className="text-blue-600 hover:underline">
                Immutability Test
              </Link>
            </li>
          </ul>
        </div>

        <div className="category-card bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">⚛️ React</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/foundations/react/provider" className="text-blue-600 hover:underline">
                Provider Pattern
              </Link>
            </li>
            <li>
              <Link to="/foundations/react/context" className="text-blue-600 hover:underline">
                Context Integration
              </Link>
            </li>
            <li>
              <Link to="/foundations/react/hooks" className="text-blue-600 hover:underline">
                Hooks Usage
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 학습 팁</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>각 예제는 점진적으로 복잡해지므로 순서대로 학습하세요</li>
          <li>브라우저 개발자 도구를 활용해 동작 과정을 관찰하세요</li>
          <li>코드를 직접 수정해보며 동작을 이해하세요</li>
        </ul>
      </div>
    </div>
  );
}