import { 
  TypeGuards,
  isRefState,
  isDOMEvent,
  isEventLike,
  hasTargetProperty,
  isDOMElement,
  isObject,
  isSuspiciousEventObject,
  findProblematicProperties,
  RefState
} from '../../../src/stores/utils/type-guards';

describe('TypeGuards', () => {
  describe('isRefState', () => {
    it('should identify valid RefState objects', () => {
      const validRefState: RefState = {
        target: document.createElement('div'),
        isReady: true,
        isMounted: false,
        mountPromise: null
      };

      expect(isRefState(validRefState)).toBe(true);
      expect(TypeGuards.isRefState(validRefState)).toBe(true);
    });

    it('should reject invalid RefState objects', () => {
      expect(isRefState({})).toBe(false);
      expect(isRefState({ target: 'div' })).toBe(false);
      expect(isRefState({ 
        target: 'div', 
        isReady: true, 
        isMounted: false 
      })).toBe(false); // Missing mountPromise

      expect(isRefState({
        target: 'div',
        isReady: 'true', // Wrong type
        isMounted: false,
        mountPromise: null
      })).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isRefState(null)).toBe(false);
      expect(isRefState(undefined)).toBe(false);
    });

    it('should reject primitive values', () => {
      expect(isRefState('string')).toBe(false);
      expect(isRefState(42)).toBe(false);
      expect(isRefState(true)).toBe(false);
    });
  });

  describe('isDOMEvent', () => {
    it('should identify real DOM events', () => {
      const clickEvent = new MouseEvent('click');
      const keyEvent = new KeyboardEvent('keydown');
      const customEvent = new CustomEvent('custom');

      expect(isDOMEvent(clickEvent)).toBe(true);
      expect(isDOMEvent(keyEvent)).toBe(true);
      expect(isDOMEvent(customEvent)).toBe(true);
    });

    it('should reject non-event objects', () => {
      expect(isDOMEvent({})).toBe(false);
      expect(isDOMEvent({ type: 'click' })).toBe(false);
      expect(isDOMEvent('event')).toBe(false);
      expect(isDOMEvent(null)).toBe(false);
    });
  });

  describe('isEventLike', () => {
    it('should identify objects with preventDefault method', () => {
      const eventLike = { preventDefault: () => {} };
      const realEvent = new MouseEvent('click');

      expect(isEventLike(eventLike)).toBe(true);
      expect(isEventLike(realEvent)).toBe(true);
    });

    it('should reject objects without preventDefault', () => {
      expect(isEventLike({})).toBe(false);
      expect(isEventLike({ stop: () => {} })).toBe(false);
      expect(isEventLike({ preventDefault: 'not a function' })).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(isEventLike(null)).toBe(false);
      expect(isEventLike('preventDefault')).toBe(false);
      expect(isEventLike(42)).toBe(false);
    });
  });

  describe('hasTargetProperty', () => {
    it('should identify objects with target property', () => {
      const withTarget = { target: document.createElement('div') };
      const realEvent = new MouseEvent('click');

      expect(hasTargetProperty(withTarget)).toBe(true);
      expect(hasTargetProperty(realEvent)).toBe(true);
    });

    it('should reject objects without target property', () => {
      expect(hasTargetProperty({})).toBe(false);
      expect(hasTargetProperty({ source: 'element' })).toBe(false);
    });

    it('should accept objects with target as any value', () => {
      expect(hasTargetProperty({ target: null })).toBe(true);
      expect(hasTargetProperty({ target: undefined })).toBe(true);
      expect(hasTargetProperty({ target: 'string' })).toBe(true);
    });
  });

  describe('isDOMElement', () => {
    it('should identify DOM elements', () => {
      const div = document.createElement('div');
      const button = document.createElement('button');
      const span = document.createElement('span');

      expect(isDOMElement(div)).toBe(true);
      expect(isDOMElement(button)).toBe(true);
      expect(isDOMElement(span)).toBe(true);
    });

    it('should reject non-DOM elements', () => {
      expect(isDOMElement({})).toBe(false);
      expect(isDOMElement('div')).toBe(false);
      expect(isDOMElement({ nodeName: 'DIV' })).toBe(false);
      expect(isDOMElement(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should identify plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(new RegExp('test'))).toBe(true);
    });

    it('should reject non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject(true)).toBe(false);
    });

    it('should reject arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });
  });

  describe('isSuspiciousEventObject', () => {
    it('should detect DOM events', () => {
      const clickEvent = new MouseEvent('click');
      expect(isSuspiciousEventObject(clickEvent)).toBe(true);
    });

    it('should detect event-like objects with target and type', () => {
      const eventLike = {
        type: 'click',
        target: document.createElement('button'),
        preventDefault: () => {}
      };
      expect(isSuspiciousEventObject(eventLike)).toBe(true);
    });

    it('should detect React synthetic events', () => {
      const syntheticEvent = {
        type: 'click',
        nativeEvent: new MouseEvent('click'),
        persist: () => {}
      };
      expect(isSuspiciousEventObject(syntheticEvent)).toBe(true);
    });

    it('should detect objects with event constructor names', () => {
      // Mock object with event-like constructor name
      const mockEvent = Object.create(null);
      Object.defineProperty(mockEvent, 'constructor', {
        value: { name: 'MouseEvent' }
      });
      expect(isSuspiciousEventObject(mockEvent)).toBe(true);
    });

    it('should not detect RefState objects', () => {
      const refState: RefState = {
        target: document.createElement('div'),
        isReady: true,
        isMounted: false,
        mountPromise: null
      };
      expect(isSuspiciousEventObject(refState)).toBe(false);
    });

    it('should not detect plain objects', () => {
      expect(isSuspiciousEventObject({})).toBe(false);
      expect(isSuspiciousEventObject({ data: 'value' })).toBe(false);
      expect(isSuspiciousEventObject({ target: 'not-element' })).toBe(false);
    });

    it('should detect nested event objects when enabled', () => {
      const objectWithNestedEvent = {
        data: 'value',
        event: {
          type: 'click',
          target: document.createElement('button')
        }
      };
      expect(isSuspiciousEventObject(objectWithNestedEvent, true)).toBe(true);
    });

    it('should not detect nested events when disabled', () => {
      const objectWithNestedEvent = {
        data: 'value',
        event: {
          type: 'click',
          target: document.createElement('button')
        }
      };
      expect(isSuspiciousEventObject(objectWithNestedEvent, false)).toBe(false);
    });

    it('should detect various event constructor names', () => {
      const eventTypes = [
        'Event',
        'SyntheticEvent',
        'MouseEvent',
        'KeyboardEvent',
        'TouchEvent',
        'FocusEvent',
        'SubmitEvent'
      ];

      eventTypes.forEach(eventType => {
        const mockEvent = Object.create(null);
        Object.defineProperty(mockEvent, 'constructor', {
          value: { name: eventType }
        });
        expect(isSuspiciousEventObject(mockEvent)).toBe(true);
      });
    });
  });

  describe('findProblematicProperties', () => {
    it('should find DOM elements in object properties', () => {
      const objWithElement = {
        title: 'Test',
        element: document.createElement('div'),
        value: 42
      };

      const problematic = findProblematicProperties(objWithElement);
      expect(problematic).toContain('element');
      expect(problematic).not.toContain('title');
      expect(problematic).not.toContain('value');
    });

    it('should find DOM events in object properties', () => {
      const objWithEvent = {
        data: 'test',
        clickEvent: new MouseEvent('click'),
        callback: () => {}
      };

      const problematic = findProblematicProperties(objWithEvent);
      expect(problematic).toContain('clickEvent');
      expect(problematic).not.toContain('data');
      expect(problematic).not.toContain('callback');
    });

    it('should find objects with target properties', () => {
      const objWithTarget = {
        info: 'data',
        eventLike: { target: document.createElement('button'), type: 'click' }
      };

      const problematic = findProblematicProperties(objWithTarget);
      expect(problematic).toContain('eventLike');
      expect(problematic).not.toContain('info');
    });

    it('should return empty array for safe objects', () => {
      const safeObject = {
        name: 'test',
        value: 42,
        active: true,
        data: { nested: 'value' }
      };

      const problematic = findProblematicProperties(safeObject);
      expect(problematic).toEqual([]);
    });

    it('should return empty array for non-objects', () => {
      expect(findProblematicProperties(null)).toEqual([]);
      expect(findProblematicProperties(undefined)).toEqual([]);
      expect(findProblematicProperties('string')).toEqual([]);
      expect(findProblematicProperties(42)).toEqual([]);
      expect(findProblematicProperties([])).toEqual([]);
    });

    it('should find multiple problematic properties', () => {
      const problematicObject = {
        safeData: 'test',
        element1: document.createElement('div'),
        event1: new MouseEvent('click'),
        element2: document.createElement('span'),
        eventLike: { target: document.createElement('input'), type: 'input' }
      };

      const problematic = findProblematicProperties(problematicObject);
      expect(problematic).toHaveLength(4);
      expect(problematic).toContain('element1');
      expect(problematic).toContain('event1');
      expect(problematic).toContain('element2');
      expect(problematic).toContain('eventLike');
      expect(problematic).not.toContain('safeData');
    });
  });

  describe('TypeGuards unified object', () => {
    it('should provide access to all type guard functions', () => {
      expect(typeof TypeGuards.isRefState).toBe('function');
      expect(typeof TypeGuards.isDOMEvent).toBe('function');
      expect(typeof TypeGuards.isEventLike).toBe('function');
      expect(typeof TypeGuards.hasTargetProperty).toBe('function');
      expect(typeof TypeGuards.isDOMElement).toBe('function');
      expect(typeof TypeGuards.isObject).toBe('function');
      expect(typeof TypeGuards.isSuspiciousEventObject).toBe('function');
      expect(typeof TypeGuards.findProblematicProperties).toBe('function');
    });

    it('should maintain consistency with individual functions', () => {
      const testObject = { target: document.createElement('div'), type: 'click' };
      
      expect(TypeGuards.isObject(testObject)).toBe(isObject(testObject));
      expect(TypeGuards.hasTargetProperty(testObject)).toBe(hasTargetProperty(testObject));
      expect(TypeGuards.isSuspiciousEventObject(testObject)).toBe(isSuspiciousEventObject(testObject));
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle objects with null prototypes', () => {
      const nullProtoObject = Object.create(null);
      nullProtoObject.target = document.createElement('div');
      nullProtoObject.type = 'click';

      expect(isObject(nullProtoObject)).toBe(true);
      expect(hasTargetProperty(nullProtoObject)).toBe(true);
    });

    it('should handle circular references safely', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      circular.target = document.createElement('div');

      expect(() => {
        isObject(circular);
        hasTargetProperty(circular);
        findProblematicProperties(circular);
      }).not.toThrow();
    });

    it('should handle objects with getters', () => {
      const objWithGetters = {
        get target() {
          return document.createElement('div');
        },
        get type() {
          return 'click';
        }
      };

      expect(hasTargetProperty(objWithGetters)).toBe(true);
      expect(isSuspiciousEventObject(objWithGetters)).toBe(true);
    });

    it('should handle frozen objects', () => {
      const frozenObject = Object.freeze({
        target: document.createElement('button'),
        type: 'click'
      });

      expect(hasTargetProperty(frozenObject)).toBe(true);
      expect(isSuspiciousEventObject(frozenObject)).toBe(true);
    });

    it('should handle objects with Symbol properties', () => {
      const symbolKey = Symbol('test');
      const objWithSymbol = {
        [symbolKey]: 'value',
        target: 'not-element'
      };

      expect(hasTargetProperty(objWithSymbol)).toBe(true);
      expect(isSuspiciousEventObject(objWithSymbol)).toBe(false);
    });
  });
});

describe('Integration with Store Event Prevention', () => {
  it('should correctly identify problematic objects for Store', () => {
    // Test scenarios that Store.setValue would encounter
    const problematicCases = [
      new MouseEvent('click'),
      { target: document.createElement('input'), type: 'input' },
      { nativeEvent: new MouseEvent('click'), persist: () => {} },
      { preventDefault: () => {}, stopPropagation: () => {}, type: 'click' }
    ];

    problematicCases.forEach(testCase => {
      const result = isSuspiciousEventObject(testCase);
      if (!result) {
        console.log('Failed case:', testCase, 'Constructor:', testCase.constructor?.name);
      }
      expect(result).toBe(true);
    });
  });

  it('should correctly identify safe objects for Store', () => {
    const safeCases = [
      { name: 'user', age: 30 },
      { target: 'string-value', type: 'data-type' },
      { isReady: true, isMounted: false, target: 'ref', mountPromise: null },
      { data: [1, 2, 3], meta: { created: Date.now() } }
    ];

    safeCases.forEach(testCase => {
      if (isRefState(testCase)) {
        expect(isSuspiciousEventObject(testCase)).toBe(false);
      } else {
        const suspicious = isSuspiciousEventObject(testCase);
        if (suspicious) {
          // If it's suspicious, it should have clear event-like properties
          expect(
            hasTargetProperty(testCase) && isObject(testCase) ||
            isEventLike(testCase) ||
            isDOMEvent(testCase)
          ).toBe(true);
        }
      }
    });
  });
});