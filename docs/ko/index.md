---
layout: home
title: Context Action
titleTemplate: 타입 안전한 액션 파이프라인 관리 시스템

hero:
  name: Context Action
  text: 타입 안전한 액션 파이프라인 관리 시스템
  tagline: React 통합과 향상된 상태 관리를 위한 TypeScript 모노레포
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/overview
    - theme: alt
      text: GitHub에서 보기
      link: https://github.com/mineclover/context-action

features:
  - icon: 🚀
    title: 액션 컨텍스트 패턴
    details: 통합된 액션 + 스토어 관리, 타입 안전한 액션 핸들러, Provider 기반 격리
  - icon: 🎯
    title: 액션 전용 패턴
    details: 스토어 없이 순수한 액션 디스패칭, 이벤트 시스템과 커맨드 패턴에 적합
  - icon: 🏪
    title: 스토어 전용 패턴
    details: 액션 없이 순수한 상태 관리, 뛰어난 타입 추론과 간소화된 API
  - icon: 🧩
    title: MVVM 아키텍처
    details: View(컴포넌트), ViewModel(액션 파이프라인), Model(스토어 시스템) 계층 분리
  - icon: 🛡️
    title: 타입 안전성
    details: 엄격한 타입 검사와 도메인별 훅으로 완전한 TypeScript 지원
  - icon: ⚡
    title: 성능 최적화
    details: 영향받는 컴포넌트만 리렌더링, 효율적인 상태 업데이트
---

<style>
.VPFeature .icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.VPFeatures .VPFeature {
  transition: transform 0.2s, box-shadow 0.2s;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>