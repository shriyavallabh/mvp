#!/usr/bin/env node

/**
 * Simple Unit Test Runner
 * Runs unit tests with basic test framework simulation
 */

// Mock Jest-like test framework
let beforeEachFn = null;

global.describe = (name, fn) => {
    console.log(`\nTest Suite: ${name}`);
    beforeEachFn = null; // Reset for each suite
    fn();
};

global.beforeEach = (fn) => {
    beforeEachFn = fn;
};

global.it = (name, fn) => {
    try {
        if (beforeEachFn) beforeEachFn();
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}: ${error.message}`);
    }
};

global.expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${expected} but got ${actual}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
    },
    toBeDefined: () => {
        if (actual === undefined) {
            throw new Error('Expected value to be defined');
        }
    },
    toContain: (item) => {
        if (!actual.includes(item)) {
            throw new Error(`Expected array to contain ${item}`);
        }
    },
    toHaveLength: (length) => {
        if (actual.length !== length) {
            throw new Error(`Expected length ${length} but got ${actual.length}`);
        }
    },
    toMatch: (pattern) => {
        if (!pattern.test(actual)) {
            throw new Error(`Expected ${actual} to match ${pattern}`);
        }
    },
    toBeGreaterThan: (value) => {
        if (actual <= value) {
            throw new Error(`Expected ${actual} to be greater than ${value}`);
        }
    },
    toBeLessThan: (value) => {
        if (actual >= value) {
            throw new Error(`Expected ${actual} to be less than ${value}`);
        }
    },
    toThrow: (error) => {
        try {
            actual();
            throw new Error(`Expected function to throw ${error}`);
        } catch (e) {
            if (error && !e.message.includes(error)) {
                throw new Error(`Expected error "${error}" but got "${e.message}"`);
            }
        }
    }
});

global.jest = {
    fn: (impl) => {
        const mockFn = impl || (() => {});
        mockFn.mockImplementation = (newImpl) => {
            Object.assign(mockFn, newImpl);
        };
        mockFn.mockRestore = () => {};
        return mockFn;
    },
    spyOn: (obj, method) => {
        const original = obj[method];
        const spy = {
            mockImplementation: (impl) => {
                obj[method] = impl;
                return spy;
            },
            mockRestore: () => {
                obj[method] = original;
            }
        };
        return spy;
    }
};

console.log('=================================');
console.log('UNIT TEST SUITE');
console.log('=================================');

// Run unit tests
try {
    console.log('\n--- Communication Tests ---');
    require('./unit/agents/utils/communication.test');
    
    console.log('\n--- Compliance Validator Tests ---');
    require('./unit/agents/validators/compliance-validator.test');
    
    console.log('\n--- Content Orchestrator Tests ---');
    require('./unit/agents/controllers/content-orchestrator.test');
    
    console.log('\n=================================');
    console.log('UNIT TESTS COMPLETE');
    console.log('=================================');
} catch (error) {
    console.error('\nError running unit tests:', error.message);
}