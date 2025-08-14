/**
 * useLocalStore Hook Examples
 * 
 * Demonstrates component-local store creation and management
 */

import React, { useState } from 'react';
import { useLocalStore } from '../../../src/stores/hooks/useLocalStore';

// Example 1: Basic local store usage
function BasicLocalStore() {
  const { value, setValue, update, store } = useLocalStore(0);
  
  return (
    <div className="example-section">
      <h3>Basic Local Store</h3>
      <p>Store name: {store.name}</p>
      <p>Value: {value}</p>
      
      <div>
        <button onClick={() => setValue(value + 1)}>Increment</button>
        <button onClick={() => setValue(value - 1)}>Decrement</button>
        <button onClick={() => update(prev => prev * 2)}>Double</button>
        <button onClick={() => setValue(0)}>Reset</button>
      </div>
    </div>
  );
}

// Example 2: Local store with complex objects
function ObjectLocalStore() {
  const { value: user, setValue, update } = useLocalStore({
    name: 'John Doe',
    age: 30,
    skills: ['JavaScript', 'React', 'TypeScript'],
    profile: {
      avatar: '👨‍💻',
      bio: 'Software Developer'
    }
  });
  
  const addSkill = () => {
    const newSkill = prompt('Enter a new skill:');
    if (newSkill) {
      update(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
    }
  };
  
  const removeSkill = (skillToRemove: string) => {
    update(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  
  return (
    <div className="example-section">
      <h3>Object Local Store</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>User Info</h4>
          <p>{user.profile.avatar} {user.name}</p>
          <p>Age: {user.age}</p>
          <p>Bio: {user.profile.bio}</p>
          
          <div>
            <button 
              onClick={() => update(prev => ({ ...prev, age: prev.age + 1 }))}
            >
              Age +1
            </button>
            <button 
              onClick={() => setValue({
                ...user,
                name: user.name === 'John Doe' ? 'Jane Smith' : 'John Doe',
                profile: {
                  ...user.profile,
                  avatar: user.profile.avatar === '👨‍💻' ? '👩‍💻' : '👨‍💻'
                }
              })}
            >
              Toggle User
            </button>
          </div>
        </div>
        
        <div>
          <h4>Skills</h4>
          <ul>
            {user.skills.map(skill => (
              <li key={skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {skill}
                <button 
                  onClick={() => removeSkill(skill)}
                  style={{ marginLeft: '10px', fontSize: '12px' }}
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
          <button onClick={addSkill}>Add Skill</button>
        </div>
      </div>
    </div>
  );
}

// Example 3: Form management with local store
function FormWithLocalStore() {
  const { value: formData, setValue, update } = useLocalStore({
    firstName: '',
    lastName: '',
    email: '',
    age: 18,
    interests: [] as string[],
    newsletter: false
  });
  
  const availableInterests = ['Programming', 'Design', 'Music', 'Sports', 'Reading', 'Travel'];
  
  const toggleInterest = (interest: string) => {
    update(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };
  
  const handleSubmit = () => {
    alert(`Form submitted with data:\n${JSON.stringify(formData, null, 2)}`);
  };
  
  const isValid = formData.firstName && formData.lastName && formData.email;
  
  return (
    <div className="example-section">
      <h3>Form Management with Local Store</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Form Fields</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => update(prev => ({ ...prev, firstName: e.target.value }))}
            />
            
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => update(prev => ({ ...prev, lastName: e.target.value }))}
            />
            
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => update(prev => ({ ...prev, email: e.target.value }))}
            />
            
            <input
              type="number"
              min="18"
              max="100"
              value={formData.age}
              onChange={(e) => update(prev => ({ ...prev, age: parseInt(e.target.value) }))}
            />
            
            <label>
              <input
                type="checkbox"
                checked={formData.newsletter}
                onChange={(e) => update(prev => ({ ...prev, newsletter: e.target.checked }))}
              />
              Subscribe to newsletter
            </label>
          </div>
        </div>
        
        <div>
          <h4>Interests</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {availableInterests.map(interest => (
              <label key={interest}>
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => toggleInterest(interest)}
                />
                {interest}
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleSubmit}
          disabled={!isValid}
          style={{ 
            backgroundColor: isValid ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px'
          }}
        >
          Submit Form
        </button>
        
        <button 
          onClick={() => setValue({
            firstName: '',
            lastName: '',
            email: '',
            age: 18,
            interests: [],
            newsletter: false
          })}
          style={{ marginLeft: '10px' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Example 4: Shopping cart with local store
function ShoppingCartLocalStore() {
  const { value: cart, update } = useLocalStore<{
    items: Array<{ id: number; name: string; price: number; quantity: number }>;
    total: number;
  }>({
    items: [],
    total: 0
  });
  
  const availableProducts = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 25 },
    { id: 3, name: 'Keyboard', price: 75 },
    { id: 4, name: 'Monitor', price: 299 }
  ];
  
  const addToCart = (product: typeof availableProducts[0]) => {
    update(prev => {
      const existingItem = prev.items.find(item => item.id === product.id);
      let newItems;
      
      if (existingItem) {
        newItems = prev.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev.items, { ...product, quantity: 1 }];
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return { items: newItems, total: newTotal };
    });
  };
  
  const removeFromCart = (productId: number) => {
    update(prev => {
      const newItems = prev.items.filter(item => item.id !== productId);
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: newItems, total: newTotal };
    });
  };
  
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    update(prev => {
      const newItems = prev.items.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { items: newItems, total: newTotal };
    });
  };
  
  return (
    <div className="example-section">
      <h3>Shopping Cart with Local Store</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Available Products</h4>
          {availableProducts.map(product => (
            <div key={product.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px',
              border: '1px solid #ddd',
              marginBottom: '5px'
            }}>
              <div>
                <strong>{product.name}</strong>
                <div>${product.price}</div>
              </div>
              <button onClick={() => addToCart(product)}>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
        
        <div>
          <h4>Cart ({cart.items.length} items)</h4>
          {cart.items.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {cart.items.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #ddd',
                  marginBottom: '5px'
                }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div>${item.price} x {item.quantity}</div>
                  </div>
                  <div>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <span style={{ margin: '0 10px' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      style={{ marginLeft: '10px', color: 'red' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                textAlign: 'right',
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa'
              }}>
                Total: ${cart.total}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Example 5: Named stores for debugging
function NamedLocalStores() {
  const counter1 = useLocalStore(0, 'counter1');
  const counter2 = useLocalStore(10, 'counter2');
  const counter3 = useLocalStore(100, 'counter3');
  
  return (
    <div className="example-section">
      <h3>Named Local Stores</h3>
      <p>Using custom names helps with debugging and development tools</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {[counter1, counter2, counter3].map((counter, index) => (
          <div key={index} style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd' }}>
            <h4>{counter.store.name}</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{counter.value}</p>
            <div>
              <button onClick={() => counter.setValue(counter.value + 1)}>+</button>
              <button onClick={() => counter.setValue(counter.value - 1)} style={{ marginLeft: '5px' }}>-</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main component showcasing all examples
export function UseLocalStoreExamples() {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>useLocalStore Hook Examples</h1>
      <p>
        The <code>useLocalStore</code> hook creates a store scoped to the component lifecycle.
        Perfect for complex component state that benefits from the store API.
      </p>
      
      <BasicLocalStore />
      <ObjectLocalStore />
      <FormWithLocalStore />
      <ShoppingCartLocalStore />
      <NamedLocalStores />
      
      <div className="example-section">
        <h3>Key Features</h3>
        <ul>
          <li>✅ Component-scoped store lifecycle</li>
          <li>✅ Automatic cleanup when component unmounts</li>
          <li>✅ Store API (setValue, update, getValue) for complex state</li>
          <li>✅ Custom naming for debugging</li>
          <li>✅ Works with any data type (primitives, objects, arrays)</li>
          <li>✅ TypeScript support with type inference</li>
          <li>✅ Better than useState for complex state structures</li>
        </ul>
      </div>
      
      <div className="example-section">
        <h3>When to Use</h3>
        <ul>
          <li>🎯 Complex component state (forms, shopping carts, etc.)</li>
          <li>🎯 When you need the store API for easier state updates</li>
          <li>🎯 Component-local state that doesn't need to be shared</li>
          <li>🎯 Alternative to useReducer for complex state logic</li>
        </ul>
      </div>
    </div>
  );
}

export default UseLocalStoreExamples;