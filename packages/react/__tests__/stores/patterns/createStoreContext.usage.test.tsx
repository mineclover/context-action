import React, { useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { createStoreContext } from '../../../src/stores/patterns/declarative-store-pattern-v2';
import { useStoreValue } from '../../../src/stores/hooks/useStoreValue';

describe('createStoreContext usage examples', () => {
  describe('Basic store context patterns', () => {
    // @doc-extract: basic-store-context
    // @doc-category: getting-started
    // @doc-priority: high
    // @doc-description: 자동 타입 추론을 통한 스토어 컨텍스트 생성
    it('should create store context with automatic type inference', async () => {
      // Create store context with initial values
      const {
        Provider: AppStoreProvider,
        useStore: useAppStore
      } = createStoreContext('App', {
        user: { name: 'John', isLoggedIn: false },
        settings: { theme: 'light', language: 'en' },
        cart: { items: [], total: 0 }
      });

      // Test component that uses multiple stores
      function UserInfo() {
        const userStore = useAppStore('user');
        const user = useStoreValue(userStore);

        return (
          <div data-testid="user-info">
            {user.name} - {user.isLoggedIn ? 'Logged In' : 'Logged Out'}
          </div>
        );
      }

      function ThemeDisplay() {
        const settingsStore = useAppStore('settings');
        const settings = useStoreValue(settingsStore);

        return <div data-testid="theme">{settings.theme}</div>;
      }

      function CartSummary() {
        const cartStore = useAppStore('cart');
        const cart = useStoreValue(cartStore);

        return (
          <div data-testid="cart">
            Items: {cart.items.length}, Total: ${cart.total}
          </div>
        );
      }

      function App() {
        return (
          <AppStoreProvider>
            <UserInfo />
            <ThemeDisplay />
            <CartSummary />
          </AppStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      expect(getByTestId('user-info')).toHaveTextContent('John - Logged Out');
      expect(getByTestId('theme')).toHaveTextContent('light');
      expect(getByTestId('cart')).toHaveTextContent('Items: 0, Total: $0');
    });

    it('should support store updates with excellent type inference', async () => {
      const {
        Provider: GameStoreProvider,
        useStore: useGameStore
      } = createStoreContext('Game', {
        player: {
          name: 'Player1',
          level: 1,
          experience: 0,
          stats: { health: 100, mana: 50 }
        },
        game: {
          state: 'menu' as 'menu' | 'playing' | 'paused',
          score: 0
        }
      });

      function PlayerStats() {
        const playerStore = useGameStore('player');
        const player = useStoreValue(playerStore);

        const levelUp = () => {
          playerStore.update(current => ({
            ...current,
            level: current.level + 1,
            experience: 0,
            stats: {
              ...current.stats,
              health: 100,
              mana: current.stats.mana + 10
            }
          }));
        };

        return (
          <div>
            <span data-testid="level">Level: {player.level}</span>
            <span data-testid="health">Health: {player.stats.health}</span>
            <span data-testid="mana">Mana: {player.stats.mana}</span>
            <button onClick={levelUp} data-testid="level-up">Level Up</button>
          </div>
        );
      }

      function GameControls() {
        const gameStore = useGameStore('game');
        const game = useStoreValue(gameStore);

        const startGame = () => {
          gameStore.update(current => ({
            ...current,
            state: 'playing',
            score: 0
          }));
        };

        return (
          <div>
            <div data-testid="game-state">State: {game.state}</div>
            <div data-testid="score">Score: {game.score}</div>
            <button onClick={startGame} data-testid="start-game">
              Start Game
            </button>
          </div>
        );
      }

      function TestApp() {
        return (
          <GameStoreProvider>
            <PlayerStats />
            <GameControls />
          </GameStoreProvider>
        );
      }

      const { getByTestId } = render(<TestApp />);

      expect(getByTestId('level')).toHaveTextContent('Level: 1');
      expect(getByTestId('mana')).toHaveTextContent('Mana: 50');
      expect(getByTestId('game-state')).toHaveTextContent('State: menu');

      fireEvent.click(getByTestId('level-up'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('level')).toHaveTextContent('Level: 2');
      expect(getByTestId('mana')).toHaveTextContent('Mana: 60');

      fireEvent.click(getByTestId('start-game'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('game-state')).toHaveTextContent('State: playing');
    });
  });

  describe('Advanced patterns and configurations', () => {
    it('should handle complex nested data structures', async () => {
      interface UserProfile {
        personal: {
          name: string;
          avatar: string;
          bio: string;
        };
        preferences: {
          notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
          };
          privacy: {
            profileVisibility: 'public' | 'friends' | 'private';
            allowMessages: boolean;
          };
        };
        activity: {
          lastLogin: string;
          loginCount: number;
          achievements: string[];
        };
      }

      const {
        Provider: ProfileStoreProvider,
        useStore: useProfileStore
      } = createStoreContext('Profile', {
        user: {
          personal: {
            name: 'Alice',
            avatar: 'avatar.jpg',
            bio: 'Software developer'
          },
          preferences: {
            notifications: {
              email: true,
              push: false,
              sms: false
            },
            privacy: {
              profileVisibility: 'public' as const,
              allowMessages: true
            }
          },
          activity: {
            lastLogin: '2024-01-01',
            loginCount: 5,
            achievements: ['first_login', 'week_streak']
          }
        } as UserProfile
      });

      function ProfileSettings() {
        const userStore = useProfileStore('user');
        const user = useStoreValue(userStore);

        const toggleEmailNotifications = () => {
          userStore.update(current => ({
            ...current,
            preferences: {
              ...current.preferences,
              notifications: {
                ...current.preferences.notifications,
                email: !current.preferences.notifications.email
              }
            }
          }));
        };

        const changePrivacy = () => {
          userStore.update(current => ({
            ...current,
            preferences: {
              ...current.preferences,
              privacy: {
                ...current.preferences.privacy,
                profileVisibility: current.preferences.privacy.profileVisibility === 'public' ? 'private' : 'public'
              }
            }
          }));
        };

        const addAchievement = () => {
          userStore.update(current => ({
            ...current,
            activity: {
              ...current.activity,
              achievements: [...current.activity.achievements, 'new_achievement']
            }
          }));
        };

        return (
          <div>
            <div data-testid="name">{user.personal.name}</div>
            <div data-testid="email-notifications">
              Email: {user.preferences.notifications.email ? 'enabled' : 'disabled'}
            </div>
            <div data-testid="privacy">
              Privacy: {user.preferences.privacy.profileVisibility}
            </div>
            <div data-testid="achievements">
              Achievements: {user.activity.achievements.length}
            </div>

            <button onClick={toggleEmailNotifications} data-testid="toggle-email">
              Toggle Email
            </button>
            <button onClick={changePrivacy} data-testid="change-privacy">
              Change Privacy
            </button>
            <button onClick={addAchievement} data-testid="add-achievement">
              Add Achievement
            </button>
          </div>
        );
      }

      function App() {
        return (
          <ProfileStoreProvider>
            <ProfileSettings />
          </ProfileStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state
      expect(getByTestId('name')).toHaveTextContent('Alice');
      expect(getByTestId('email-notifications')).toHaveTextContent('Email: enabled');
      expect(getByTestId('privacy')).toHaveTextContent('Privacy: public');
      expect(getByTestId('achievements')).toHaveTextContent('Achievements: 2');

      // Test nested updates
      fireEvent.click(getByTestId('toggle-email'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('email-notifications')).toHaveTextContent('Email: disabled');

      fireEvent.click(getByTestId('change-privacy'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('privacy')).toHaveTextContent('Privacy: private');

      fireEvent.click(getByTestId('add-achievement'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('achievements')).toHaveTextContent('Achievements: 3');
    });

    it('should support configuration-based store initialization', async () => {
      const {
        Provider: ConfigStoreProvider,
        useStore: useConfigStore
      } = createStoreContext('Config', {
        theme: {
          initialValue: { mode: 'light', accent: 'blue' },
          compareStrategy: 'deep'
        },
        user: {
          initialValue: { id: 1, name: 'Test User' },
          compareStrategy: 'reference'
        },
        cache: {
          initialValue: new Map(),
          compareStrategy: 'reference'
        }
      });

      function ConfigDisplay() {
        const themeStore = useConfigStore('theme');
        const userStore = useConfigStore('user');
        const theme = useStoreValue(themeStore);
        const user = useStoreValue(userStore);

        const updateTheme = () => {
          themeStore.setValue({
            mode: theme.mode === 'light' ? 'dark' : 'light',
            accent: 'red'
          });
        };

        const updateUser = () => {
          userStore.setValue({
            id: user.id,
            name: 'Updated User'
          });
        };

        return (
          <div>
            <div data-testid="theme-mode">{theme.mode}</div>
            <div data-testid="theme-accent">{theme.accent}</div>
            <div data-testid="user-name">{user.name}</div>

            <button onClick={updateTheme} data-testid="update-theme">
              Update Theme
            </button>
            <button onClick={updateUser} data-testid="update-user">
              Update User
            </button>
          </div>
        );
      }

      function App() {
        return (
          <ConfigStoreProvider>
            <ConfigDisplay />
          </ConfigStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state
      expect(getByTestId('theme-mode')).toHaveTextContent('light');
      expect(getByTestId('theme-accent')).toHaveTextContent('blue');
      expect(getByTestId('user-name')).toHaveTextContent('Test User');

      // Test updates
      fireEvent.click(getByTestId('update-theme'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(getByTestId('theme-accent')).toHaveTextContent('red');

      fireEvent.click(getByTestId('update-user'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('user-name')).toHaveTextContent('Updated User');
    });
  });

  describe('Integration with React patterns', () => {
    it('should work seamlessly with React state and side effects', async () => {
      const {
        Provider: IntegrationStoreProvider,
        useStore: useIntegrationStore
      } = createStoreContext('Integration', {
        server: { data: 'initial', lastSync: 0 },
        ui: { isLoading: false, error: null }
      });

      function IntegratedComponent() {
        const serverStore = useIntegrationStore('server');
        const uiStore = useIntegrationStore('ui');
        const serverData = useStoreValue(serverStore);
        const uiState = useStoreValue(uiStore);
        const [localCounter, setLocalCounter] = useState(0);

        const syncData = async () => {
          uiStore.update(current => ({ ...current, isLoading: true }));

          // Simulate API call
          setTimeout(() => {
            serverStore.update(current => ({
              data: `synced-${Date.now()}`,
              lastSync: current.lastSync + 1
            }));
            uiStore.update(current => ({ ...current, isLoading: false }));
          }, 50);
        };

        return (
          <div>
            <div data-testid="server-data">
              Server: {serverData.data} (synced {serverData.lastSync} times)
            </div>
            <div data-testid="ui-loading">
              {uiState.isLoading ? 'Loading...' : 'Ready'}
            </div>
            <div data-testid="local-counter">
              Local: {localCounter}
            </div>

            <button
              data-testid="increment-local"
              onClick={() => setLocalCounter(c => c + 1)}
            >
              Increment Local
            </button>
            <button
              data-testid="sync-data"
              onClick={syncData}
              disabled={uiState.isLoading}
            >
              Sync Data
            </button>
          </div>
        );
      }

      function App() {
        return (
          <IntegrationStoreProvider>
            <IntegratedComponent />
          </IntegrationStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state
      expect(getByTestId('server-data')).toHaveTextContent('Server: initial (synced 0 times)');
      expect(getByTestId('ui-loading')).toHaveTextContent('Ready');
      expect(getByTestId('local-counter')).toHaveTextContent('Local: 0');

      // Test local state update
      fireEvent.click(getByTestId('increment-local'));
      expect(getByTestId('local-counter')).toHaveTextContent('Local: 1');

      // Test store sync
      fireEvent.click(getByTestId('sync-data'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('ui-loading')).toHaveTextContent('Loading...');

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(getByTestId('server-data')).toHaveTextContent('synced 1 times');
      expect(getByTestId('ui-loading')).toHaveTextContent('Ready');
    });
  });

  describe('Multiple context composition', () => {
    it('should support multiple independent store contexts', async () => {
      // Auth context
      const {
        Provider: AuthStoreProvider,
        useStore: useAuthStore
      } = createStoreContext('Auth', {
        user: { id: null as number | null, name: '', isAuthenticated: false },
        session: { token: '', expires: 0 }
      });

      // App context
      const {
        Provider: AppStoreProvider,
        useStore: useAppStore
      } = createStoreContext('App', {
        theme: { mode: 'light' as 'light' | 'dark', sidebar: 'collapsed' },
        notifications: { unread: 0, items: [] as string[] }
      });

      function AuthStatus() {
        const userStore = useAuthStore('user');
        const user = useStoreValue(userStore);

        const login = () => {
          userStore.setValue({
            id: 1,
            name: 'John Doe',
            isAuthenticated: true
          });
        };

        return (
          <div>
            <div data-testid="auth-status">
              {user.isAuthenticated ? `Logged in as ${user.name}` : 'Not logged in'}
            </div>
            <button onClick={login} data-testid="login">
              Login
            </button>
          </div>
        );
      }

      function AppSettings() {
        const themeStore = useAppStore('theme');
        const notificationsStore = useAppStore('notifications');
        const theme = useStoreValue(themeStore);
        const notifications = useStoreValue(notificationsStore);

        const toggleTheme = () => {
          themeStore.update(current => ({
            ...current,
            mode: current.mode === 'light' ? 'dark' : 'light'
          }));
        };

        const addNotification = () => {
          notificationsStore.update(current => ({
            unread: current.unread + 1,
            items: [...current.items, `Notification ${current.unread + 1}`]
          }));
        };

        return (
          <div>
            <div data-testid="theme-mode">Theme: {theme.mode}</div>
            <div data-testid="notifications">Notifications: {notifications.unread}</div>

            <button onClick={toggleTheme} data-testid="toggle-theme">
              Toggle Theme
            </button>
            <button onClick={addNotification} data-testid="add-notification">
              Add Notification
            </button>
          </div>
        );
      }

      function App() {
        return (
          <AuthStoreProvider>
            <AppStoreProvider>
              <AuthStatus />
              <AppSettings />
            </AppStoreProvider>
          </AuthStoreProvider>
        );
      }

      const { getByTestId } = render(<App />);

      // Initial state
      expect(getByTestId('auth-status')).toHaveTextContent('Not logged in');
      expect(getByTestId('theme-mode')).toHaveTextContent('Theme: light');
      expect(getByTestId('notifications')).toHaveTextContent('Notifications: 0');

      // Test auth context
      fireEvent.click(getByTestId('login'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('auth-status')).toHaveTextContent('Logged in as John Doe');

      // Test app context
      fireEvent.click(getByTestId('toggle-theme'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('theme-mode')).toHaveTextContent('Theme: dark');

      fireEvent.click(getByTestId('add-notification'));

      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(getByTestId('notifications')).toHaveTextContent('Notifications: 1');
    });
  });
});