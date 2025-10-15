module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      target: '17', // 최소 지원 React 버전
      // 라이브러리 컴파일을 위한 설정
      compilationMode: 'annotation', // "use memo" 지시어 기반 컴파일
    }],
  ],
  env: {
    production: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17',
          compilationMode: 'annotation',
        }],
      ],
    },
    development: {
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '17',
          compilationMode: 'annotation',
          logger: console,
        }],
      ],
    },
  },
};
