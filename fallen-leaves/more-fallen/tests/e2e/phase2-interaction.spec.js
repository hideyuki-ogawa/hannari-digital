const { test, expect } = require('@playwright/test');

test.describe('Phase 2 Interactive Features', () => {
  
  test('should respond to mouse movement with wind effects', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial leaf position
    const initialPosition = await page.locator('.leaf:nth-of-type(1)').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    
    // Move mouse across the screen to create wind effect
    await page.mouse.move(100, 100);
    await page.mouse.move(500, 200, { steps: 10 });
    
    // Wait for animation to respond
    await page.waitForTimeout(1000);
    
    // Check if leaf position changed due to wind effect
    const newPosition = await page.locator('.leaf:nth-of-type(1)').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    });
    
    // Position should be different (wind effect applied)
    expect(Math.abs(newPosition.x - initialPosition.x) + Math.abs(newPosition.y - initialPosition.y)).toBeGreaterThan(5);
  });

  test('should create ripple effect on touch', async ({ page }) => {
    await page.goto('/');
    
    // Simulate touch
    await page.touchscreen.tap(300, 400);
    
    // Check if ripple element is created
    const ripple = page.locator('.touch-ripple');
    await expect(ripple).toBeVisible();
    
    // Ripple should fade out
    await page.waitForTimeout(700);
    await expect(ripple).not.toBeVisible();
  });

  test('should generate new leaves dynamically', async ({ page }) => {
    await page.goto('/');
    
    // Count initial leaves
    const initialCount = await page.locator('.leaf').count();
    
    // Wait for potential new leaf generation (up to 6 seconds)
    await page.waitForTimeout(6000);
    
    // Count leaves again
    const newCount = await page.locator('.leaf').count();
    
    // Should have more leaves (or same if at max capacity)
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should interact with leaves on mouse proximity', async ({ page }) => {
    await page.goto('/');
    
    // Get a leaf position
    const leafPosition = await page.locator('.leaf:nth-of-type(1)').boundingBox();
    
    if (leafPosition) {
      // Move mouse close to the leaf
      await page.mouse.move(leafPosition.x + 10, leafPosition.y + 10);
      
      // Wait for interaction effect
      await page.waitForTimeout(500);
      
      // Check if leaf has interactive behavior (rotation speed change, etc.)
      const leafStyles = await page.locator('.leaf:nth-of-type(1)').evaluate(el => {
        return getComputedStyle(el).transform;
      });
      
      // Transform should include rotation/translation from interaction
      expect(leafStyles).toContain('matrix');
    }
  });

  test('should pause/resume dynamic generation with pause button', async ({ page }) => {
    await page.goto('/');
    
    // Click pause button
    await page.click('.pause-btn');
    
    // Verify pause state
    const pauseIcon = await page.locator('.pause-btn__icon').textContent();
    expect(pauseIcon).toBe('▶');
    
    // Count leaves after pause
    const countAfterPause = await page.locator('.leaf').count();
    
    // Wait a bit to ensure no new leaves are generated
    await page.waitForTimeout(4000);
    
    const countAfterWait = await page.locator('.leaf').count();
    expect(countAfterWait).toBe(countAfterPause); // No new leaves when paused
    
    // Resume
    await page.click('.pause-btn');
    const resumeIcon = await page.locator('.pause-btn__icon').textContent();
    expect(resumeIcon).toBe('⏸');
  });

  test('should apply physics to leaf movement', async ({ page }) => {
    await page.goto('/');
    
    // Monitor leaf positions over time to verify physics
    const positions = [];
    
    for (let i = 0; i < 5; i++) {
      const position = await page.locator('.leaf:nth-of-type(1)').evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.left, y: rect.top, time: Date.now() };
      });
      positions.push(position);
      await page.waitForTimeout(500);
    }
    
    // Verify that leaves are moving (physics simulation)
    const totalMovement = positions.reduce((acc, pos, i) => {
      if (i === 0) return acc;
      const prev = positions[i - 1];
      return acc + Math.abs(pos.x - prev.x) + Math.abs(pos.y - prev.y);
    }, 0);
    
    expect(totalMovement).toBeGreaterThan(20); // Should show significant movement
  });

  test('should handle different leaf sizes and colors', async ({ page }) => {
    await page.goto('/');
    
    // Wait for potential dynamic leaves to generate
    await page.waitForTimeout(3000);
    
    const leafStyles = await page.evaluate(() => {
      const leaves = document.querySelectorAll('.leaf');
      return Array.from(leaves).map(leaf => {
        const computed = getComputedStyle(leaf);
        return {
          width: computed.width,
          height: computed.height,
          backgroundColor: computed.backgroundColor
        };
      });
    });
    
    // Should have variety in sizes and colors
    const uniqueWidths = [...new Set(leafStyles.map(s => s.width))];
    const uniqueColors = [...new Set(leafStyles.map(s => s.backgroundColor))];
    
    expect(uniqueWidths.length).toBeGreaterThan(1); // Multiple sizes
    expect(uniqueColors.length).toBeGreaterThan(1); // Multiple colors
  });

  test('should clean up old dynamic leaves', async ({ page }) => {
    await page.goto('/');
    
    // Let the system run for a while to generate and clean up leaves
    await page.waitForTimeout(10000);
    
    // Count total leaves - should not exceed maximum
    const leafCount = await page.locator('.leaf').count();
    expect(leafCount).toBeLessThanOrEqual(15); // Should not grow infinitely
  });

  test('should adjust behavior for mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for mobile optimizations to take effect
    await page.waitForTimeout(2000);
    
    // Should have fewer leaves on mobile for performance
    const mobileLeafCount = await page.locator('.leaf:visible').count();
    
    // Switch to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(2000);
    
    const desktopLeafCount = await page.locator('.leaf:visible').count();
    
    // Desktop should support more leaves
    expect(desktopLeafCount).toBeGreaterThanOrEqual(mobileLeafCount);
  });

  test('should respect reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Should not generate dynamic leaves with reduced motion
    const initialCount = await page.locator('.leaf').count();
    
    await page.waitForTimeout(6000);
    
    const finalCount = await page.locator('.leaf').count();
    expect(finalCount).toBe(initialCount); // No dynamic generation
  });

  test('should handle boundary conditions', async ({ page }) => {
    await page.goto('/');
    
    // Test leaves resetting when they fall off screen
    await page.evaluate(() => {
      // Force leaves to bottom of screen
      document.querySelectorAll('.leaf').forEach(leaf => {
        leaf.style.transform = `translate(100px, ${window.innerHeight + 100}px)`;
      });
    });
    
    await page.waitForTimeout(1000);
    
    // Leaves should be reset to top
    const leafPositions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.leaf')).map(leaf => {
        const rect = leaf.getBoundingClientRect();
        return rect.top;
      });
    });
    
    // At least some leaves should be back at the top (negative or small positive values)
    const leavesAtTop = leafPositions.filter(top => top < 100).length;
    expect(leavesAtTop).toBeGreaterThan(0);
  });

  test('should maintain performance under load', async ({ page }) => {
    await page.goto('/');
    
    // Create heavy interaction to test performance
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(Math.random() * 800, Math.random() * 600);
      await page.waitForTimeout(100);
    }
    
    // Check if performance monitoring reduces quality under load
    const leafCount = await page.locator('.leaf:visible').count();
    
    // System should automatically manage leaf count for performance
    expect(leafCount).toBeLessThanOrEqual(15);
    
    // Check console for performance warnings
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.waitForTimeout(2000);
    
    // May contain performance warnings but should not crash
    expect(logs.some(log => log.includes('error'))).toBe(false);
  });
});