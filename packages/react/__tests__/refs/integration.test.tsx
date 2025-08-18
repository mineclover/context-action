/**
 * @fileoverview Integration Tests for Ref System
 * 
 * 전체 참조 시스템의 통합 테스트
 * - 실제 사용 시나리오 테스트
 * - 복합 기능 테스트
 * - 성능 테스트
 */

import React, { useCallback, useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createDeclarativeRefPattern } from '../../src/refs/declarative-ref-pattern';
import type { RefInitConfig } from '../../src/refs/types';

// 복잡한 테스트 시나리오를 위한 타입들
interface GameEngine {
  isRunning: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  update(deltaTime: number): void;
}

interface AudioSystem {
  volume: number;
  isPlaying: boolean;
  play(sound: string): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
}

interface GameActions {
  initializeGame: void;
  startGame: void;
  stopGame: void;
  updateVolume: { volume: number };
  playSound: { sound: string };
  handleGameError: { error: Error; context: string };
  cleanup: void;
}

describe('Ref System Integration Tests', () => {
  describe('Real-world Game Scenario', () => {
    test('should handle complete game lifecycle', async () => {
      const mockGameEngine: GameEngine = {
        isRunning: false,
        start: jest.fn().mockImplementation(async function(this: GameEngine) {
          await new Promise(resolve => setTimeout(resolve, 100));
          this.isRunning = true;
        }),
        stop: jest.fn().mockImplementation(async function(this: GameEngine) {
          await new Promise(resolve => setTimeout(resolve, 50));
          this.isRunning = false;
        }),
        dispose: jest.fn().mockResolvedValue(undefined),
        update: jest.fn()
      };

      const mockAudioSystem: AudioSystem = {
        volume: 0.5,
        isPlaying: false,
        play: jest.fn().mockImplementation(async function(this: AudioSystem, sound: string) {
          await new Promise(resolve => setTimeout(resolve, 50));
          this.isPlaying = true;
        }),
        stop: jest.fn().mockImplementation(async function(this: AudioSystem) {
          await new Promise(resolve => setTimeout(resolve, 25));
          this.isPlaying = false;
        }),
        dispose: jest.fn().mockResolvedValue(undefined)
      };

      const { Provider, useRef, useAction, useActionHandler } = createDeclarativeRefPattern(
        'GameSystem',
        {
          refs: {
            canvas: {
              name: 'canvas',
              objectType: 'dom',
              validator: (target: unknown): target is HTMLCanvasElement => 
                target instanceof HTMLCanvasElement
            } as RefInitConfig<HTMLCanvasElement>,

            gameEngine: {
              name: 'gameEngine',
              objectType: 'custom',
              validator: (target: unknown): target is GameEngine =>
                typeof target === 'object' && 
                target !== null &&
                'start' in target && 'stop' in target,
              cleanup: async (engine: GameEngine) => {
                if (engine.isRunning) {
                  await engine.stop();
                }
                await engine.dispose();
              }
            } as RefInitConfig<GameEngine>,

            audioSystem: {
              name: 'audioSystem', 
              objectType: 'custom',
              validator: (target: unknown): target is AudioSystem =>
                typeof target === 'object' && 
                target !== null &&
                'play' in target && 'stop' in target,
              cleanup: async (audio: AudioSystem) => {
                if (audio.isPlaying) {
                  await audio.stop();
                }
                await audio.dispose();
              }
            } as RefInitConfig<AudioSystem>
          },
          actions: {
            initializeGame: void 0,
            startGame: void 0,
            stopGame: void 0,
            updateVolume: { volume: 0.5 },
            playSound: { sound: 'test.mp3' },
            handleGameError: { error: new Error(), context: 'test' },
            cleanup: void 0
          } as GameActions
        }
      );

      function GameComponent() {
        const canvasRef = useRef('canvas');
        const gameEngineRef = useRef('gameEngine');
        const audioSystemRef = useRef('audioSystem');
        const dispatch = useAction();
        
        const [gameState, setGameState] = useState<'loading' | 'ready' | 'running' | 'stopped' | 'error'>('loading');
        const [error, setError] = useState<string | null>(null);

        // 게임 초기화
        useActionHandler('initializeGame', useCallback(async () => {
          try {
            setGameState('loading');
            setError(null);

            // 시스템 초기화
            gameEngineRef.current = mockGameEngine;
            audioSystemRef.current = mockAudioSystem;

            await new Promise(resolve => setTimeout(resolve, 200)); // 초기화 시뮬레이션
            setGameState('ready');
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Initialization failed');
            setGameState('error');
            dispatch('handleGameError', { error: error as Error, context: 'initialization' });
          }
        }, [gameEngineRef, audioSystemRef, dispatch]));

        // 게임 시작
        useActionHandler('startGame', useCallback(async () => {
          try {
            const engine = gameEngineRef.current;
            const audio = audioSystemRef.current;

            if (!engine || !audio) {
              throw new Error('Systems not initialized');
            }

            await engine.start();
            await audio.play('background.mp3');
            setGameState('running');
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to start game');
            setGameState('error');
            dispatch('handleGameError', { error: error as Error, context: 'start' });
          }
        }, [gameEngineRef, audioSystemRef, dispatch]));

        // 게임 정지
        useActionHandler('stopGame', useCallback(async () => {
          try {
            const engine = gameEngineRef.current;
            const audio = audioSystemRef.current;

            if (engine?.isRunning) {
              await engine.stop();
            }
            if (audio?.isPlaying) {
              await audio.stop();
            }
            setGameState('stopped');
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to stop game');
            dispatch('handleGameError', { error: error as Error, context: 'stop' });
          }
        }, [gameEngineRef, audioSystemRef, dispatch]));

        // 볼륨 조절
        useActionHandler('updateVolume', useCallback(async (payload) => {
          const audio = audioSystemRef.current;
          if (audio) {
            audio.volume = payload.volume;
          }
        }, [audioSystemRef]));

        // 사운드 재생
        useActionHandler('playSound', useCallback(async (payload) => {
          const audio = audioSystemRef.current;
          if (audio) {
            await audio.play(payload.sound);
          }
        }, [audioSystemRef]));

        // 에러 처리
        useActionHandler('handleGameError', useCallback(async (payload) => {
          console.error(`Game error in ${payload.context}:`, payload.error);
          setError(`${payload.context}: ${payload.error.message}`);
        }, []));

        // 정리
        useActionHandler('cleanup', useCallback(async () => {
          if (gameEngineRef.current?.isRunning) {
            await gameEngineRef.current.stop();
          }
          if (audioSystemRef.current?.isPlaying) {
            await audioSystemRef.current.stop();
          }
        }, [gameEngineRef, audioSystemRef]));

        // 컴포넌트 마운트 시 초기화
        useEffect(() => {
          dispatch?.('initializeGame');
          return () => {
            dispatch?.('cleanup');
          };
        }, [dispatch]);

        return (
          <div data-testid="game-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              data-testid="game-canvas"
            />
            
            <div data-testid="game-state">{gameState}</div>
            {error && <div data-testid="game-error">{error}</div>}
            
            <button
              onClick={() => dispatch?.('startGame')}
              disabled={gameState !== 'ready'}
              data-testid="start-button"
            >
              Start Game
            </button>
            
            <button
              onClick={() => dispatch?.('stopGame')}
              disabled={gameState !== 'running'}
              data-testid="stop-button"
            >
              Stop Game
            </button>
            
            <button
              onClick={() => dispatch?.('playSound', { sound: 'effect.mp3' })}
              data-testid="play-sound-button"
            >
              Play Sound
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              defaultValue="0.5"
              onChange={(e) => dispatch?.('updateVolume', { volume: parseFloat(e.target.value) }))
              data-testid="volume-slider"
            />
          </div>
        );
      }

      render(
        <Provider>
          <GameComponent />
        </Provider>
      );

      // 초기 로딩 상태 확인
      expect(screen.getByTestId('game-state')).toHaveTextContent('loading');

      // 초기화 완료 대기
      await waitFor(() => {
        expect(screen.getByTestId('game-state')).toHaveTextContent('ready');
      }, { timeout: 1000 });

      // 게임 시작
      fireEvent.click(screen.getByTestId('start-button'));

      await waitFor(() => {
        expect(screen.getByTestId('game-state')).toHaveTextContent('running');
      });

      // 시스템 메서드 호출 확인
      expect(mockGameEngine.start).toHaveBeenCalled();
      expect(mockAudioSystem.play).toHaveBeenCalledWith('background.mp3');

      // 사운드 재생
      fireEvent.click(screen.getByTestId('play-sound-button'));

      await waitFor(() => {
        expect(mockAudioSystem.play).toHaveBeenCalledWith('effect.mp3');
      });

      // 볼륨 조절
      fireEvent.change(screen.getByTestId('volume-slider'), { target: { value: '0.8' } });

      await waitFor(() => {
        expect(mockAudioSystem.volume).toBe(0.8);
      });

      // 게임 정지
      fireEvent.click(screen.getByTestId('stop-button'));

      await waitFor(() => {
        expect(screen.getByTestId('game-state')).toHaveTextContent('stopped');
      });

      expect(mockGameEngine.stop).toHaveBeenCalled();
      expect(mockAudioSystem.stop).toHaveBeenCalled();
    });
  });

  describe('Complex Form Scenario', () => {
    test('should handle multi-step form with validation', async () => {
      const { Provider, useRef, useAction, useActionHandler } = createDeclarativeRefPattern(
        'FormSystem',
        {
          refs: {
            nameInput: {
              name: 'nameInput',
              objectType: 'dom'
            } as RefInitConfig<HTMLInputElement>,
            
            emailInput: {
              name: 'emailInput',
              objectType: 'dom'
            } as RefInitConfig<HTMLInputElement>,
            
            submitButton: {
              name: 'submitButton',
              objectType: 'dom'
            } as RefInitConfig<HTMLButtonElement>
          },
          actions: {
            validateField: { field: 'string', value: 'string' },
            submitForm: void 0,
            resetForm: void 0
          }
        }
      );

      function FormComponent() {
        const nameRef = useRef('nameInput');
        const emailRef = useRef('emailInput');
        const submitRef = useRef('submitButton');
        const dispatch = useAction();
        
        const [errors, setErrors] = useState<Record<string, string>>({});
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitted, setSubmitted] = useState(false);

        useActionHandler('validateField', useCallback(async ({ field, value }) => {
          const newErrors = { ...errors };
          
          if (field === 'name' && value.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
          } else if (field === 'name') {
            delete newErrors.name;
          }
          
          if (field === 'email' && !value.includes('@')) {
            newErrors.email = 'Invalid email format';
          } else if (field === 'email') {
            delete newErrors.email;
          }
          
          setErrors(newErrors);
        }, [errors]));

        useActionHandler('submitForm', useCallback(async () => {
          setIsSubmitting(true);
          
          const name = nameRef.current?.value || '';
          const email = emailRef.current?.value || '';
          
          // Validate all fields
          await dispatch?.('validateField', { field: 'name', value: name });
          await dispatch?.('validateField', { field: 'email', value: email });
          
          if (Object.keys(errors).length === 0 && name && email) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            setSubmitted(true);
          }
          
          setIsSubmitting(false);
        }, [nameRef, emailRef, dispatch, errors]));

        useActionHandler('resetForm', useCallback(async () => {
          if (nameRef.current) nameRef.current.value = '';
          if (emailRef.current) emailRef.current.value = '';
          setErrors({});
          setSubmitted(false);
          setIsSubmitting(false);
        }, [nameRef, emailRef]));

        if (submitted) {
          return (
            <div data-testid="success-message">
              Form submitted successfully!
              <button onClick={() => dispatch?.('resetForm')} data-testid="reset-button">
                Reset
              </button>
            </div>
          );
        }

        return (
          <form onSubmit={(e) => { e.preventDefault(); dispatch?.('submitForm'); }}>
            <div>
              <input
                ref={nameRef}
                type="text"
                placeholder="Name"
                onBlur={(e) => dispatch?.('validateField', { field: 'name', value: e.target.value })}
                data-testid="name-input"
              />
              {errors.name && <div data-testid="name-error">{errors.name}</div>}
            </div>
            
            <div>
              <input
                ref={emailRef}
                type="email"
                placeholder="Email"
                onBlur={(e) => dispatch?.('validateField', { field: 'email', value: e.target.value }))
                data-testid="email-input"
              />
              {errors.email && <div data-testid="email-error">{errors.email}</div>}
            </div>
            
            <button
              ref={submitRef}
              type="submit"
              disabled={isSubmitting}
              data-testid="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        );
      }

      render(
        <Provider>
          <FormComponent />
        </Provider>
      );

      // 잘못된 입력으로 검증 테스트
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('Name must be at least 2 characters');
      });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
      });

      // 올바른 입력으로 수정
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
      });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });

      // 폼 제출
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('submit-button')).toHaveTextContent('Submitting...');

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      }, { timeout: 2000 });

      // 리셋
      fireEvent.click(screen.getByTestId('reset-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle many refs efficiently', async () => {
      const refConfig: Record<string, RefInitConfig<HTMLDivElement>> = {};
      
      // 100개의 ref 생성
      for (let i = 0; i < 100; i++) {
        refConfig[`ref${i}`] = {
          name: `ref${i}`,
          objectType: 'dom'
        } as RefInitConfig<HTMLDivElement>;
      }

      const { Provider, useRef } = createDeclarativeRefPattern('ManyRefs', refConfig);

      function ManyRefsComponent() {
        const refs = Array.from({ length: 100 }, (_, i) => useRef(`ref${i}`));

        return (
          <div data-testid="many-refs-container">
            {refs.map((ref, index) => (
              <div
                key={index}
                ref={ref}
                data-testid={`ref-${index}`}
              >
                Ref {index}
              </div>
            ))}
          </div>
        );
      }

      const startTime = performance.now();
      
      render(
        <Provider>
          <ManyRefsComponent />
        </Provider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('many-refs-container')).toBeInTheDocument();
      expect(screen.getByTestId('ref-0')).toBeInTheDocument();
      expect(screen.getByTestId('ref-99')).toBeInTheDocument();

      // 렌더링 시간이 합리적인 범위 내여야 함 (1초 미만)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});