// Fallen Leaves Animation Controller - Pure JavaScript Implementation
class FallenLeavesController {
    constructor() {
        this.isAnimationPaused = false;
        this.pauseBtn = document.querySelector('.pause-btn');
        this.root = document.documentElement;
        this.leaves = [];
        this.mousePosition = { x: 0, y: 0 };
        this.windForce = { x: 0, y: 0 };
        this.animationFrame = null;
        this.leavesContainer = document.querySelector('.leaves-container');
        this.maxLeaves = 20;
        this.leafGenerationTimer = null;
        this.leafGenerationInterval = null;
        this.leafColors = ['#cd853f', '#daa520', '#ff8c00', '#dc143c', '#b8860b', '#8b4513', '#d2b48c', '#daa520', '#ff7f50'];
        this.mouseActive = false;
        this.startTime = performance.now();
        this.showMouseInfluence = false; // Debug flag to show mouse influence circle
        this.mouseInfluenceElement = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkReducedMotion();
        this.optimizeForDevice();
        this.initializeLeaves();
        this.createMouseInfluenceIndicator();
        this.startPureJSAnimation();
        this.startLeafGeneration();
        this.adjustLeafGeneration();
    }

    setupEventListeners() {
        // Animation pause/resume control
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.toggleAnimation());
            
            // Keyboard accessibility
            this.pauseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleAnimation();
                }
            });
        }

        // Page Visibility API - pause when tab is inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else if (!this.isAnimationPaused) {
                this.resumeAnimation();
            }
        });

        // Handle reduced motion preference changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', () => this.checkReducedMotion());

        // Mouse tracking for interactive effects
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseenter', () => this.handleMouseEnter());
        document.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        // Add mouse idle detection
        this.mouseIdleTimer = null;

        // Touch support for mobile
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        
        // Add keyboard shortcut to toggle mouse influence indicator (for debugging)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                this.toggleMouseInfluenceIndicator();
            }
        });
    }

    toggleAnimation() {
        if (this.isAnimationPaused) {
            this.resumeAnimation();
        } else {
            this.pauseAnimation();
        }
    }

    pauseAnimation() {
        this.root.style.setProperty('--animation-play-state', 'paused');
        this.isAnimationPaused = true;
        this.updatePauseButton('▶', '再生');
    }

    resumeAnimation() {
        this.root.style.setProperty('--animation-play-state', 'running');
        this.isAnimationPaused = false;
        this.updatePauseButton('⏸', '一時停止');
    }

    updatePauseButton(icon, text) {
        if (this.pauseBtn) {
            const iconEl = this.pauseBtn.querySelector('.pause-btn__icon');
            const textEl = this.pauseBtn.querySelector('.pause-btn__text');
            
            if (iconEl) iconEl.textContent = icon;
            if (textEl) textEl.textContent = text;
            
            this.pauseBtn.setAttribute('aria-label', `アニメーションを${text}`);
        }
    }

    checkReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            this.pauseAnimation();
            // Hide animation controls if user prefers reduced motion
            if (this.pauseBtn) {
                this.pauseBtn.style.display = 'none';
            }
        }
    }

    optimizeForDevice() {
        // Reduce animations on mobile devices for battery saving
        const isMobile = window.innerWidth <= 768;
        const isLowPowerMode = navigator.connection && navigator.connection.saveData;
        
        if (isMobile || isLowPowerMode) {
            // Reduce animation frequency
            this.root.style.setProperty('--leaf-fall-duration', '12s');
            this.root.style.setProperty('--leaf-sway-duration', '5s');
        }

        // Performance monitoring
        this.monitorPerformance();
    }

    monitorPerformance() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // If FPS drops below 20, reduce animation quality
                if (fps < 20) {
                    this.root.style.setProperty('--leaf-fall-duration', '15s');
                    console.warn('Low FPS detected, reducing animation quality');
                    this.reduceLeafCount();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (!this.isAnimationPaused) {
                requestAnimationFrame(checkFPS);
            }
        };
        
        // Start monitoring only if animations are enabled
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            requestAnimationFrame(checkFPS);
        }
    }

    // Initialize leaf data for pure JavaScript animations
    initializeLeaves() {
        const leafElements = document.querySelectorAll('.leaf');
        this.leaves = Array.from(leafElements).map((element, index) => {
            // Calculate starting position from CSS left percentage
            const computedStyle = getComputedStyle(element);
            const leftPercent = parseFloat(computedStyle.left) || (10 + index * 15);
            const actualX = (leftPercent / 100) * window.innerWidth;
            
            // Disable CSS animations completely
            element.style.animation = 'none';
            element.style.position = 'absolute';
            
            const leaf = {
                element,
                id: index,
                x: actualX,
                y: -50 - Math.random() * 100, // Start off-screen
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 1.2, // More varied rotation
                scale: 0.7 + Math.random() * 0.6, // More size variety
                mass: 0.4 + Math.random() * 0.8, // Wider mass range affects motion
                originalX: actualX,
                baseSwayAmplitude: 20 + Math.random() * 25, // More varied sway amplitude
                baseFallSpeed: 0.6 + Math.random() * 0.8, // More varied fall speeds
                personalityX: (Math.random() - 0.5) * 0.4, // Stronger horizontal personality
                personalityRotation: (Math.random() - 0.5) * 1.2, // More rotation personality
                phase: Math.random() * Math.PI * 2, // For sine wave motion
                cycleOffset: Math.random() * 3000, // Stagger natural cycles
                // Enhanced personality traits
                swayPersonality: 0.5 + Math.random() * 1.0, // How much each leaf sways
                fallPersonality: 0.7 + Math.random() * 0.6, // Falling behavior modifier
                turbulenceResistance: Math.random(), // How much air turbulence affects this leaf
            };
            
            console.log(`Leaf ${index} initialized at x=${actualX.toFixed(1)}, starting y=${leaf.y}`);
            return leaf;
        });
    }

    // Start pure JavaScript animation (no CSS/JS switching)
    startPureJSAnimation() {
        if (this.isAnimationPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const animate = (timestamp) => {
            this.updateWindForce();
            this.updateAllLeaves(timestamp);
            
            if (!this.isAnimationPaused) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    // Handle mouse movement for subtle wind effects
    handleMouseMove(e) {
        if (this.isAnimationPaused) return;

        this.mouseActive = true;
        this.mousePosition.x = e.clientX;
        this.mousePosition.y = e.clientY;

        // Create gentle wind effect based on mouse movement
        const deltaX = e.movementX || 0;
        const deltaY = e.movementY || 0;
        
        // Much more subtle wind forces
        this.windForce.x = Math.max(-2, Math.min(2, deltaX * 0.05)); // Reduced from 0.15
        this.windForce.y = Math.max(-1, Math.min(1, deltaY * 0.02)); // Reduced from 0.08

        // Reset mouse idle timer
        if (this.mouseIdleTimer) {
            clearTimeout(this.mouseIdleTimer);
        }
        
        // Set timer to reduce mouse influence after 3 seconds of no movement
        this.mouseIdleTimer = setTimeout(() => {
            this.mouseActive = false;
            this.windForce.x = 0;
            this.windForce.y = 0;
        }, 3000);

        // Update mouse influence indicator position
        this.updateMouseInfluenceIndicator();
        
        // Debug output (reduced frequency)
        if (Math.random() < 0.01) {
            console.log('Gentle wind:', {
                windX: this.windForce.x.toFixed(2), 
                windY: this.windForce.y.toFixed(2)
            });
        }
    }

    handleMouseEnter() {
        console.log('Mouse entered page');
        this.mouseActive = true;
    }

    handleMouseLeave() {
        console.log('Mouse left page');
        this.mouseActive = false;
        this.windForce.x = 0;
        this.windForce.y = 0;
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.mousePosition.x = touch.clientX;
            this.mousePosition.y = touch.clientY;
            // Touch creates gentle wind effect similar to mouse
            this.mouseActive = true;
        }
    }

    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.mousePosition.x = touch.clientX;
            this.mousePosition.y = touch.clientY;
            this.createRippleEffect(touch.clientX, touch.clientY);
        }
    }

    // Simplified leaf interaction - no individual leaf targeting
    // Global wind effect is sufficient for natural movement

    // Update wind force (gentle decay only)
    updateWindForce() {
        // Gradual wind decay for smooth transitions
        this.windForce.x *= 0.96;
        this.windForce.y *= 0.96;
        
        // No random wind - keep motion predictable and elegant
    }

    // Update all leaves with gentle, natural motion and mouse avoidance behavior
    updateAllLeaves(timestamp) {
        const time = (timestamp - this.startTime) * 0.001; // Time in seconds
        const mouseInfluenceRadius = 120; // Pixel radius around mouse for avoidance
        const avoidanceRadius = 80; // Inner radius for stronger avoidance
        
        this.leaves.forEach((leaf, index) => {
            // Enhanced natural motion with multiple wave frequencies
            const swayTime = time * 0.5 + leaf.phase;
            const secondarySwayTime = time * 0.3 + leaf.phase * 1.7; // Different frequency
            const tertiarySwayTime = time * 0.8 + leaf.phase * 0.6; // Third harmonic
            
            // Combine multiple sine waves for complex, natural movement with personality
            const primarySway = Math.sin(swayTime) * 0.8 * leaf.swayPersonality;
            const secondaryWave = Math.sin(secondarySwayTime) * 0.4 * leaf.swayPersonality;
            const tertiaryWave = Math.sin(tertiarySwayTime) * 0.2 * leaf.swayPersonality;
            const naturalSway = primarySway + secondaryWave + tertiaryWave;
            
            // Add vertical oscillation for more natural falling (wind resistance effect)
            const verticalWave = Math.sin(time * 0.7 + leaf.phase * 2) * 0.3 * leaf.fallPersonality;
            const turbulenceEffect = Math.sin(time * 1.5 + leaf.phase * 4) * 0.1 * leaf.turbulenceResistance;
            const fallSpeed = leaf.baseFallSpeed * (1 + verticalWave + turbulenceEffect) * leaf.fallPersonality;
            
            leaf.y += fallSpeed;
            
            // Base horizontal position with enhanced natural sway and personality
            let targetX = leaf.originalX + naturalSway * leaf.baseSwayAmplitude + leaf.personalityX * 50;
            let avoidanceVelocityX = 0;
            let avoidanceVelocityY = 0;
            
            // Calculate distance from mouse if mouse is active
            let mouseInfluence = 0;
            if (this.mouseActive) {
                const leafCenterX = leaf.x;
                const leafCenterY = leaf.y;
                
                const distanceFromMouse = Math.sqrt(
                    Math.pow(this.mousePosition.x - leafCenterX, 2) + 
                    Math.pow(this.mousePosition.y - leafCenterY, 2)
                );
                
                // Mouse avoidance behavior
                if (distanceFromMouse < mouseInfluenceRadius) {
                    mouseInfluence = 1 - (distanceFromMouse / mouseInfluenceRadius);
                    
                    // Calculate angle from mouse to leaf (away from mouse)
                    const avoidanceAngle = Math.atan2(
                        leafCenterY - this.mousePosition.y,
                        leafCenterX - this.mousePosition.x
                    );
                    
                    // Stronger avoidance when very close
                    let avoidanceStrength = mouseInfluence;
                    if (distanceFromMouse < avoidanceRadius) {
                        const innerInfluence = 1 - (distanceFromMouse / avoidanceRadius);
                        avoidanceStrength = mouseInfluence + innerInfluence * 2; // Double strength in inner zone
                    }
                    
                    // Calculate avoidance velocity
                    avoidanceVelocityX = Math.cos(avoidanceAngle) * avoidanceStrength * 2.5;
                    avoidanceVelocityY = Math.sin(avoidanceAngle) * avoidanceStrength * 1.2;
                    
                    // Add some chaotic flutter when very close (like being startled)
                    if (distanceFromMouse < 60) {
                        const flutterIntensity = (60 - distanceFromMouse) / 60;
                        avoidanceVelocityX += (Math.random() - 0.5) * flutterIntensity * 3;
                        avoidanceVelocityY += (Math.random() - 0.5) * flutterIntensity * 2;
                        
                        // Rapid spinning when startled
                        leaf.rotationSpeed += flutterIntensity * 8 * (Math.random() - 0.5);
                    }
                    
                    // Apply wind effect (reduced when avoiding)
                    const windInfluence = mouseInfluence * (1 - avoidanceStrength * 0.3);
                    const localWindX = this.windForce.x * windInfluence * 0.3;
                    const localWindY = this.windForce.y * windInfluence * 0.15;
                    
                    avoidanceVelocityX += localWindX;
                    avoidanceVelocityY += localWindY;
                    
                    // Increase rotation based on avoidance intensity
                    leaf.rotationSpeed += avoidanceStrength * 0.8;
                }
            }
            
            // Apply avoidance to target position
            targetX += avoidanceVelocityX;
            leaf.y += avoidanceVelocityY;
            
            // Smooth transition to target X position with some momentum
            if (!leaf.momentum) leaf.momentum = { x: 0, y: 0 };
            leaf.momentum.x += (targetX - leaf.x) * 0.15;
            leaf.momentum.y += avoidanceVelocityY * 0.3;
            
            // Apply momentum with decay
            leaf.x += leaf.momentum.x;
            leaf.y += leaf.momentum.y * 0.5; // Reduced vertical momentum
            
            leaf.momentum.x *= 0.85; // Momentum decay
            leaf.momentum.y *= 0.9;
            
            // Enhanced natural rotation with air resistance simulation and personality
            const rotationWave = Math.sin(time * 0.6 + leaf.phase * 3) * 0.3 * leaf.personalityRotation;
            const airResistance = Math.sin(time * 1.2 + leaf.phase * 0.8) * 0.15 * leaf.turbulenceResistance;
            
            // Natural rotation varies based on falling speed, air currents, and leaf personality
            const naturalRotationSpeed = leaf.rotationSpeed + rotationWave + airResistance;
            leaf.rotation += naturalRotationSpeed * 0.7 * leaf.personalityRotation;
            leaf.rotationSpeed *= (0.92 + leaf.turbulenceResistance * 0.03); // Personality affects decay rate
            
            // Boundary checks
            if (leaf.y > window.innerHeight + 100) {
                if (leaf.isDynamic) {
                    this.removeLeaf(leaf);
                    return;
                } else {
                    this.resetLeaf(leaf);
                }
            }
            
            // Keep leaves on screen horizontally (gentle bounds)
            if (leaf.x < -30) {
                leaf.x = -25;
                leaf.momentum.x = Math.max(0, leaf.momentum.x); // Stop leftward momentum
            } else if (leaf.x > window.innerWidth + 30) {
                leaf.x = window.innerWidth + 25;
                leaf.momentum.x = Math.min(0, leaf.momentum.x); // Stop rightward momentum
            }
            
            // Apply transform with subtle breathing effect
            const scaleBreathing = 1 + Math.sin(time * 0.8 + leaf.id) * 0.02;
            // Slight shrinking when avoiding (like being compressed by air pressure)
            const avoidanceScale = 1 - mouseInfluence * 0.08;
            leaf.element.style.transform = `
                translate(${leaf.x}px, ${leaf.y}px) 
                rotate(${leaf.rotation}deg) 
                scale(${leaf.scale * scaleBreathing * avoidanceScale})
            `;
            
            // Debug output occasionally
            if (index === 0 && Math.random() < 0.005) {
                console.log(`Leaf 0: x=${leaf.x.toFixed(1)}, y=${leaf.y.toFixed(1)}, avoidance=${mouseInfluence.toFixed(2)}`);
            }
        });
    }

    // Reset leaf to top of screen with natural parameters
    resetLeaf(leaf) {
        leaf.y = -50 - Math.random() * 100;
        leaf.x = leaf.originalX; // Reset to original horizontal position
        leaf.rotation = Math.random() * 360;
        leaf.rotationSpeed = (Math.random() - 0.5) * 1.2;
        leaf.phase = Math.random() * Math.PI * 2;
        leaf.baseFallSpeed = 0.6 + Math.random() * 0.8;
        leaf.momentum = { x: 0, y: 0 };
        // Reset personality traits
        leaf.swayPersonality = 0.5 + Math.random() * 1.0;
        leaf.fallPersonality = 0.7 + Math.random() * 0.6;
        leaf.turbulenceResistance = Math.random();
    }

    // Remove a specific leaf from the system
    removeLeaf(leafToRemove) {
        // Remove from DOM
        if (leafToRemove.element && leafToRemove.element.parentNode) {
            leafToRemove.element.parentNode.removeChild(leafToRemove.element);
        }
        
        // Remove from leaves array
        this.leaves = this.leaves.filter(leaf => leaf.id !== leafToRemove.id);
    }

    // Create ripple effect on touch
    createRippleEffect(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.cssText = `
            position: fixed;
            left: ${x - 25}px;
            top: ${y - 25}px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9999;
            animation: ripple-expand 0.6s ease-out forwards;
        `;
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // Create mouse influence indicator circles
    createMouseInfluenceIndicator() {
        // Outer avoidance radius
        this.mouseInfluenceElement = document.createElement('div');
        this.mouseInfluenceElement.style.cssText = `
            position: fixed;
            width: 240px;
            height: 240px;
            border: 2px solid rgba(255, 200, 100, 0.4);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            display: none;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(this.mouseInfluenceElement);
        
        // Inner strong avoidance radius
        this.mouseInnerInfluenceElement = document.createElement('div');
        this.mouseInnerInfluenceElement.style.cssText = `
            position: fixed;
            width: 160px;
            height: 160px;
            border: 2px solid rgba(255, 150, 150, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            display: none;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(this.mouseInnerInfluenceElement);
        
        // Very close flutter zone
        this.mouseFlutterElement = document.createElement('div');
        this.mouseFlutterElement.style.cssText = `
            position: fixed;
            width: 120px;
            height: 120px;
            border: 2px dashed rgba(255, 100, 100, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            display: none;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            animation: flutter-zone 1s ease-in-out infinite alternate;
        `;
        document.body.appendChild(this.mouseFlutterElement);
        
        // Add CSS animation for flutter zone
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flutter-zone {
                0% { transform: translate(-50%, -50%) scale(1); }
                100% { transform: translate(-50%, -50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }

    // Toggle mouse influence indicator visibility
    toggleMouseInfluenceIndicator() {
        this.showMouseInfluence = !this.showMouseInfluence;
        const displayStyle = this.showMouseInfluence ? 'block' : 'none';
        
        this.mouseInfluenceElement.style.display = displayStyle;
        this.mouseInnerInfluenceElement.style.display = displayStyle;
        this.mouseFlutterElement.style.display = displayStyle;
        
        console.log('Mouse avoidance zones:', this.showMouseInfluence ? 'ON (Press M to hide)' : 'OFF (Press M to show)');
        if (this.showMouseInfluence) {
            console.log('🟡 Yellow: Gentle avoidance zone');
            console.log('🔴 Red: Strong avoidance zone'); 
            console.log('⭕ Dashed red: Flutter panic zone');
        }
    }

    // Update mouse influence indicator position
    updateMouseInfluenceIndicator() {
        if (this.showMouseInfluence && this.mouseActive) {
            const x = this.mousePosition.x + 'px';
            const y = this.mousePosition.y + 'px';
            
            this.mouseInfluenceElement.style.left = x;
            this.mouseInfluenceElement.style.top = y;
            this.mouseInfluenceElement.style.opacity = '0.6';
            
            this.mouseInnerInfluenceElement.style.left = x;
            this.mouseInnerInfluenceElement.style.top = y;
            this.mouseInnerInfluenceElement.style.opacity = '0.7';
            
            this.mouseFlutterElement.style.left = x;
            this.mouseFlutterElement.style.top = y;
            this.mouseFlutterElement.style.opacity = '0.8';
        } else if (this.showMouseInfluence) {
            this.mouseInfluenceElement.style.opacity = '0';
            this.mouseInnerInfluenceElement.style.opacity = '0';
            this.mouseFlutterElement.style.opacity = '0';
        }
    }

    reduceLeafCount() {
        // Hide some leaves for performance
        const visibleLeaves = this.leaves.filter(leaf => 
            getComputedStyle(leaf.element).display !== 'none'
        );
        
        if (visibleLeaves.length > 3) {
            const leafToHide = visibleLeaves[visibleLeaves.length - 1];
            leafToHide.element.style.display = 'none';
        }
    }

    // Start dynamic leaf generation with multiple timers for continuous effect
    startLeafGeneration() {
        if (this.isAnimationPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        // Primary generation timer - more frequent
        this.leafGenerationTimer = setInterval(() => {
            if (this.leaves.length < this.maxLeaves && !this.isAnimationPaused) {
                this.generateNewLeaf();
            }
        }, 800 + Math.random() * 1200); // Generate every 0.8-2 seconds

        // Secondary burst generation for more natural feel
        this.leafGenerationInterval = setInterval(() => {
            if (!this.isAnimationPaused && Math.random() < 0.7) { // 70% chance
                const burstCount = Math.floor(Math.random() * 3) + 1; // 1-3 leaves
                for (let i = 0; i < burstCount; i++) {
                    if (this.leaves.length < this.maxLeaves) {
                        setTimeout(() => {
                            if (!this.isAnimationPaused) {
                                this.generateNewLeaf();
                            }
                        }, i * 200); // Stagger burst leaves by 200ms
                    }
                }
            }
        }, 4000 + Math.random() * 3000); // Burst every 4-7 seconds
    }

    // Generate a new leaf element with more variety
    generateNewLeaf() {
        const leafElement = document.createElement('div');
        leafElement.className = 'leaf dynamic-leaf';
        
        const colorIndex = Math.floor(Math.random() * this.leafColors.length);
        const size = 14 + Math.random() * 16;
        const startX = Math.random() * (window.innerWidth + 200) - 100;
        const startY = -50 - Math.random() * 100;
        
        leafElement.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${this.leafColors[colorIndex]};
            border-radius: 0 100% 0 100%;
            clip-path: polygon(50% 0%, 0% 35%, 15% 100%, 85% 100%, 100% 35%);
            pointer-events: none;
            z-index: 1000;
            opacity: 1;
            filter: brightness(${0.85 + Math.random() * 0.3}) hue-rotate(${Math.random() * 30 - 15}deg);
        `;

        this.leavesContainer.appendChild(leafElement);

        // Create leaf data object with gentle, natural parameters
        const newLeaf = {
            element: leafElement,
            id: Date.now() + Math.random(),
            x: startX,
            y: startY,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 1, // Gentler rotation
            scale: 0.7 + Math.random() * 0.6,
            mass: 0.4 + Math.random() * 0.8,
            originalX: startX,
            baseSwayAmplitude: 20 + Math.random() * 25,
            baseFallSpeed: 0.6 + Math.random() * 0.8,
            isDynamic: true,
            createdAt: Date.now(),
            personalityX: (Math.random() - 0.5) * 0.4,
            personalityRotation: (Math.random() - 0.5) * 1.2,
            phase: Math.random() * Math.PI * 2,
            cycleOffset: Math.random() * 3000,
            // Enhanced personality traits for dynamic leaves
            swayPersonality: 0.5 + Math.random() * 1.0,
            fallPersonality: 0.7 + Math.random() * 0.6,
            turbulenceResistance: Math.random()
        };

        this.leaves.push(newLeaf);
        this.cleanupOldLeaves();
    }

    // Remove old dynamic leaves that have been around too long
    cleanupOldLeaves() {
        const currentTime = Date.now();
        const maxAge = 60000; // 1 minute

        this.leaves = this.leaves.filter(leaf => {
            if (leaf.isDynamic && (currentTime - leaf.createdAt) > maxAge) {
                // Remove from DOM
                if (leaf.element.parentNode) {
                    leaf.element.parentNode.removeChild(leaf.element);
                }
                return false;
            }
            return true;
        });
    }

    // Stop leaf generation
    stopLeafGeneration() {
        if (this.leafGenerationTimer) {
            clearInterval(this.leafGenerationTimer);
            this.leafGenerationTimer = null;
        }
        if (this.leafGenerationInterval) {
            clearInterval(this.leafGenerationInterval);
            this.leafGenerationInterval = null;
        }
    }

    // Enhanced pause animation to handle dynamic leaves
    pauseAnimation() {
        this.root.style.setProperty('--animation-play-state', 'paused');
        this.isAnimationPaused = true;
        this.updatePauseButton('▶', '再生');
        
        // Stop generating new leaves
        this.stopLeafGeneration();
        
        // Cancel animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Enhanced resume animation
    resumeAnimation() {
        this.root.style.setProperty('--animation-play-state', 'running');
        this.isAnimationPaused = false;
        this.updatePauseButton('⏸', '一時停止');
        
        // Restart leaf generation
        this.startLeafGeneration();
        
        // Restart pure JavaScript animation
        this.startPureJSAnimation();
    }

    // Adjust leaf generation based on device performance
    adjustLeafGeneration() {
        const isMobile = window.innerWidth <= 768;
        const isLowPowerMode = navigator.connection && navigator.connection.saveData;
        
        if (isMobile || isLowPowerMode) {
            this.maxLeaves = 10; // Increased for mobile too
        } else if (window.innerWidth > 1400) {
            this.maxLeaves = 25; // More leaves for large screens
        } else {
            this.maxLeaves = 20;
        }
        
        // Remove excess leaves if over limit
        while (this.leaves.length > this.maxLeaves) {
            const leafToRemove = this.leaves.pop();
            this.removeLeaf(leafToRemove);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FallenLeavesController();
    });
} else {
    new FallenLeavesController();
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Fallen Leaves Animation Error:', e.error);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallenLeavesController;
}