# Ref System Issues

RefContext and reference management problems in the Context-Action framework.

## 🔗 Unresolved Refs

### Ref Mount Timeout Problems

#### The Problem
**Issue**: RefContext promises never resolving, causing memory leaks and hanging async operations.

**Symptoms**:
- Components waiting indefinitely for refs
- Memory usage growing over time in development
- Async operations that never complete
- Console warnings about unmounted components

#### Root Cause
Refs are expected but never get set due to component lifecycle issues:

```tsx
// ❌ PROBLEM: Ref expected but never set
function ComponentA() {
  const { waitForMount } = useRefHandler('myRef');
  
  useEffect(() => {
    waitForMount().then((element) => {
      // This never executes if ref is never set!
      element.focus();
    });
  }, [waitForMount]);
  
  // No component sets the ref!
  return <div>No ref set</div>;
}
```

#### The Fix
Ensure proper ref registration and mounting:

```tsx
// ✅ SOLUTION: Complete ref lifecycle
function RefLogicComponent({ children }) {
  // Register ref handler before children mount
  const { setRef } = useRefHandler('myRef');
  
  return (
    <div>
      {children}
      <div ref={setRef}>Ref Target</div>
    </div>
  );
}

function ComponentA() {
  const { waitForMount } = useRefHandler('myRef');
  
  useEffect(() => {
    // Add timeout for robustness
    Promise.race([
      waitForMount(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ref timeout')), 5000)
      )
    ]).then((element) => {
      element.focus();
    }).catch((error) => {
      console.warn('Ref mount failed:', error);
    });
  }, [waitForMount]);
  
  return <div>Waiting for ref...</div>;
}
```

### Ref Handler Registration Patterns

#### Component Mount Order Issues
**Issue**: Ref handlers registered after components that need them are already mounted.

**Solution**: Register ref handlers before component content:

```tsx
// ✅ CORRECT: Handler registration component
function RefSetup({ children }) {
  // Register ALL ref handlers before children mount
  useRefHandler('modalRef', {
    onMount: (element) => {
      element.focus();
    },
    onUnmount: () => {
      console.log('Modal unmounted');
    }
  });
  
  useRefHandler('inputRef', {
    onMount: (element) => {
      element.select();
    }
  });
  
  return children; // Components can now use refs
}

function App() {
  return (
    <RefSetup>
      <Modal />    {/* Can use modalRef */}
      <Form />     {/* Can use inputRef */}
    </RefSetup>
  );
}
```

## 🕐 Mount Timeout Problems

### Ref Timeout Configuration

#### Default Timeout Issues
**Issue**: Default ref mount timeouts may be too short for complex components.

**Solution**: Configure appropriate timeouts based on component complexity:

```tsx
// ✅ CUSTOM: Timeout configuration
const { waitForMount } = useRefHandler('complexRef', {
  timeout: 10000, // 10 second timeout for complex components
  onTimeout: () => {
    console.warn('Complex component mount timeout');
  }
});
```

#### Conditional Ref Mounting
**Issue**: Refs that are conditionally rendered may never mount.

```tsx
// ❌ PROBLEM: Conditional ref may never mount
function ConditionalComponent() {
  const [show, setShow] = useState(false);
  const { setRef, waitForMount } = useRefHandler('conditionalRef');
  
  useEffect(() => {
    waitForMount().then((element) => {
      // This may never execute if show is false
      element.scrollIntoView();
    });
  }, [waitForMount]);
  
  return (
    <div>
      {show && <div ref={setRef}>Conditional Content</div>}
    </div>
  );
}

// ✅ SOLUTION: Handle conditional mounting
function ConditionalComponent() {
  const [show, setShow] = useState(false);
  const { setRef, waitForMount } = useRefHandler('conditionalRef');
  
  useEffect(() => {
    if (show) {
      waitForMount()
        .then((element) => {
          element.scrollIntoView();
        })
        .catch((error) => {
          console.warn('Conditional ref timeout:', error);
        });
    }
  }, [show, waitForMount]);
  
  return (
    <div>
      <button onClick={() => setShow(true)}>Show Content</button>
      {show && <div ref={setRef}>Conditional Content</div>}
    </div>
  );
}
```

## 🐛 RefContext Debugging

### Ref State Inspection
```tsx
// Debug ref registration and mounting
function RefDebugging() {
  const { waitForMount, isRegistered, isMounted } = useRefHandler('debugRef');
  
  useEffect(() => {
    console.log('Ref registration status:', {
      registered: isRegistered(),
      mounted: isMounted()
    });
    
    waitForMount()
      .then(() => console.log('Ref mounted successfully'))
      .catch((error) => console.error('Ref mount failed:', error));
  }, [waitForMount, isRegistered, isMounted]);
  
  return <div>Check console for ref status</div>;
}
```

### RefContext Provider Debugging
```tsx
// Monitor RefContext state
function RefContextMonitor() {
  const refContext = useContext(RefContext);
  
  useEffect(() => {
    if (refContext) {
      console.log('Available refs:', Object.keys(refContext.refs));
      console.log('Pending refs:', Object.keys(refContext.pending));
    }
  }, [refContext]);
  
  return null;
}
```

## 🔧 Advanced Ref Patterns

### Ref Collection Pattern
**Use Case**: Managing multiple related refs.

```tsx
// ✅ PATTERN: Collection of related refs
function FormComponent() {
  const { setRef: setInputRef } = useRefHandler('formInput');
  const { setRef: setButtonRef } = useRefHandler('formButton');
  const { setRef: setErrorRef } = useRefHandler('formError');
  
  const { waitForMount: waitForInput } = useRefHandler('formInput');
  const { waitForMount: waitForButton } = useRefHandler('formButton');
  
  useEffect(() => {
    Promise.all([
      waitForInput(),
      waitForButton()
    ]).then(([input, button]) => {
      // All form elements are ready
      setupFormValidation(input, button);
    });
  }, [waitForInput, waitForButton]);
  
  return (
    <form>
      <input ref={setInputRef} />
      <button ref={setButtonRef}>Submit</button>
      <div ref={setErrorRef}>Error messages</div>
    </form>
  );
}
```

### Dynamic Ref Management
**Use Case**: Refs for dynamically created elements.

```tsx
// ✅ PATTERN: Dynamic ref creation
function DynamicList({ items }) {
  const refs = useRef<Map<string, HTMLElement>>(new Map());
  
  const createRefHandler = (itemId: string) => {
    const { setRef } = useRefHandler(`item-${itemId}`);
    return (element: HTMLElement | null) => {
      if (element) {
        refs.current.set(itemId, element);
        setRef(element);
      } else {
        refs.current.delete(itemId);
      }
    };
  };
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id} ref={createRefHandler(item.id)}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

## 🚨 Ref System Recovery

### Emergency Ref Cleanup
```tsx
// Clear all pending refs (development only)
const emergencyRefCleanup = () => {
  if (process.env.NODE_ENV === 'development') {
    // Access RefContext directly for cleanup
    const refContext = useContext(RefContext);
    if (refContext) {
      // Clear pending promises that will never resolve
      Object.keys(refContext.pending).forEach(refName => {
        console.warn(`Clearing stuck ref: ${refName}`);
        delete refContext.pending[refName];
      });
    }
  }
};
```

### Ref Memory Leak Prevention
```tsx
// Prevent ref memory leaks
function SafeRefComponent() {
  const { setRef, waitForMount } = useRefHandler('safeRef');
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout to prevent hanging
    timeoutRef.current = setTimeout(() => {
      console.warn('Ref mount timeout - cleaning up');
    }, 5000);
    
    waitForMount()
      .then(() => {
        clearTimeout(timeoutRef.current!);
      })
      .catch(() => {
        clearTimeout(timeoutRef.current!);
      });
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [waitForMount]);
  
  return <div ref={setRef}>Safe ref content</div>;
}
```

## 📋 Ref System Best Practices

### Ref Handler Guidelines
1. **Register Early**: Register ref handlers before components that use them
2. **Timeout Protection**: Always add timeouts to prevent hanging promises
3. **Cleanup Management**: Clean up refs and timeouts on component unmount
4. **Error Handling**: Handle ref mount failures gracefully
5. **Conditional Mounting**: Account for refs that may never mount

### Performance Considerations
- **Ref Caching**: Avoid creating new ref handlers on each render
- **Cleanup Optimization**: Use batch cleanup for multiple refs
- **Memory Monitoring**: Monitor ref memory usage in development
- **Timeout Tuning**: Set appropriate timeouts based on component complexity

### Testing Strategies
- **Mock Refs**: Create mock refs for testing components
- **Timeout Testing**: Test timeout scenarios and error handling
- **Memory Testing**: Verify ref cleanup prevents memory leaks
- **Integration Testing**: Test ref interactions with stores and actions