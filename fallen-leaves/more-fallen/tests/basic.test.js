/**
 * Basic Integration Tests
 * Simple tests to verify basic functionality works
 */

describe('Basic Functionality', () => {
    test('should have main HTML elements', () => {
        const main = document.querySelector('main');
        const hero = document.querySelector('.hero');
        const leavesContainer = document.querySelector('.leaves-container');
        
        expect(main).toBeTruthy();
        expect(hero).toBeTruthy();
        expect(leavesContainer).toBeTruthy();
    });

    test('should have leaf elements', () => {
        const leaves = document.querySelectorAll('.leaf');
        expect(leaves.length).toBeGreaterThan(0);
    });

    test('should have pause button', () => {
        const pauseBtn = document.querySelector('.pause-btn');
        expect(pauseBtn).toBeTruthy();
        
        const icon = pauseBtn?.querySelector('.pause-btn__icon');
        const text = pauseBtn?.querySelector('.pause-btn__text');
        expect(icon).toBeTruthy();
        expect(text).toBeTruthy();
    });

    test('should have proper accessibility attributes', () => {
        const leavesContainer = document.querySelector('.leaves-container');
        const pauseBtn = document.querySelector('.pause-btn');
        
        expect(leavesContainer?.getAttribute('aria-label')).toBe('舞い散る落ち葉のアニメーション');
        expect(pauseBtn?.getAttribute('aria-label')).toContain('アニメーション');
        expect(pauseBtn?.getAttribute('type')).toBe('button');
    });

    test('should have proper heading structure', () => {
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const allH1s = document.querySelectorAll('h1');
        
        expect(h1).toBeTruthy();
        expect(h2).toBeTruthy();
        expect(allH1s.length).toBe(1); // Only one h1
    });

    test('should have meta tags', () => {
        const charset = document.querySelector('meta[charset]');
        const viewport = document.querySelector('meta[name="viewport"]');
        const description = document.querySelector('meta[name="description"]');
        
        expect(charset?.getAttribute('charset')).toBe('UTF-8');
        expect(viewport?.getAttribute('content')).toContain('width=device-width');
        expect(description?.getAttribute('content')).toBeTruthy();
    });
});

describe('FallenLeavesController Initialization', () => {
    test('should initialize without errors', () => {
        // Save original methods
        const originalQuerySelector = document.querySelector;
        const originalQuerySelectorAll = document.querySelectorAll;
        
        // Mock the required DOM elements
        const mockPauseBtn = {
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            setAttribute: jest.fn(),
            style: {}
        };
        
        const mockLeavesContainer = {
            appendChild: jest.fn()
        };

        document.querySelector = jest.fn((selector) => {
            if (selector === '.pause-btn') return mockPauseBtn;
            if (selector === '.leaves-container') return mockLeavesContainer;
            return null;
        });

        document.querySelectorAll = jest.fn((selector) => {
            if (selector === '.leaf') {
                return Array.from({ length: 6 }, (_, i) => ({
                    style: { left: `${i * 15 + 10}%`, top: '-30px' },
                    getBoundingClientRect: () => ({ left: 50, top: 100, width: 20, height: 20 })
                }));
            }
            return [];
        });

        expect(() => {
            const FallenLeavesController = require('../assets/js/main.js');
            new FallenLeavesController();
        }).not.toThrow();
        
        // Restore original methods
        document.querySelector = originalQuerySelector;
        document.querySelectorAll = originalQuerySelectorAll;
    });
});

describe('CSS Classes and Animations', () => {
    test('should have required CSS classes', () => {
        // Debug output
        console.log('Body HTML:', document.body.innerHTML.substring(0, 100));
        
        const main = document.querySelector('main');
        expect(main).toBeTruthy();
        
        if (main) {
            expect(main.classList.contains('scene')).toBe(true);
        }
        
        expect(document.querySelector('.hero')).toBeTruthy();
        expect(document.querySelector('.leaves-container')).toBeTruthy();
        expect(document.querySelector('.content')).toBeTruthy();
        expect(document.querySelector('.animation-controls')).toBeTruthy();
    });

    test('should have leaf elements with proper classes', () => {
        const leaves = document.querySelectorAll('.leaf');
        expect(leaves.length).toBeGreaterThan(0);
        
        // Use NodeList check instead of Array.from
        for (let i = 0; i < leaves.length; i++) {
            const leaf = leaves[i];
            expect(leaf).toBeTruthy();
            expect(leaf.className).toBe('leaf');
        }
    });
});