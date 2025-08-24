import {
  createActionContext,
  ActionPayloadMap,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Section,
  Label,
  Input,
} from '../../components/ui';

// Basic Action Mapping with strong typing
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  resetUser: void;  // Actions without payload
  fetchUsers: { page: number; limit: number };
  toggleTheme: { theme: 'light' | 'dark' };
  validateAndSave: { id: string; data: any; skipValidation?: boolean };
}

// Complex nested types
interface UserProfile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: 'en' | 'es' | 'fr';
  };
  metadata: {
    createdAt: Date;
    lastLoginAt?: Date;
    loginCount: number;
  };
}

interface ComplexActions extends ActionPayloadMap {
  updateProfile: { 
    userId: string; 
    profile: Partial<UserProfile>; 
    options?: { notify: boolean; validate: boolean } 
  };
  batchUpdate: { 
    users: Array<{ id: string; updates: Partial<UserProfile> }>;
    strategy: 'sequential' | 'parallel';
  };
  queryUsers: {
    filters: {
      active?: boolean;
      theme?: UserProfile['preferences']['theme'];
      createdAfter?: Date;
    };
    pagination: { page: number; size: number };
    sort?: { field: keyof UserProfile; direction: 'asc' | 'desc' };
  };
}

// Generic action types
interface GenericActions<T extends Record<string, any>> extends ActionPayloadMap {
  create: { entity: T };
  update: { id: string; changes: Partial<T> };
  delete: { id: string };
  list: { filters?: Partial<T>; page?: number };
}

// Specialized user actions using generics
type UserActions = GenericActions<UserProfile>;

// Create contexts with strong typing
const {
  Provider: AppActionProvider,
  useActionDispatch: useAppAction,
  useActionHandler: useAppActionHandler
} = createActionContext<AppActions>('App');

const {
  Provider: ComplexActionProvider,
  useActionDispatch: useComplexAction,
  useActionHandler: useComplexActionHandler
} = createActionContext<ComplexActions>('Complex');

const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('User');

// Basic Type Safety Demo
function BasicTypeSafetyDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useAppAction();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Type-safe handler registration with automatic payload typing
  const updateUserHandler = useCallback(async (
    payload: { id: string; name: string; email: string }, // Automatically inferred from AppActions
    controller
  ) => {
    logger.info('👤 Update user handler', payload);
    
    setUsers(prev => prev.map(user => 
      user.id === payload.id ? { ...user, ...payload } : user
    ));
    
    // Pipeline controller methods are type-safe
    const currentPayload = controller.getPayload();
    logger.info('📋 Current payload from controller', currentPayload);
    
    return { success: true, updatedUser: payload };
  }, [logger]);

  const deleteUserHandler = useCallback(async (
    payload: { id: string }, // Type automatically inferred
    controller
  ) => {
    logger.info('🗑️ Delete user handler', payload);
    
    setUsers(prev => prev.filter(user => user.id !== payload.id));
    return { success: true, deletedId: payload.id };
  }, [logger]);

  const resetUserHandler = useCallback(async (
    payload: void, // Typed as void for actions without payload
    controller
  ) => {
    logger.info('🔄 Reset user handler (no payload)');
    setUsers([]);
    return { success: true, message: 'All users reset' };
  }, [logger]);

  const toggleThemeHandler = useCallback((
    payload: { theme: 'light' | 'dark' } // Union types are preserved
  ) => {
    logger.info('🎨 Toggle theme handler', payload);
    setTheme(payload.theme);
  }, [logger]);

  const fetchUsersHandler = useCallback(async (
    payload: { page: number; limit: number }
  ) => {
    logger.info('📄 Fetch users handler', payload);
    // Simulate API call with pagination
    const start = (payload.page - 1) * payload.limit;
    const mockUsers = Array.from({ length: payload.limit }, (_, i) => ({
      id: `${start + i + 1}`,
      name: `User ${start + i + 1}`,
      email: `user${start + i + 1}@example.com`
    }));
    
    return { users: mockUsers, total: 100, page: payload.page };
  }, [logger]);
  
  // Register handlers with type safety
  useAppActionHandler('updateUser', updateUserHandler);
  useAppActionHandler('deleteUser', deleteUserHandler);
  useAppActionHandler('resetUser', resetUserHandler);
  useAppActionHandler('toggleTheme', toggleThemeHandler);
  useAppActionHandler('fetchUsers', fetchUsersHandler);
  
  const handleUpdateFirstUser = () => {
    // Dispatch is type-safe - payload must match interface
    dispatch('updateUser', {
      id: '1',
      name: 'John Updated',
      email: 'john.updated@example.com'
      // TypeScript will catch missing required fields or wrong types
    });
  };

  const handleDeleteUser = () => {
    dispatch('deleteUser', { id: '2' });
  };

  const handleResetUsers = () => {
    // Void actions don't require payload parameter
    dispatch('resetUser');
  };

  const handleToggleTheme = () => {
    // Union types provide autocomplete and validation
    dispatch('toggleTheme', { theme: theme === 'light' ? 'dark' : 'light' });
  };

  const handleFetchUsers = async () => {
    try {
      const result = await dispatch('fetchUsers', { page: 1, limit: 5 });
      logger.info('📊 Fetch users result', result);
    } catch (error) {
      logger.error('❌ Fetch users failed', error);
    }
  };
  
  return (
    <DemoCard title="Basic Type Safety">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Current Users</Label>
            <div className="text-sm space-y-1 max-h-24 overflow-y-auto">
              {users.length === 0 ? (
                <div className="text-gray-500">No users</div>
              ) : (
                users.map(user => (
                  <div key={user.id}>{user.name} ({user.email})</div>
                ))
              )}
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">Current Theme</Label>
            <div className="text-sm">
              <div className={theme === 'light' ? 'text-yellow-600' : 'text-blue-600'}>
                {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleUpdateFirstUser} variant="primary" size="sm">
            Update First User
          </Button>
          <Button onClick={handleDeleteUser} variant="secondary" size="sm">
            Delete User 2
          </Button>
          <Button onClick={handleResetUsers} variant="outline" size="sm">
            Reset All Users (void)
          </Button>
          <Button onClick={handleToggleTheme} variant="secondary" size="sm">
            Toggle Theme
          </Button>
          <Button onClick={handleFetchUsers} variant="outline" size="sm">
            Fetch Users (async)
          </Button>
        </div>

        <CodeExample>
{`// Type-safe action mapping
interface AppActions extends ActionPayloadMap {
  updateUser: { id: string; name: string; email: string };
  deleteUser: { id: string };
  resetUser: void;  // Actions without payload
  toggleTheme: { theme: 'light' | 'dark' }; // Union types
}

// Handlers have automatic type inference
const updateUserHandler = useCallback(async (
  payload, // Automatically typed as { id: string; name: string; email: string }
  controller
) => {
  // TypeScript knows payload structure
  console.log('Updating user:', payload.id, payload.name);
  
  // Controller methods are type-safe
  const currentPayload = controller.getPayload();
  return { success: true };
}, []);

// Type-safe dispatch
dispatch('updateUser', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
  // TypeScript catches missing fields or wrong types
});`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Complex Types Demo
function ComplexTypesDemo() {
  const logger = useActionLoggerWithToast();
  
  return (
    <ComplexActionProvider>
      <ComplexTypesContent />
    </ComplexActionProvider>
  );
  
  function ComplexTypesContent() {
    const dispatch = useComplexAction();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [queryResults, setQueryResults] = useState<any[]>([]);
    
    // Complex nested type handling
    const updateProfileHandler = useCallback(async (
      payload: {
        userId: string;
        profile: Partial<UserProfile>;
        options?: { notify: boolean; validate: boolean };
      }
    ) => {
      logger.info('👤 Update profile handler (complex nested types)', payload);
      
      // TypeScript provides full intellisense for nested properties
      const hasPersonalInfo = payload.profile.personalInfo !== undefined;
      const hasPreferences = payload.profile.preferences !== undefined;
      
      logger.info('📊 Profile update analysis', {
        userId: payload.userId,
        hasPersonalInfo,
        hasPreferences,
        shouldNotify: payload.options?.notify ?? true,
        shouldValidate: payload.options?.validate ?? true
      });
      
      return { success: true, profileId: payload.userId };
    }, [logger]);

    const batchUpdateHandler = useCallback(async (
      payload: {
        users: Array<{ id: string; updates: Partial<UserProfile> }>;
        strategy: 'sequential' | 'parallel';
      }
    ) => {
      logger.info('🔄 Batch update handler', {
        userCount: payload.users.length,
        strategy: payload.strategy
      });
      
      // Process based on strategy
      if (payload.strategy === 'sequential') {
        for (const user of payload.users) {
          logger.info('⏳ Processing user sequentially', { id: user.id });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        logger.info('⚡ Processing users in parallel');
        await Promise.all(
          payload.users.map(async user => {
            await new Promise(resolve => setTimeout(resolve, 50));
          })
        );
      }
      
      return { processed: payload.users.length, strategy: payload.strategy };
    }, [logger]);

    const queryUsersHandler = useCallback(async (
      payload: {
        filters: {
          active?: boolean;
          theme?: UserProfile['preferences']['theme']; // Reference to nested type
          createdAfter?: Date;
        };
        pagination: { page: number; size: number };
        sort?: { field: keyof UserProfile; direction: 'asc' | 'desc' };
      }
    ) => {
      logger.info('🔍 Query users handler (complex filtering)', payload);
      
      // Generate mock results based on filters
      const mockResults = Array.from({ length: payload.pagination.size }, (_, i) => ({
        id: `query-${i + 1}`,
        matched: true,
        filters: payload.filters
      }));
      
      setQueryResults(mockResults);
      return { results: mockResults, total: 50 };
    }, []);
    
    useComplexActionHandler('updateProfile', updateProfileHandler);
    useComplexActionHandler('batchUpdate', batchUpdateHandler);
    useComplexActionHandler('queryUsers', queryUsersHandler);
    
    const handleComplexProfileUpdate = () => {
      // Complex nested object with optional properties
      dispatch('updateProfile', {
        userId: 'user-123',
        profile: {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
          },
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          }
          // metadata is optional and not included
        },
        options: {
          notify: true,
          validate: true
        }
      });
    };

    const handleBatchUpdate = () => {
      dispatch('batchUpdate', {
        users: [
          { id: 'user1', updates: { personalInfo: { firstName: 'Updated1' } } },
          { id: 'user2', updates: { preferences: { theme: 'light' } } }
        ],
        strategy: 'parallel'
      });
    };

    const handleComplexQuery = () => {
      dispatch('queryUsers', {
        filters: {
          active: true,
          theme: 'dark',
          createdAfter: new Date('2024-01-01')
        },
        pagination: { page: 1, size: 10 },
        sort: { field: 'personalInfo', direction: 'asc' }
      });
    };
    
    return (
      <DemoCard title="Complex Type Handling">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Label className="font-semibold">Complex Operations</Label>
              <div className="text-sm space-y-1">
                <div>Nested Objects: ✅ Full IntelliSense</div>
                <div>Optional Properties: ✅ Type Safety</div>
                <div>Union Types: ✅ Autocomplete</div>
                <div>Generic Types: ✅ Reusable</div>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Label className="font-semibold">Query Results</Label>
              <div className="text-sm">
                Results: {queryResults.length}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleComplexProfileUpdate} variant="primary" size="sm">
              Complex Profile Update
            </Button>
            <Button onClick={handleBatchUpdate} variant="secondary" size="sm">
              Batch Update
            </Button>
            <Button onClick={handleComplexQuery} variant="outline" size="sm">
              Complex Query
            </Button>
          </div>

          <CodeExample>
{`// Complex nested types with full type safety
interface UserProfile {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: 'en' | 'es' | 'fr';
  };
}

interface ComplexActions extends ActionPayloadMap {
  updateProfile: {
    userId: string;
    profile: Partial<UserProfile>; // Partial for optional updates
    options?: { notify: boolean; validate: boolean }; // Optional options
  };
  queryUsers: {
    filters: {
      theme?: UserProfile['preferences']['theme']; // Reference nested types
    };
    sort?: { field: keyof UserProfile; direction: 'asc' | 'desc' };
  };
}

// Handler receives fully typed payload
const handler = useCallback(async (payload, controller) => {
  // TypeScript provides full intellisense for nested properties
  console.log(payload.profile.personalInfo?.firstName);
  console.log(payload.profile.preferences?.theme);
}, []);`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Generic Types Demo
function GenericTypesDemo() {
  const logger = useActionLoggerWithToast();
  
  return (
    <UserActionProvider>
      <GenericTypesContent />
    </UserActionProvider>
  );
  
  function GenericTypesContent() {
    const dispatch = useUserAction();
    const [entities, setEntities] = useState<UserProfile[]>([]);
    
    // Generic action handlers - work with any entity type
    const createHandler = useCallback(async (
      payload: { entity: UserProfile } // Generic type resolved to UserProfile
    ) => {
      logger.info('🆕 Create handler (generic)', { entityId: payload.entity.id });
      setEntities(prev => [...prev, payload.entity]);
      return { success: true, id: payload.entity.id };
    }, [logger]);

    const updateHandler = useCallback(async (
      payload: { id: string; changes: Partial<UserProfile> }
    ) => {
      logger.info('✏️ Update handler (generic)', payload);
      setEntities(prev => prev.map(entity => 
        entity.id === payload.id 
          ? { ...entity, ...payload.changes }
          : entity
      ));
      return { success: true, updatedId: payload.id };
    }, [logger]);

    const deleteHandler = useCallback(async (
      payload: { id: string }
    ) => {
      logger.info('🗑️ Delete handler (generic)', payload);
      setEntities(prev => prev.filter(entity => entity.id !== payload.id));
      return { success: true, deletedId: payload.id };
    }, [logger]);

    const listHandler = useCallback(async (
      payload: { filters?: Partial<UserProfile>; page?: number }
    ) => {
      logger.info('📋 List handler (generic)', payload);
      // Apply filters if provided
      let filtered = entities;
      if (payload.filters) {
        // Type-safe filtering based on UserProfile properties
        filtered = entities.filter(entity => {
          return Object.entries(payload.filters!).every(([key, value]) => {
            return (entity as any)[key] === value;
          });
        });
      }
      return { entities: filtered, total: filtered.length };
    }, [entities, logger]);
    
    useUserActionHandler('create', createHandler);
    useUserActionHandler('update', updateHandler);
    useUserActionHandler('delete', deleteHandler);
    useUserActionHandler('list', listHandler);
    
    const handleCreateUser = () => {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        personalInfo: {
          firstName: 'Generic',
          lastName: 'User',
          email: 'generic@example.com'
        },
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        metadata: {
          createdAt: new Date(),
          loginCount: 0
        }
      };
      
      dispatch('create', { entity: newUser });
    };

    const handleUpdateUser = () => {
      if (entities.length > 0) {
        dispatch('update', {
          id: entities[0].id,
          changes: {
            preferences: {
              ...entities[0].preferences,
              theme: entities[0].preferences.theme === 'light' ? 'dark' : 'light'
            }
          }
        });
      }
    };

    const handleDeleteUser = () => {
      if (entities.length > 0) {
        dispatch('delete', { id: entities[entities.length - 1].id });
      }
    };

    const handleListUsers = async () => {
      try {
        const result = await dispatch('list', { 
          filters: { preferences: { theme: 'dark' } as any }, 
          page: 1 
        });
        logger.info('📊 List users result', result);
      } catch (error) {
        logger.error('❌ List users failed', error);
      }
    };
    
    return (
      <DemoCard title="Generic Type System">
        <div className="space-y-4">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Label className="font-semibold">Generic Entity Operations</Label>
            <div className="text-sm space-y-1">
              <div>Entities: {entities.length}</div>
              <div>Type: UserProfile (resolved from generic)</div>
              <div>CRUD Operations: Create, Update, Delete, List</div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreateUser} variant="primary" size="sm">
              Create User (Generic)
            </Button>
            <Button onClick={handleUpdateUser} variant="secondary" size="sm">
              Update First User
            </Button>
            <Button onClick={handleDeleteUser} variant="outline" size="sm">
              Delete Last User
            </Button>
            <Button onClick={handleListUsers} variant="secondary" size="sm">
              List Users (with filters)
            </Button>
          </div>

          <CodeExample>
{`// Generic action interface - reusable for any entity
interface GenericActions<T extends Record<string, any>> extends ActionPayloadMap {
  create: { entity: T };
  update: { id: string; changes: Partial<T> };
  delete: { id: string };
  list: { filters?: Partial<T>; page?: number };
}

// Specialized for specific entity type
type UserActions = GenericActions<UserProfile>;

// Create context with resolved generic types
const {
  Provider: UserActionProvider,
  useActionDispatch: useUserAction,
  useActionHandler: useUserActionHandler
} = createActionContext<UserActions>('User');

// Handlers receive fully typed payloads
const createHandler = useCallback(async (
  payload // Typed as { entity: UserProfile }
) => {
  console.log('Creating:', payload.entity.personalInfo.firstName);
}, []);`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Main Component
function ActionTypeSystemPage() {
  return (
    <PageWithLogMonitor>
      <AppActionProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Action Type System
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Complete guide to the Context-Action framework's type system for actions, including 
              ActionPayloadMap, type safety, and TypeScript integration.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Basic Type Safety">
              <BasicTypeSafetyDemo />
            </Section>

            <Section title="Complex Type Handling">
              <ComplexTypesDemo />
            </Section>

            <Section title="Generic Type System">
              <GenericTypesDemo />
            </Section>

            <Section title="TypeScript Benefits">
              <DemoCard title="Type System Features">
                <div className="space-y-4">
                  <div className="prose">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700">✅ Type Safety Features</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Automatic payload type inference in handlers</li>
                          <li>Compile-time validation of action dispatches</li>
                          <li>IntelliSense support for nested object properties</li>
                          <li>Union type support with autocomplete</li>
                          <li>Optional and partial type handling</li>
                          <li>Generic action patterns for reusability</li>
                          <li>Pipeline controller type safety</li>
                          <li>Result type inference for async actions</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700">🎯 Development Benefits</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Catch errors at compile time, not runtime</li>
                          <li>Refactoring safety across large codebases</li>
                          <li>Self-documenting code through types</li>
                          <li>Enhanced IDE support and autocomplete</li>
                          <li>Consistent API contracts across teams</li>
                          <li>Reduced need for manual type guards</li>
                          <li>Better collaboration through clear interfaces</li>
                          <li>Simplified testing with known type contracts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </AppActionProvider>
    </PageWithLogMonitor>
  );
}

export default ActionTypeSystemPage;