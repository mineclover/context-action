---
layout: home
title: Context Action
titleTemplate: 타입 안전한 액션 파이프라인 관리 시스템

hero:
  name: Context Action
  text: 타입 안전한 액션 파이프라인 관리 시스템
  tagline: React 통합, implementation playbook, 재사용 가능한 시나리오 데모를 위한 TypeScript 모노레포
  image:
    src: /logo.svg
    alt: Context Action
  actions:
    - theme: brand
      text: 표준 컨벤션 보기
      link: /ko/context-layered/implementation-convention
    - theme: alt
      text: 시나리오 라이브러리
      link: /ko/examples/implementation-playbook-scenarios

features:
  - icon: 📐
    title: 표준 컨벤션
    details: 폴더 구조, 상태 전이, 테스트, 문서 연결 방식을 먼저 고정하는 implementation-playbook 표준
  - icon: 🧠
    title: Repo-Local Skill
    details: 새 시나리오를 같은 규칙으로 스캐폴딩하고 반복 보강할 수 있는 저장소 내 skill
  - icon: 🧪
    title: Canonical Order Demo
    details: Action, Store, Ref, 명시적 상태 전이를 한 번에 보여주는 기본 데모
  - icon: 🔐
    title: Access Request Demo
    details: approval/review workflow를 같은 skill로 옮긴 interactive demo
  - icon: 🚨
    title: Incident Escalation Demo
    details: severity 규칙과 escalation packet을 다루는 운영 시나리오 demo
  - icon: 📈
    title: Renewal Risk Demo
    details: scoring, sponsor rule, follow-up packet을 다루는 customer-success 시나리오 demo
---

## 추천 학습 경로

1. [Implementation Convention](/ko/context-layered/implementation-convention)을 읽습니다.
2. [Canonical Order Form](/ko/examples/canonical-order-form)으로 기본 구조를 봅니다.
3. [Playbook 시나리오 라이브러리](/ko/examples/implementation-playbook-scenarios)로 다른 도메인 확장을 봅니다.
4. 라이브 데모를 따라가 봅니다.
   - [Canonical Order](https://mineclover.github.io/context-action/example/patterns/implementation-playbook)
   - [Access Request](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/access-request)
   - [Incident Escalation](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/incident-escalation)
   - [Renewal Risk Review](https://mineclover.github.io/context-action/example/patterns/implementation-playbook/renewal-risk-review)

repo-local skill 경로: `skills/context-action-implementation-playbook/SKILL.md`

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
