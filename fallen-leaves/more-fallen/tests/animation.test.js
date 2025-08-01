/**
 * Fallen Leaves Animation Tests
 * Tests for basic animation functionality and accessibility
 */

// Mock DOM elements for testing
const mockDOM = () => {
    global.document = {
        querySelector: jest.fn(),
        addEventListener: jest.fn(),
        readyState: 'complete',
        hidden: false,
        documentElement: {
            style: {
                setProperty: jest.fn()
            }
        }
    };

    global.window = {
        matchMedia: jest.fn(() => ({
            matches: false,
            addEventListener: jest.fn()
        })),
        innerWidth: 1024,
        requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
        performance: {
            now: jest.fn(() => Date.now())
        },
        navigator: {
            connection: null
        }
    };
};

describe('FallenLeavesController', () => {
    let FallenLeavesController;
    let controller;
    let mockPauseBtn;

    beforeEach(() => {
        mockDOM();
        
        // Mock pause button
        mockPauseBtn = {
            addEventListener: jest.fn(),
            querySelector: jest.fn(),
            setAttribute: jest.fn(),
            style: {}
        };

        document.querySelector.mockReturnValue(mockPauseBtn);
        
        // Import the class after mocking
        FallenLeavesController = require('../assets/js/main.js');
        controller = new FallenLeavesController();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with default state', () => {
        expect(controller.isAnimationPaused).toBe(false);
        expect(document.querySelector).toHaveBeenCalledWith('.pause-btn');
    });

    test('should set up event listeners on initialization', () => {
        expect(mockPauseBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        expect(mockPauseBtn.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    });

    test('should pause animation when toggleAnimation is called on running animation', () => {
        controller.toggleAnimation();
        
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--animation-play-state', 'paused');
        expect(controller.isAnimationPaused).toBe(true);
    });

    test('should resume animation when toggleAnimation is called on paused animation', () => {
        controller.isAnimationPaused = true;
        controller.toggleAnimation();
        
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--animation-play-state', 'running');
        expect(controller.isAnimationPaused).toBe(false);
    });

    test('should handle reduced motion preference', () => {
        // Mock reduced motion preference
        window.matchMedia.mockReturnValue({
            matches: true,
            addEventListener: jest.fn()
        });

        controller.checkReducedMotion();
        
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--animation-play-state', 'paused');
        expect(mockPauseBtn.style.display).toBe('none');
    });

    test('should optimize for mobile devices', () => {
        // Mock mobile viewport
        window.innerWidth = 500;
        
        controller.optimizeForDevice();
        
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--leaf-fall-duration', '12s');
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--leaf-sway-duration', '5s');
    });

    test('should handle keyboard navigation', () => {
        const keydownHandler = mockPauseBtn.addEventListener.mock.calls.find(call => call[0] === 'keydown')[1];
        const mockEvent = {
            key: 'Enter',
            preventDefault: jest.fn()
        };

        controller.pauseAnimation = jest.fn();
        keydownHandler(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('should update pause button correctly', () => {
        const mockIcon = { textContent: '' };
        const mockText = { textContent: '' };
        
        mockPauseBtn.querySelector.mockImplementation(selector => {
            if (selector === '.pause-btn__icon') return mockIcon;
            if (selector === '.pause-btn__text') return mockText;
            return null;
        });

        controller.updatePauseButton('▶', '再生');

        expect(mockIcon.textContent).toBe('▶');
        expect(mockText.textContent).toBe('再生');
        expect(mockPauseBtn.setAttribute).toHaveBeenCalledWith('aria-label', 'アニメーションを再生');
    });
});

describe('Animation Performance', () => {
    test('should monitor frame rate', (done) => {
        mockDOM();
        
        const FallenLeavesController = require('../assets/js/main.js');
        const controller = new FallenLeavesController();

        // Mock console.warn to check if performance warning is triggered
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        // Simulate low FPS scenario
        let frameCount = 0;
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = jest.fn((callback) => {
            frameCount++;
            if (frameCount < 15) { // Simulate low FPS (< 20)
                setTimeout(callback, 100); // Slow frame rate
            } else {
                // After several slow frames, check if warning was issued
                setTimeout(() => {
                    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--leaf-fall-duration', '15s');
                    consoleSpy.mockRestore();
                    done();
                }, 50);
            }
        });

        controller.monitorPerformance();
    });
});

describe('Accessibility Features', () => {
    beforeEach(() => {
        mockDOM();
    });

    test('should respect prefers-reduced-motion', () => {
        window.matchMedia.mockReturnValue({
            matches: true,
            addEventListener: jest.fn()
        });

        const FallenLeavesController = require('../assets/js/main.js');
        new FallenLeavesController();

        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--animation-play-state', 'paused');
    });

    test('should handle Page Visibility API', () => {
        const FallenLeavesController = require('../assets/js/main.js');
        const controller = new FallenLeavesController();

        const visibilityHandler = document.addEventListener.mock.calls.find(call => call[0] === 'visibilitychange')[1];
        
        // Mock hidden tab
        document.hidden = true;
        controller.pauseAnimation = jest.fn();
        
        visibilityHandler();
        expect(controller.pauseAnimation).toHaveBeenCalled();
    });
});