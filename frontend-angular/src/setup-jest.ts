/**
 * Jest setup file for TecSalud Medical Assistant Angular Frontend
 *
 * @description Global setup for Jest testing environment including Angular testing
 * utilities, custom matchers, and test configuration for medical application testing.
 *
 * @since 1.0.0
 */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Global test configuration
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance']
    };
  }
});

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true
    };
  }
});

// Mock global objects for medical application
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for components with lazy loading
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock MediaQueryList for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL for file handling in medical document upload
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File API for document upload testing
global.File = class MockFile {
  constructor(parts: any[], name: string, properties?: any) {
    return {
      name,
      size: properties?.size || 0,
      type: properties?.type || '',
      lastModified: Date.now(),
      ...properties
    } as any;
  }
} as any;

// Mock FileReader for document processing
global.FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: any = null;
  onerror: any = null;
  onloadend: any = null;

  readAsDataURL() {
    this.readyState = 2;
    this.result = 'data:application/pdf;base64,mock-data';
    if (this.onload) this.onload({ target: this });
    if (this.onloadend) this.onloadend({ target: this });
  }

  readAsText() {
    this.readyState = 2;
    this.result = 'mock file content';
    if (this.onload) this.onload({ target: this });
    if (this.onloadend) this.onloadend({ target: this });
  }
} as any;

// Console error suppression for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Custom Jest matchers for Angular testing
expect.extend({
  /**
   * Custom matcher to check if an Angular component has a specific class
   */
  toHaveClass(received: any, className: string) {
    const pass = received.classList?.contains(className) || false;
    return {
      message: () =>
        pass
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`,
      pass,
    };
  },

  /**
   * Custom matcher to check if an element is visible
   */
  toBeVisible(received: any) {
    const pass = received.style?.display !== 'none' &&
                 received.style?.visibility !== 'hidden';
    return {
      message: () =>
        pass
          ? 'Expected element not to be visible'
          : 'Expected element to be visible',
      pass,
    };
  }
});

// TypeScript interface for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveClass(className: string): R;
      toBeVisible(): R;
    }
  }
}
