/**
 * Jest Setup File
 * Global test configuration and mocks
 */

const fs = require('fs');
const path = require('path');

// Load the actual HTML file for DOM tests  
const htmlPath = path.join(__dirname, '..', 'index.html');
let htmlContent = '';
try {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
    console.log('Loaded HTML content for testing');
} catch (e) {
    console.warn('Could not load index.html for testing:', e.message);
}

// Mock console methods to reduce test noise
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
};

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock CSS getComputedStyle
global.getComputedStyle = jest.fn(() => ({
    getPropertyValue: jest.fn(),
    display: 'block',
    position: 'absolute',
    width: '20px',
    height: '20px',
    left: '10%',
    top: '-30px',
    animationPlayState: 'running'
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Setup DOM testing utilities
beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up basic DOM if HTML is available
    if (htmlContent && htmlContent.includes('<body>')) {
        // Extract body content from HTML
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/);
        if (bodyMatch) {
            document.body.innerHTML = bodyMatch[1];
        }
        
        // Extract head content for meta tags
        const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*)<\/head>/);
        if (headMatch) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = headMatch[1];
            const metaTags = tempDiv.querySelectorAll('meta');
            metaTags.forEach(meta => {
                document.head.appendChild(meta.cloneNode(true));
            });
        }
    } else {
        // Fallback: create basic DOM structure for testing
        document.body.innerHTML = `
            <main class="scene">
                <header class="hero">
                    <h1 class="hero__title">落ち葉が舞い散る</h1>
                    <p class="hero__subtitle">自然の美しさを感じる瞬間</p>
                </header>
                <div class="leaves-container" aria-label="舞い散る落ち葉のアニメーション">
                    <div class="leaf"></div>
                    <div class="leaf"></div>
                    <div class="leaf"></div>
                    <div class="leaf"></div>
                    <div class="leaf"></div>
                    <div class="leaf"></div>
                </div>
                <section class="content">
                    <div class="content__inner">
                        <h2>秋の詩</h2>
                        <p>風に舞う落ち葉は、季節の移ろいを静かに物語る。</p>
                    </div>
                </section>
                <div class="animation-controls" role="region" aria-label="アニメーション制御">
                    <button class="pause-btn" type="button" aria-label="アニメーションを一時停止">
                        <span class="pause-btn__icon">⏸</span>
                        <span class="pause-btn__text">一時停止</span>
                    </button>
                </div>
            </main>
        `;
        
        // Add meta tags to head
        const metaTags = [
            { name: 'charset', content: 'UTF-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
            { name: 'description', content: '美しく舞い散る落ち葉を表現したウェブサイト' }
        ];
        
        metaTags.forEach(({ name, content }) => {
            const meta = document.createElement('meta');
            if (name === 'charset') {
                meta.setAttribute('charset', content);
            } else {
                meta.setAttribute('name', name);
                meta.setAttribute('content', content);
            }
            document.head.appendChild(meta);
        });
    }
    
    // Mock document.documentElement.style
    if (!document.documentElement.style.setProperty) {
        document.documentElement.style.setProperty = jest.fn();
    }
});

afterEach(() => {
    // Clean up DOM
    document.documentElement.innerHTML = '';
    // Note: Don't restore all mocks as it breaks jest functionality
});