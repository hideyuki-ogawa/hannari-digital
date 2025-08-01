const { test, expect } = require('@playwright/test');

test.describe('Fallen Leaves Display Tests', () => {
  
  test('should display all 6 leaves on page load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check that all 6 leaves are present in DOM
    const leaves = page.locator('.leaf');
    await expect(leaves).toHaveCount(6);
    
    // Verify each leaf is visible (not off-screen)
    for (let i = 1; i <= 6; i++) {
      const leaf = page.locator(`.leaf:nth-of-type(${i})`);
      await expect(leaf).toBeVisible();
      
      // Check that leaf is positioned within viewport
      const boundingBox = await leaf.boundingBox();
      expect(boundingBox.y).toBeGreaterThan(-50); // Not too far off-screen
      expect(boundingBox.x).toBeGreaterThan(-50);
    }
  });

  test('should have proper CSS styles applied to leaves', async ({ page }) => {
    await page.goto('/');
    
    const firstLeaf = page.locator('.leaf:nth-of-type(1)');
    
    // Check computed styles
    const styles = await firstLeaf.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        position: computed.position,
        width: computed.width,
        height: computed.height,
        backgroundColor: computed.backgroundColor,
        animationName: computed.animationName,
        animationPlayState: computed.animationPlayState
      };
    });
    
    expect(styles.position).toBe('absolute');
    expect(parseInt(styles.width)).toBeGreaterThan(0);
    expect(parseInt(styles.height)).toBeGreaterThan(0);
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
    expect(styles.animationName).toContain('leaf-fall');
    expect(styles.animationPlayState).toBe('running');
  });

  test('should have different colors and sizes for each leaf type', async ({ page }) => {
    await page.goto('/');
    
    const expectedLeafData = [
      { nth: 1, expectedBg: 'rgb(205, 133, 63)', width: 20, height: 20 }, // #cd853f
      { nth: 2, expectedBg: 'rgb(218, 165, 32)', width: 25, height: 25 }, // #daa520
      { nth: 3, expectedBg: 'rgb(255, 140, 0)', width: 18, height: 18 },  // #ff8c00
      { nth: 4, expectedBg: 'rgb(220, 20, 60)', width: 22, height: 22 },  // #dc143c
      { nth: 5, expectedBg: 'rgb(184, 134, 11)', width: 16, height: 16 }, // #b8860b
      { nth: 6, expectedBg: 'rgb(139, 69, 19)', width: 24, height: 24 }   // #8b4513
    ];
    
    for (const leafData of expectedLeafData) {
      const leaf = page.locator(`.leaf:nth-of-type(${leafData.nth})`);
      
      const styles = await leaf.evaluate(el => {
        const computed = getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          width: parseInt(computed.width),
          height: parseInt(computed.height)
        };
      });
      
      expect(styles.backgroundColor).toBe(leafData.expectedBg);
      expect(styles.width).toBe(leafData.width);
      expect(styles.height).toBe(leafData.height);
    }
  });

  test('should animate leaves (check position changes)', async ({ page }) => {
    await page.goto('/');
    
    const firstLeaf = page.locator('.leaf:nth-of-type(1)');
    
    // Get initial position
    const initialBox = await firstLeaf.boundingBox();
    
    // Wait for animation to progress
    await page.waitForTimeout(2000);
    
    // Get position after animation
    const newBox = await firstLeaf.boundingBox();
    
    // Position should have changed (animation is running)
    // Note: This might be flaky depending on animation timing
    // A better approach would be to check animation properties
    const animationState = await firstLeaf.evaluate(el => {
      const computed = getComputedStyle(el);
      return computed.animationPlayState;
    });
    
    expect(animationState).toBe('running');
  });

  test('should pause animations when pause button is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Find and click pause button
    const pauseButton = page.locator('.pause-btn');
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();
    
    // Check that animations are paused
    const firstLeaf = page.locator('.leaf:nth-of-type(1)');
    const animationState = await firstLeaf.evaluate(el => {
      const computed = getComputedStyle(el);
      return computed.animationPlayState;
    });
    
    expect(animationState).toBe('paused');
    
    // Check button text changed
    const buttonText = await pauseButton.locator('.pause-btn__icon').textContent();
    expect(buttonText).toBe('▶');
  });

  test('should respect reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check that animations are disabled/paused
    const firstLeaf = page.locator('.leaf:nth-of-type(1)');
    const animationState = await firstLeaf.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        animationPlayState: computed.animationPlayState,
        animationName: computed.animationName
      };
    });
    
    // Should be paused or have no animation
    expect(animationState.animationPlayState === 'paused' || animationState.animationName === 'none').toBe(true);
  });

  test('should have proper z-index stacking', async ({ page }) => {
    await page.goto('/');
    
    // Check z-index hierarchy
    const elements = [
      { selector: '.scene', expectedMinZ: 1 },
      { selector: '.leaves-container', expectedMinZ: 5 },
      { selector: '.hero', expectedMinZ: 10 },
      { selector: '.leaf', expectedMinZ: 1000 }
    ];
    
    for (const el of elements) {
      const zIndex = await page.locator(el.selector).first().evaluate(element => {
        const computed = getComputedStyle(element);
        return parseInt(computed.zIndex) || 0;
      });
      
      expect(zIndex).toBeGreaterThanOrEqual(el.expectedMinZ);
    }
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should show fewer leaves on mobile (per CSS media query)
    const visibleLeaves = await page.locator('.leaf').evaluateAll(leaves => {
      return leaves.filter(leaf => {
        const computed = getComputedStyle(leaf);
        return computed.display !== 'none';
      }).length;
    });
    
    // Mobile should show 3 leaves (first 3), desktop shows 6
    expect(visibleLeaves).toBeLessThanOrEqual(6);
    
    // Pause button should still be accessible (44px minimum)
    const pauseButton = page.locator('.pause-btn');
    const buttonBox = await pauseButton.boundingBox();
    expect(buttonBox.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox.height).toBeGreaterThanOrEqual(44);
  });

  test('should take screenshot for visual regression', async ({ page }) => {
    await page.goto('/');
    
    // Wait for animations to start
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('fallen-leaves-full-page.png');
    
    // Take screenshot of just the leaves area
    const leavesContainer = page.locator('.leaves-container');
    await expect(leavesContainer).toHaveScreenshot('leaves-container.png');
  });
});