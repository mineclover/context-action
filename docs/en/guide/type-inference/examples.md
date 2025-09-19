# Practical Examples

Real-world examples demonstrating type inference in Context-Action applications.

## 🛒 E-commerce Application

### Complete E-commerce Type Setup

```typescript
import { createStoreContext, createActionContext } from '@context-action/react';
import { TypeUtils } from '@context-action/core';

// ✅ Domain types with branded IDs
type ProductId = TypeUtils.Brand<string, 'ProductId'>;
type UserId = TypeUtils.Brand<string, 'UserId'>;
type OrderId = TypeUtils.Brand<string, 'OrderId'>;

interface Product {
  id: ProductId;
  name: string;
  price: number;
  category: 'electronics' | 'clothing' | 'books';
  inStock: boolean;
}

interface User {
  id: UserId;
  name: string;
  email: string;
  address: Address;
}

interface CartItem {
  productId: ProductId;
  quantity: number;
  addedAt: Date;
}

interface Order {
  id: OrderId;
  userId: UserId;
  items: CartItem[];
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  total: number;
  createdAt: Date;
}

// ✅ Store definitions with automatic type inference
const {
  Provider: EcommerceStoreProvider,
  useStore: useEcommerceStore
} = createStoreContext('Ecommerce', {
  // Product catalog
  products: [] as Product[],
  selectedProduct: null as Product | null,

  // User state
  currentUser: null as User | null,
  isAuthenticated: false,

  // Shopping cart
  cart: [] as CartItem[],
  cartTotal: 0,

  // Orders
  orders: [] as Order[],
  currentOrder: null as Order | null,

  // UI state
  isLoading: false,
  searchQuery: '',
  filters: {
    category: 'all' as const,
    priceRange: [0, 1000] as const,
    inStockOnly: false
  }
});

// ✅ Action definitions with typed payloads
interface EcommerceActions {
  // Product actions
  loadProducts: { category?: Product['category'] };
  searchProducts: { query: string };
  selectProduct: { productId: ProductId };

  // Cart actions
  addToCart: { productId: ProductId; quantity: number };
  removeFromCart: { productId: ProductId };
  updateCartQuantity: { productId: ProductId; quantity: number };
  clearCart: void;

  // Order actions
  createOrder: { items: CartItem[] };
  updateOrderStatus: { orderId: OrderId; status: Order['status'] };

  // User actions
  login: { email: string; password: string };
  logout: void;
  updateProfile: { name: string; address: Address };
}

const {
  Provider: EcommerceActionProvider,
  useActionDispatch: useEcommerceAction,
  useActionHandler: useEcommerceActionHandler
} = createActionContext<EcommerceActions>('EcommerceActions');
```

### Business Logic Implementation

```typescript
function EcommerceLogic({ children }: { children: React.ReactNode }) {
  const productsStore = useEcommerceStore('products');
  const cartStore = useEcommerceStore('cart');
  const cartTotalStore = useEcommerceStore('cartTotal');
  const currentUserStore = useEcommerceStore('currentUser');
  const ordersStore = useEcommerceStore('orders');

  // ✅ Product management handlers
  useEcommerceActionHandler('loadProducts', useCallback(async (payload) => {
    const products = await api.fetchProducts(payload.category);
    productsStore.setValue(products);
  }, [productsStore]));

  useEcommerceActionHandler('searchProducts', useCallback(async (payload) => {
    const results = await api.searchProducts(payload.query);
    productsStore.setValue(results);
  }, [productsStore]));

  // ✅ Cart management with automatic total calculation
  useEcommerceActionHandler('addToCart', useCallback(async (payload) => {
    const currentCart = cartStore.getValue();
    const existingItem = currentCart.find(item => item.productId === payload.productId);

    let updatedCart: CartItem[];
    if (existingItem) {
      updatedCart = currentCart.map(item =>
        item.productId === payload.productId
          ? { ...item, quantity: item.quantity + payload.quantity }
          : item
      );
    } else {
      updatedCart = [...currentCart, {
        productId: payload.productId,
        quantity: payload.quantity,
        addedAt: new Date()
      }];
    }

    cartStore.setValue(updatedCart);

    // Recalculate total
    const products = productsStore.getValue();
    const total = updatedCart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    cartTotalStore.setValue(total);
  }, [cartStore, cartTotalStore, productsStore]));

  useEcommerceActionHandler('removeFromCart', useCallback(async (payload) => {
    const currentCart = cartStore.getValue();
    const updatedCart = currentCart.filter(item => item.productId !== payload.productId);
    cartStore.setValue(updatedCart);

    // Recalculate total
    const products = productsStore.getValue();
    const total = updatedCart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    cartTotalStore.setValue(total);
  }, [cartStore, cartTotalStore, productsStore]));

  // ✅ Order processing
  useEcommerceActionHandler('createOrder', useCallback(async (payload) => {
    const currentUser = currentUserStore.getValue();
    if (!currentUser) {
      throw new Error('User must be logged in to create order');
    }

    const products = productsStore.getValue();
    const total = payload.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const order: Order = {
      id: generateOrderId(),
      userId: currentUser.id,
      items: payload.items,
      status: 'pending',
      total,
      createdAt: new Date()
    };

    const newOrder = await api.createOrder(order);
    const currentOrders = ordersStore.getValue();
    ordersStore.setValue([...currentOrders, newOrder]);

    // Clear cart after successful order
    cartStore.setValue([]);
    cartTotalStore.setValue(0);

    return { success: true, orderId: newOrder.id };
  }, [currentUserStore, productsStore, ordersStore, cartStore, cartTotalStore]));

  return <>{children}</>;
}
```

### UI Components with Type Safety

```typescript
// ✅ Product listing component
function ProductList() {
  const dispatch = useEcommerceAction();
  const productsStore = useEcommerceStore('products');
  const products = useStoreValue(productsStore);

  const handleAddToCart = (productId: ProductId) => {
    dispatch('addToCart', { productId, quantity: 1 });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => handleAddToCart(product.id)}
        />
      ))}
    </div>
  );
}

// ✅ Shopping cart component
function ShoppingCart() {
  const dispatch = useEcommerceAction();
  const cartStore = useEcommerceStore('cart');
  const cartTotalStore = useEcommerceStore('cartTotal');
  const cart = useStoreValue(cartStore);
  const total = useStoreValue(cartTotalStore);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const result = await dispatch('createOrder', { items: cart });
      if (result?.success) {
        // Handle successful checkout
        toast.success('Order placed successfully!');
      }
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  return (
    <div className="p-4">
      <h2>Shopping Cart</h2>
      {cart.map(item => (
        <CartItem
          key={item.productId}
          item={item}
          onRemove={() => dispatch('removeFromCart', { productId: item.productId })}
          onUpdateQuantity={(quantity) =>
            dispatch('updateCartQuantity', { productId: item.productId, quantity })
          }
        />
      ))}
      <div className="total">
        Total: ${total.toFixed(2)}
      </div>
      <button onClick={handleCheckout} disabled={cart.length === 0}>
        Checkout
      </button>
    </div>
  );
}
```

## 📝 Task Management Application

### Task Management Types

```typescript
type TaskId = TypeUtils.Brand<string, 'TaskId'>;
type ProjectId = TypeUtils.Brand<string, 'ProjectId'>;

interface Task {
  id: TaskId;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: ProjectId;
  assigneeId?: UserId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: ProjectId;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

// ✅ Task management stores
const {
  Provider: TaskStoreProvider,
  useStore: useTaskStore
} = createStoreContext('TaskManager', {
  // Data
  tasks: [] as Task[],
  projects: [] as Project[],

  // Current selections
  selectedTask: null as Task | null,
  selectedProject: null as Project | null,

  // Filters and views
  filters: {
    status: 'all' as const,
    priority: 'all' as const,
    assignee: 'all' as const,
    project: 'all' as const
  },
  viewMode: 'list' as const,
  sortBy: 'dueDate' as const,
  sortOrder: 'asc' as const
});

// ✅ Task actions
interface TaskActions {
  // Task CRUD
  createTask: {
    title: string;
    description: string;
    projectId: ProjectId;
    priority: Task['priority'];
    dueDate?: Date;
  };
  updateTask: { taskId: TaskId; updates: Partial<Omit<Task, 'id' | 'createdAt'>> };
  deleteTask: { taskId: TaskId };

  // Task status management
  moveTask: { taskId: TaskId; newStatus: Task['status'] };
  assignTask: { taskId: TaskId; assigneeId: UserId };

  // Project management
  createProject: { name: string; description: string; color: string };
  updateProject: { projectId: ProjectId; updates: Partial<Omit<Project, 'id' | 'createdAt'>> };
  deleteProject: { projectId: ProjectId };

  // Filters and views
  setFilter: { filterType: keyof TaskFilters; value: string };
  setViewMode: { mode: 'list' | 'board' | 'calendar' };
  setSorting: { sortBy: string; order: 'asc' | 'desc' };
}
```

### Advanced Task Logic

```typescript
function TaskLogic({ children }: { children: React.ReactNode }) {
  const tasksStore = useTaskStore('tasks');
  const projectsStore = useTaskStore('projects');
  const selectedTaskStore = useTaskStore('selectedTask');

  // ✅ Create task with validation
  useTaskActionHandler('createTask', useCallback(async (payload, controller) => {
    // Validation
    if (!payload.title.trim()) {
      controller.abort('Task title is required');
      return;
    }

    const projects = projectsStore.getValue();
    const projectExists = projects.some(p => p.id === payload.projectId);
    if (!projectExists) {
      controller.abort('Invalid project ID');
      return;
    }

    // Create task
    const newTask: Task = {
      id: generateTaskId(),
      title: payload.title.trim(),
      description: payload.description.trim(),
      status: 'todo',
      priority: payload.priority,
      projectId: payload.projectId,
      dueDate: payload.dueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentTasks = tasksStore.getValue();
    tasksStore.setValue([...currentTasks, newTask]);

    return { success: true, taskId: newTask.id };
  }, [tasksStore, projectsStore]));

  // ✅ Update task with optimistic updates
  useTaskActionHandler('updateTask', useCallback(async (payload) => {
    const currentTasks = tasksStore.getValue();
    const taskIndex = currentTasks.findIndex(t => t.id === payload.taskId);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    // Optimistic update
    const updatedTask = {
      ...currentTasks[taskIndex],
      ...payload.updates,
      updatedAt: new Date()
    };

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;
    tasksStore.setValue(updatedTasks);

    try {
      // Sync with backend
      await api.updateTask(payload.taskId, payload.updates);
    } catch (error) {
      // Revert on error
      tasksStore.setValue(currentTasks);
      throw error;
    }
  }, [tasksStore]));

  // ✅ Move task between columns (drag & drop)
  useTaskActionHandler('moveTask', useCallback(async (payload) => {
    const currentTasks = tasksStore.getValue();
    const updatedTasks = currentTasks.map(task =>
      task.id === payload.taskId
        ? { ...task, status: payload.newStatus, updatedAt: new Date() }
        : task
    );

    tasksStore.setValue(updatedTasks);

    // Sync with backend
    await api.updateTaskStatus(payload.taskId, payload.newStatus);
  }, [tasksStore]));

  return <>{children}</>;
}
```

## 🎵 Music Player Application

### Music Player Types

```typescript
type TrackId = TypeUtils.Brand<string, 'TrackId'>;
type PlaylistId = TypeUtils.Brand<string, 'PlaylistId'>;
type AlbumId = TypeUtils.Brand<string, 'AlbumId'>;

interface Track {
  id: TrackId;
  title: string;
  artist: string;
  albumId: AlbumId;
  duration: number; // in seconds
  url: string;
  genre: string[];
}

interface Playlist {
  id: PlaylistId;
  name: string;
  description: string;
  trackIds: TrackId[];
  createdAt: Date;
  isPublic: boolean;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffleEnabled: boolean;
}

// ✅ Music player stores
const {
  Provider: MusicStoreProvider,
  useStore: useMusicStore
} = createStoreContext('MusicPlayer', {
  // Music library
  tracks: [] as Track[],
  playlists: [] as Playlist[],
  albums: [] as Album[],

  // Player state
  player: {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    isMuted: false,
    repeatMode: 'none',
    shuffleEnabled: false
  } as PlayerState,

  // Current context
  currentPlaylist: null as Playlist | null,
  queue: [] as Track[],
  queueIndex: 0,

  // UI state
  searchResults: [] as Track[],
  selectedGenres: [] as string[],
  viewMode: 'library' as const
});

// ✅ Music player actions
interface MusicActions {
  // Playback control
  play: { track?: Track };
  pause: void;
  stop: void;
  seek: { time: number };
  setVolume: { volume: number };
  toggleMute: void;

  // Queue management
  addToQueue: { tracks: Track[] };
  removeFromQueue: { index: number };
  clearQueue: void;
  playNext: void;
  playPrevious: void;

  // Playlist management
  createPlaylist: { name: string; description: string };
  addToPlaylist: { playlistId: PlaylistId; trackIds: TrackId[] };
  removeFromPlaylist: { playlistId: PlaylistId; trackId: TrackId };

  // Library actions
  importTracks: { files: File[] };
  searchTracks: { query: string };
  setGenreFilter: { genres: string[] };
}
```

### Music Player Implementation

```typescript
function MusicLogic({ children }: { children: React.ReactNode }) {
  const playerStore = useMusicStore('player');
  const queueStore = useMusicStore('queue');
  const queueIndexStore = useMusicStore('queueIndex');
  const tracksStore = useMusicStore('tracks');

  // ✅ Audio element ref for actual playback
  const audioRef = useRef<HTMLAudioElement>(null);

  // ✅ Play track with queue management
  useMusicActionHandler('play', useCallback(async (payload) => {
    const currentPlayer = playerStore.getValue();
    const queue = queueStore.getValue();

    let trackToPlay: Track;
    let newQueueIndex: number;

    if (payload.track) {
      // Play specific track
      trackToPlay = payload.track;
      const queueIndex = queue.findIndex(t => t.id === payload.track!.id);

      if (queueIndex >= 0) {
        newQueueIndex = queueIndex;
      } else {
        // Add to queue if not present
        queueStore.setValue([...queue, payload.track]);
        newQueueIndex = queue.length;
      }
    } else {
      // Resume current track or play first in queue
      if (currentPlayer.currentTrack) {
        trackToPlay = currentPlayer.currentTrack;
        newQueueIndex = queueIndexStore.getValue();
      } else if (queue.length > 0) {
        trackToPlay = queue[0];
        newQueueIndex = 0;
      } else {
        return; // Nothing to play
      }
    }

    // Update player state
    playerStore.update(player => ({
      ...player,
      currentTrack: trackToPlay,
      isPlaying: true
    }));

    queueIndexStore.setValue(newQueueIndex);

    // Control audio element
    if (audioRef.current) {
      audioRef.current.src = trackToPlay.url;
      audioRef.current.currentTime = currentPlayer.currentTime;
      await audioRef.current.play();
    }
  }, [playerStore, queueStore, queueIndexStore]));

  // ✅ Auto-play next track when current ends
  const handleTrackEnded = useCallback(() => {
    const player = playerStore.getValue();
    const queue = queueStore.getValue();
    const currentIndex = queueIndexStore.getValue();

    if (player.repeatMode === 'one') {
      // Repeat current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (player.repeatMode === 'all' || currentIndex < queue.length - 1) {
      // Play next track
      const nextIndex = player.repeatMode === 'all' && currentIndex === queue.length - 1
        ? 0
        : currentIndex + 1;

      const nextTrack = queue[nextIndex];
      if (nextTrack) {
        // Dispatch play action for next track
        dispatch('play', { track: nextTrack });
      }
    } else {
      // End of queue
      playerStore.update(p => ({ ...p, isPlaying: false }));
    }
  }, [playerStore, queueStore, queueIndexStore]);

  // ✅ Time update handler
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      playerStore.update(player => ({
        ...player,
        currentTime: audioRef.current!.currentTime
      }));
    }
  }, [playerStore]);

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={handleTrackEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          // Set initial volume
          if (audioRef.current) {
            const player = playerStore.getValue();
            audioRef.current.volume = player.isMuted ? 0 : player.volume;
          }
        }}
      />
      {children}
    </>
  );
}
```

## 🎯 Key Takeaways

### Type Inference Best Practices Demonstrated

1. **Branded Types**: Used for domain-specific IDs to prevent mixing different entity types
2. **Automatic Store Inference**: Let TypeScript infer types from initial values
3. **Const Assertions**: Preserve literal types for better type safety
4. **Comprehensive Action Interfaces**: Clear payload types for all user interactions
5. **Error Handling**: Proper error management with controller.abort()
6. **Optimistic Updates**: UI responsiveness with rollback on errors
7. **Business Logic Separation**: Clean separation between UI and business logic

### Common Patterns

- **CRUD Operations**: Create, Read, Update, Delete with type safety
- **State Synchronization**: Multiple stores working together
- **Async Operations**: API calls with loading states
- **Form Handling**: Type-safe form submissions
- **Real-time Updates**: WebSocket integration with store updates

### Architecture Benefits

- **Type Safety**: Compile-time error checking across the entire application
- **Maintainability**: Clear separation of concerns and predictable data flow
- **Scalability**: Easy to add new features without breaking existing code
- **Developer Experience**: Excellent IntelliSense and refactoring support

## 🔗 Related Sections

- [Store Type Inference](./stores.md) - Store typing fundamentals
- [Action Type Inference](./actions.md) - Action payload typing
- [Advanced Type Features](./advanced.md) - Branded types and utilities
- [Best Practices](./best-practices.md) - Type safety recommendations

---

**Previous**: [IDE Setup and Tips](./ide-setup.md) | **Up**: [Type Inference Guide](../type-inference.md)