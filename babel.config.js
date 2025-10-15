module.exports = {
  plugins: [
    'babel-plugin-react-compiler',
  ],
  // React 17+ 호환성을 위한 설정
  env: {
    production: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17', // 최소 지원 React 버전
        }],
      ],
    },
    development: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17',
          // 개발 환경에서는 더 자세한 로깅
          logger: console,
        }],
      ],
    },
  },
};
