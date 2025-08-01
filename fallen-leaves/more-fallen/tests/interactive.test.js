/**
 * Interactive Features Tests for Phase 2
 * Tests for mouse interaction, physics, and dynamic leaf generation
 */

describe('Interactive Animation Features', () => {
    let FallenLeavesController;
    let controller;
    let mockLeavesContainer;

    beforeEach(() => {
        // Mock DOM
        global.document = {
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(),
            addEventListener: jest.fn(),
            createElement: jest.fn(),
            readyState: 'complete',
            hidden: false,
            body: {
                appendChild: jest.fn()
            },
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
            innerHeight: 768,
            requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
            cancelAnimationFrame: jest.fn(),
            navigator: { connection: null }
        };

        // Mock leaves container
        mockLeavesContainer = {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        };

        // Mock leaves
        const mockLeaves = Array.from({ length: 6 }, (_, i) => ({
            style: {
                left: `${i * 15 + 10}%`,
                top: '-30px',
                transform: ''
            },
            getBoundingClientRect: jest.fn(() => ({
                left: i * 100 + 50,
                top: 100,
                width: 20,
                height: 20
            }))
        }));

        document.querySelector.mockImplementation(selector => {
            if (selector === '.leaves-container') return mockLeavesContainer;
            if (selector === '.pause-btn') return { addEventListener: jest.fn() };
            return null;
        });

        document.querySelectorAll.mockImplementation(selector => {
            if (selector === '.leaf') return mockLeaves;
            return [];
        });

        document.createElement.mockReturnValue({
            className: '',
            style: { cssText: '' },
            getBoundingClientRect: jest.fn(() => ({ left: 50, top: 100, width: 20, height: 20 }))
        });

        global.getComputedStyle = jest.fn(() => ({
            left: '10%',
            top: '-30px',
            display: 'block'
        }));

        // Import after mocking
        FallenLeavesController = require('../assets/js/main.js');
        controller = new FallenLeavesController();
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (controller.leafGenerationTimer) {
            clearInterval(controller.leafGenerationTimer);
        }
        if (controller.animationFrame) {
            cancelAnimationFrame(controller.animationFrame);
        }
    });

    describe('Mouse Interaction', () => {
        test('should track mouse position on mousemove', () => {
            const mouseEvent = {
                clientX: 100,
                clientY: 200,
                movementX: 5,
                movementY: -3
            };

            controller.handleMouseMove(mouseEvent);

            expect(controller.mousePosition.x).toBe(100);
            expect(controller.mousePosition.y).toBe(200);
        });

        test('should create wind force based on mouse movement', () => {
            const mouseEvent = {
                clientX: 100,
                clientY: 200,
                movementX: 10,
                movementY: -5
            };

            controller.handleMouseMove(mouseEvent);

            expect(controller.windForce.x).toBe(1); // 10 * 0.1
            expect(controller.windForce.y).toBe(-0.25); // -5 * 0.05
        });

        test('should detect leaf interaction within radius', () => {
            controller.mousePosition = { x: 60, y: 110 }; // Close to first leaf
            
            controller.checkLeafInteraction();

            const firstLeaf = controller.leaves[0];
            expect(firstLeaf.isInteractive).toBe(true);
        });

        test('should apply force to leaves during interaction', () => {
            controller.mousePosition = { x: 60, y: 110 };
            const initialVelocityX = controller.leaves[0].velocityX;
            const initialVelocityY = controller.leaves[0].velocityY;
            
            controller.checkLeafInteraction();

            expect(controller.leaves[0].velocityX).not.toBe(initialVelocityX);
            expect(controller.leaves[0].velocityY).not.toBe(initialVelocityY);
        });

        test('should handle touch events', () => {
            const touchEvent = {
                touches: [{
                    clientX: 150,
                    clientY: 250
                }]
            };

            controller.handleTouchStart(touchEvent);
            expect(controller.mousePosition.x).toBe(150);
            expect(controller.mousePosition.y).toBe(250);
        });
    });

    describe('Physics Simulation', () => {
        test('should apply gravity to leaves', () => {
            const leaf = controller.leaves[0];
            const initialVelocityY = leaf.velocityY;
            
            controller.updateLeaves();

            expect(leaf.velocityY).toBeGreaterThan(initialVelocityY);
        });

        test('should apply wind force to leaves', () => {
            controller.windForce = { x: 2, y: 1 };
            const leaf = controller.leaves[0];
            const initialVelocityX = leaf.velocityX;
            
            controller.updateLeaves();

            expect(leaf.velocityX).toBeGreaterThan(initialVelocityX);
        });

        test('should apply air resistance', () => {
            const leaf = controller.leaves[0];
            leaf.velocityX = 10;
            leaf.velocityY = 10;
            
            controller.updateLeaves();

            expect(leaf.velocityX).toBeLessThan(10);
            expect(leaf.velocityY).toBeLessThan(10);
        });

        test('should reset leaves when they fall off screen', () => {
            const leaf = controller.leaves[0];
            leaf.y = window.innerHeight + 100; // Off screen
            const initialY = leaf.y;
            
            controller.updateLeaves();

            expect(leaf.y).toBeLessThan(initialY); // Should be reset to top
        });

        test('should update leaf transforms', () => {
            const leaf = controller.leaves[0];
            leaf.x = 100;
            leaf.y = 200;
            leaf.rotation = 45;
            leaf.scale = 0.8;
            
            controller.updateLeaves();

            expect(leaf.element.style.transform).toContain('translate(100px, 200px)');
            expect(leaf.element.style.transform).toContain('rotate(45deg)');
            expect(leaf.element.style.transform).toContain('scale(0.8)');
        });
    });

    describe('Dynamic Leaf Generation', () => {
        test('should generate new leaves periodically', (done) => {
            controller.maxLeaves = 10;
            controller.leaves = controller.leaves.slice(0, 5); // Start with fewer leaves
            
            controller.startLeafGeneration();

            setTimeout(() => {
                // Check if generation timer was set
                expect(controller.leafGenerationTimer).toBeTruthy();
                done();
            }, 100);
        });

        test('should create new leaf element', () => {
            const initialLeafCount = controller.leaves.length;
            
            controller.generateNewLeaf();

            expect(controller.leaves.length).toBe(initialLeafCount + 1);
            expect(mockLeavesContainer.appendChild).toHaveBeenCalled();
        });

        test('should not exceed maximum leaf count', () => {
            controller.maxLeaves = 5;
            controller.leaves = new Array(5).fill().map(() => ({ isDynamic: true }));
            
            controller.generateNewLeaf();

            // Should not generate if at max capacity
            expect(controller.leaves.length).toBeLessThanOrEqual(controller.maxLeaves);
        });

        test('should cleanup old dynamic leaves', () => {
            const oldLeaf = {
                isDynamic: true,
                createdAt: Date.now() - 70000, // 70 seconds ago
                element: { parentNode: { removeChild: jest.fn() } }
            };
            
            controller.leaves.push(oldLeaf);
            const initialCount = controller.leaves.length;
            
            controller.cleanupOldLeaves();

            expect(controller.leaves.length).toBeLessThan(initialCount);
        });

        test('should adjust leaf count based on device', () => {
            // Test mobile
            window.innerWidth = 500;
            controller.adjustLeafGeneration();
            expect(controller.maxLeaves).toBe(6);

            // Test desktop
            window.innerWidth = 1200;
            controller.adjustLeafGeneration();
            expect(controller.maxLeaves).toBe(12);
        });

        test('should stop leaf generation when paused', () => {
            controller.startLeafGeneration();
            const timerId = controller.leafGenerationTimer;
            
            controller.pauseAnimation();

            expect(controller.leafGenerationTimer).toBeNull();
        });
    });

    describe('Interactive Mode', () => {
        test('should enter interactive mode on mouse enter', () => {
            controller.handleMouseEnter();
            
            controller.leaves.forEach(leaf => {
                expect(leaf.element.style.animationPlayState).toBe('paused');
            });
        });

        test('should exit interactive mode on mouse leave', () => {
            controller.isAnimationPaused = false;
            controller.handleMouseLeave();
            
            controller.leaves.forEach(leaf => {
                expect(leaf.element.style.animationPlayState).toBe('running');
            });
        });

        test('should reset wind force on mouse leave', () => {
            controller.windForce = { x: 5, y: 3 };
            
            controller.handleMouseLeave();

            expect(controller.windForce.x).toBe(0);
            expect(controller.windForce.y).toBe(0);
        });
    });

    describe('Touch Ripple Effect', () => {
        test('should create ripple element on touch', () => {
            const mockRipple = {
                className: '',
                style: { cssText: '' }
            };
            document.createElement.mockReturnValue(mockRipple);
            
            controller.createRippleEffect(100, 200);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockRipple.className).toBe('touch-ripple');
            expect(document.body.appendChild).toHaveBeenCalledWith(mockRipple);
        });

        test('should position ripple at touch coordinates', () => {
            const mockRipple = {
                className: '',
                style: { cssText: '' }
            };
            document.createElement.mockReturnValue(mockRipple);
            
            controller.createRippleEffect(150, 250);

            expect(mockRipple.style.cssText).toContain('left: 125px'); // 150 - 25
            expect(mockRipple.style.cssText).toContain('top: 225px');  // 250 - 25
        });
    });

    describe('Performance Optimization', () => {
        test('should reduce leaf count on low FPS', () => {
            const visibleLeaves = controller.leaves.filter(() => true);
            const initialCount = visibleLeaves.length;
            
            controller.reduceLeafCount();

            // Should hide some leaves for performance
            expect(controller.leaves.some(leaf => 
                leaf.element.style.display === 'none'
            )).toBe(true);
        });

        test('should adjust settings for low power mode', () => {
            window.navigator.connection = { saveData: true };
            
            controller.adjustLeafGeneration();

            expect(controller.maxLeaves).toBe(6); // Reduced for low power
        });
    });

    describe('Animation Frame Management', () => {
        test('should start animation frame loop', () => {
            controller.startInteractiveAnimation();
            
            expect(window.requestAnimationFrame).toHaveBeenCalled();
        });

        test('should cancel animation frame on pause', () => {
            controller.animationFrame = 123;
            
            controller.pauseAnimation();

            expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
        });

        test('should not start animation if reduced motion is preferred', () => {
            window.matchMedia.mockReturnValue({
                matches: true, // prefers-reduced-motion: reduce
                addEventListener: jest.fn()
            });
            
            controller.startInteractiveAnimation();

            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        });
    });
});