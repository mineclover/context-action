/**
 * Dependency Injection Container
 * 
 * 클린 아키텍처에서 의존성 역전을 위한 DI 컨테이너
 * 모든 의존성을 여기서 중앙 관리
 */

import type { LLMSConfig } from '../../types/index.js';
import type { IFrontmatterService } from '../../domain/services/interfaces/IFrontmatterService.js';
import type { IDocumentSummaryRepository } from '../../domain/repositories/IDocumentSummaryRepository.js';
import type { ISummaryExtractor } from '../../domain/services/interfaces/ISummaryExtractor.js';
import { FrontmatterService } from '../services/FrontmatterService.js';
import { SummaryExtractor } from '../services/SummaryExtractor.js';
import { FileSystemDocumentSummaryRepository } from '../repositories/FileSystemDocumentSummaryRepository.js';
import { GenerateSummaryUseCase } from '../../application/use-cases/GenerateSummaryUseCase.js';
import { SummaryGeneratorUseCase } from '../../application/use-cases/SummaryGeneratorUseCase.js';

/**
 * 서비스 컨테이너 인터페이스
 */
export interface ServiceContainer {
  // Domain Services
  readonly frontmatterService: IFrontmatterService;
  readonly summaryExtractor: ISummaryExtractor;
  
  // Repositories
  readonly documentSummaryRepository: IDocumentSummaryRepository;
  
  // Use Cases
  readonly generateSummaryUseCase: GenerateSummaryUseCase;
  readonly summaryGeneratorUseCase: SummaryGeneratorUseCase;
}

/**
 * DIContainer
 * 
 * 의존성 주입 컨테이너 - 싱글톤 패턴으로 구현
 * 애플리케이션 시작 시 한 번 설정되고 전체 애플리케이션에서 공유
 */
export class DIContainer {
  private static instance: DIContainer | null = null;
  private _services: ServiceContainer | null = null;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 획득
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 서비스 컨테이너 초기화
   */
  initialize(config: LLMSConfig): void {
    if (this._services) {
      throw new Error('DIContainer is already initialized');
    }

    // Infrastructure Layer 서비스 생성
    const frontmatterService = new FrontmatterService();
    const summaryExtractor = new SummaryExtractor();
    
    const documentSummaryRepository = new FileSystemDocumentSummaryRepository(
      config.paths.llmContentDir,
      frontmatterService
    );

    // Application Layer 유스케이스 생성
    const generateSummaryUseCase = new GenerateSummaryUseCase(
      documentSummaryRepository,
      frontmatterService
    );

    const summaryGeneratorUseCase = new SummaryGeneratorUseCase(
      documentSummaryRepository,
      summaryExtractor,
      config
    );

    this._services = {
      frontmatterService,
      summaryExtractor,
      documentSummaryRepository,
      generateSummaryUseCase,
      summaryGeneratorUseCase
    };
  }

  /**
   * 서비스 컨테이너 획득
   */
  get services(): ServiceContainer {
    if (!this._services) {
      throw new Error('DIContainer is not initialized. Call initialize() first.');
    }
    return this._services;
  }

  /**
   * 특정 서비스 획득 (타입 안전)
   */
  getFrontmatterService(): IFrontmatterService {
    return this.services.frontmatterService;
  }

  getDocumentSummaryRepository(): IDocumentSummaryRepository {
    return this.services.documentSummaryRepository;
  }

  getGenerateSummaryUseCase(): GenerateSummaryUseCase {
    return this.services.generateSummaryUseCase;
  }

  getSummaryExtractor(): ISummaryExtractor {
    return this.services.summaryExtractor;
  }

  getSummaryGeneratorUseCase(): SummaryGeneratorUseCase {
    return this.services.summaryGeneratorUseCase;
  }

  /**
   * 컨테이너 리셋 (테스트용)
   */
  reset(): void {
    this._services = null;
    DIContainer.instance = null;
  }

  /**
   * 설정 변경 시 재초기화
   */
  reinitialize(config: LLMSConfig): void {
    this._services = null;
    this.initialize(config);
  }
}

/**
 * 편의 함수들
 */

/**
 * 글로벌 DI 컨테이너 인스턴스 획득
 */
export function getContainer(): DIContainer {
  return DIContainer.getInstance();
}

/**
 * 서비스 컨테이너 획득
 */
export function getServices(): ServiceContainer {
  return getContainer().services;
}

/**
 * 컨테이너 초기화 헬퍼
 */
export function initializeContainer(config: LLMSConfig): ServiceContainer {
  const container = getContainer();
  container.initialize(config);
  return container.services;
}

/**
 * 타입 안전한 서비스 접근자들
 */
export function useFrontmatterService(): IFrontmatterService {
  return getServices().frontmatterService;
}

export function useDocumentSummaryRepository(): IDocumentSummaryRepository {
  return getServices().documentSummaryRepository;
}

export function useGenerateSummaryUseCase(): GenerateSummaryUseCase {
  return getServices().generateSummaryUseCase;
}

export function useSummaryExtractor(): ISummaryExtractor {
  return getServices().summaryExtractor;
}

export function useSummaryGeneratorUseCase(): SummaryGeneratorUseCase {
  return getServices().summaryGeneratorUseCase;
}