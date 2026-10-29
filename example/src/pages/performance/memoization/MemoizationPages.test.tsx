import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AnalysisPage from './AnalysisPage';
import GuidelinesPage from './GuidelinesPage';

describe('Memoization documentation pages', () => {
  afterEach(() => cleanup());

  it('renders the analysis contract and demo link', () => {
    render(
      <MemoryRouter>
        <AnalysisPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: '성능 분석 리포트' })
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '비교 데모 실행' }).getAttribute('href')
    ).toBe('/performance/memoization/demo');
  });

  it('renders actionable memoization guidelines', () => {
    render(
      <MemoryRouter>
        <GuidelinesPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: '메모이제이션 가이드라인' })
    ).toBeTruthy();
    expect(screen.getByText(/먼저 측정하기/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '데모에서 확인' }).getAttribute('href')
    ).toBe('/performance/memoization/demo');
  });
});
