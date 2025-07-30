---
layout: home
title: Context Action
titleTemplate: Language Selection

hero:
  name: Context Action
  text: Language Selection
  tagline: Choose your preferred language / 원하는 언어를 선택하세요
  image:
    src: /logo.svg
    alt: Context Action
  
features:
  - icon: 🇰🇷
    title: 한국어
    details: 한국어로 문서를 확인하세요
    link: /ko/guide/getting-started
    linkText: 한국어 문서 보기
  - icon: 🇺🇸  
    title: English
    details: View documentation in English
    link: /en/guide/getting-started
    linkText: View English Documentation
---

<style>
.VPFeature .link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 600;
}

.VPFeature .link:hover {
  color: var(--vp-c-brand-2);
}

.VPFeatures .VPFeature {
  cursor: pointer;
  transition: transform 0.2s;
}

.VPFeatures .VPFeature:hover {
  transform: translateY(-2px);
}
</style>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 자동 리다이렉트 옵션 (필요시 true로 변경)
  const autoRedirect = false
  
  if (autoRedirect) {
    const userLang = navigator.language || navigator.languages[0]
    if (userLang.startsWith('ko')) {
      window.location.href = '/context-action/ko/guide/getting-started'
    } else {
      window.location.href = '/context-action/en/guide/getting-started'
    }
  }
  
  // 언어 선택 클릭 이벤트 처리
  document.querySelectorAll('.VPFeature').forEach((feature, index) => {
    feature.addEventListener('click', () => {
      const links = ['/context-action/ko/guide/getting-started', '/context-action/en/guide/getting-started']
      window.location.href = links[index]
    })
  })
})
</script>