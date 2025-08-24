import {
  createDeclarativeStorePattern,
  createStore,
  useComputedStore,
  useStoreValue,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Input,
  Section,
  Label,
} from '../../components/ui';

// Demo stores for computed patterns
const userStore = createStore('user', { firstName: 'John', lastName: 'Doe', score: 85 });
const cartStore = createStore('cart', {
  items: [
    { id: '1', name: 'Laptop', price: 999, quantity: 1 },
    { id: '2', name: 'Mouse', price: 29, quantity: 2 }
  ]
});
const discountStore = createStore('discount', { percentage: 10 });
const taxStore = createStore('tax', { rate: 8.5 });

// Basic Computed Value Demo
function BasicComputedDemo() {
  const logger = useActionLoggerWithToast();
  
  // Simple derived state
  const fullName = useComputedStore(
    [userStore],
    ([user]) => {
      logger.info('🧮 Computing full name', { firstName: user.firstName, lastName: user.lastName });
      return `${user.firstName} ${user.lastName}`;
    }
  );

  const userLevel = useComputedStore(
    [userStore],
    ([user]) => {
      logger.info('🧮 Computing user level', { score: user.score });
      return user.score >= 80 ? 'Expert' : user.score >= 60 ? 'Intermediate' : 'Beginner';
    }
  );

  const updateFirstName = () => {
    userStore.update(user => ({
      ...user,
      firstName: user.firstName === 'John' ? 'Jane' : 'John'
    }));
  };

  const updateScore = () => {
    userStore.update(user => ({
      ...user,
      score: Math.floor(Math.random() * 100)
    }));
  };

  return (
    <DemoCard title="Basic Computed Values">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Label className="font-semibold">Computed Full Name</Label>
            <div className="text-lg">{fullName}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <Label className="font-semibold">User Level</Label>
            <div className="text-lg">{userLevel}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={updateFirstName} variant="primary" size="sm">
            Toggle First Name
          </Button>
          <Button onClick={updateScore} variant="secondary" size="sm">
            Random Score
          </Button>
        </div>

        <CodeExample>
{`// Simple derived state
const fullName = useComputedStore(
  [userStore],
  ([user]) => \`\${user.firstName} \${user.lastName}\`
);

// Conditional computation
const userLevel = useComputedStore(
  [userStore],
  ([user]) => user.score >= 80 ? 'Expert' : 'Beginner'
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Multi-Store Computation Demo
function MultiStoreComputationDemo() {
  const logger = useActionLoggerWithToast();
  
  const orderSummary = useComputedStore(
    [cartStore, discountStore, taxStore],
    ([cart, discount, tax]) => {
      logger.info('🧮 Computing order summary', { 
        itemCount: cart.items.length, 
        discount: discount.percentage, 
        tax: tax.rate 
      });
      
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = subtotal * (discount.percentage / 100);
      const taxAmount = (subtotal - discountAmount) * (tax.rate / 100);
      
      return {
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: subtotal - discountAmount + taxAmount,
        itemCount: cart.items.length
      };
    }
  );

  const addItem = () => {
    cartStore.update(cart => ({
      ...cart,
      items: [...cart.items, {
        id: Date.now().toString(),
        name: 'New Item',
        price: Math.floor(Math.random() * 100) + 10,
        quantity: 1
      }]
    }));
  };

  const updateDiscount = () => {
    discountStore.update(discount => ({
      ...discount,
      percentage: discount.percentage === 10 ? 20 : 10
    }));
  };

  const updateTax = () => {
    taxStore.update(tax => ({
      ...tax,
      rate: tax.rate === 8.5 ? 5.0 : 8.5
    }));
  };

  return (
    <DemoCard title="Multi-Store Computations">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal ({orderSummary.itemCount} items)</span>
              <span>${orderSummary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${orderSummary.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${orderSummary.tax.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${orderSummary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={addItem} variant="primary" size="sm">
            Add Item
          </Button>
          <Button onClick={updateDiscount} variant="secondary" size="sm">
            Toggle Discount (10%/20%)
          </Button>
          <Button onClick={updateTax} variant="outline" size="sm">
            Toggle Tax (8.5%/5%)
          </Button>
        </div>

        <CodeExample>
{`const orderSummary = useComputedStore(
  [cartStore, discountStore, taxStore],
  ([cart, discount, tax]) => {
    const subtotal = cart.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const discountAmount = subtotal * (discount.percentage / 100);
    const taxAmount = (subtotal - discountAmount) * (tax.rate / 100);
    
    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: subtotal - discountAmount + taxAmount
    };
  }
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Performance Optimized Demo
function PerformanceOptimizedDemo() {
  const logger = useActionLoggerWithToast();
  
  // Memoized expensive computation
  const expensiveComputation = useComputedStore(
    [userStore, cartStore],
    useMemo(() => ([user, cart]) => {
      logger.info('🧮 Expensive computation running...', { user: user.firstName, itemCount: cart.items.length });
      
      // Simulate expensive computation
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += user.score * cart.items.length;
      }
      
      return {
        result: result / 100000,
        computedAt: new Date().toLocaleTimeString(),
        inputHash: `${user.firstName}-${user.score}-${cart.items.length}`
      };
    }, []),
    {
      comparison: 'shallow'
    }
  );

  // Conditional computation
  const conditionalData = useComputedStore(
    [userStore, cartStore],
    ([user, cart]) => {
      if (user.score < 50) {
        logger.info('🧮 User score too low, skipping computation');
        return { message: 'Score too low for premium features', canAccess: false };
      }
      
      if (cart.items.length === 0) {
        logger.info('🧮 Cart is empty, basic computation');
        return { message: 'Add items to cart', canAccess: true, recommendations: [] };
      }
      
      logger.info('🧮 Full computation for premium user with items');
      return {
        message: 'Premium features available',
        canAccess: true,
        recommendations: cart.items.map(item => `Similar to ${item.name}`),
        loyaltyPoints: user.score * cart.items.length
      };
    }
  );

  const triggerRecomputation = () => {
    userStore.update(user => ({ ...user, score: user.score + 1 }));
  };

  const triggerExpensiveRecomputation = () => {
    userStore.update(user => ({ ...user, firstName: user.firstName + '!' }));
  };

  return (
    <DemoCard title="Performance Optimized Computations">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Label className="font-semibold">Expensive Computation</Label>
            <div className="text-sm space-y-1">
              <div>Result: {expensiveComputation.result.toFixed(2)}</div>
              <div>Computed at: {expensiveComputation.computedAt}</div>
              <div className="text-xs text-gray-500">Hash: {expensiveComputation.inputHash}</div>
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <Label className="font-semibold">Conditional Computation</Label>
            <div className="text-sm space-y-1">
              <div>{conditionalData.message}</div>
              <div>Can Access: {conditionalData.canAccess ? '✅' : '❌'}</div>
              {conditionalData.loyaltyPoints && (
                <div>Loyalty Points: {conditionalData.loyaltyPoints}</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={triggerRecomputation} variant="primary" size="sm">
            Increment Score (cheap)
          </Button>
          <Button onClick={triggerExpensiveRecomputation} variant="secondary" size="sm">
            Change Name (expensive)
          </Button>
        </div>

        <CodeExample>
{`// Memoized expensive computation
const expensiveComputation = useComputedStore(
  [userStore, cartStore],
  useMemo(() => ([user, cart]) => {
    // Expensive computation here
    return heavyCalculation(user, cart);
  }, []),
  {
    comparison: 'shallow',
    cacheKey: 'expensive-calc'
  }
);

// Conditional computation
const conditionalData = useComputedStore(
  [userStore, cartStore],
  ([user, cart]) => {
    if (user.score < 50) return { message: 'Score too low' };
    if (cart.items.length === 0) return { message: 'Add items' };
    
    return {
      message: 'Premium features available',
      recommendations: generateRecommendations(cart.items)
    };
  }
);`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Main Component
function UseComputedStorePatternsPage() {
  return (
    <PageWithLogMonitor>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            useComputedStore Patterns
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Computed value patterns using useComputedStore for derived state, performance optimization, 
            and reactive calculations.
          </p>
        </div>

        <div className="space-y-8">
          <Section title="Basic Computed Values">
            <BasicComputedDemo />
          </Section>

          <Section title="Multi-Store Computations">
            <MultiStoreComputationDemo />
          </Section>

          <Section title="Performance Optimization">
            <PerformanceOptimizedDemo />
          </Section>

          <Section title="Key Takeaways">
            <DemoCard title="Best Practices">
              <div className="space-y-4">
                <div className="prose">
                  <ul className="list-disc list-inside space-y-2">
                    <li><strong>Keep computations pure:</strong> No side effects in computed values</li>
                    <li><strong>Use memoization:</strong> Wrap expensive computations with useMemo</li>
                    <li><strong>Appropriate comparison:</strong> Choose reference/shallow/deep based on data complexity</li>
                    <li><strong>Conditional logic:</strong> Skip expensive computations when not needed</li>
                    <li><strong>Reactive calculations:</strong> Let computed stores automatically update when dependencies change</li>
                  </ul>
                </div>
              </div>
            </DemoCard>
          </Section>
        </div>
      </div>
    </PageWithLogMonitor>
  );
}

export default UseComputedStorePatternsPage;