/**
 * Lightweight Ad Blocker Detection Utility
 *
 * This utility detects if an ad blocker is active by checking if Google AdSense
 * scripts are being blocked. It's minimal (< 1KB) and doesn't impact performance.
 *
 * Detection methods:
 * 1. Check if AdSense script loads
 * 2. Check if a bait element with ad-like classes gets hidden
 */

export function detectAdBlocker(): Promise<boolean> {
  return new Promise((resolve) => {
    // Method 1: Check if AdSense script is blocked
    const testAd = document.createElement('div')
    testAd.innerHTML = '&nbsp;'
    testAd.className = 'adsbox ad-placement adsbygoogle'
    testAd.style.cssText = 'width: 1px !important; height: 1px !important; position: absolute !important; left: -9999px !important;'

    document.body.appendChild(testAd)

    // Wait a bit for ad blockers to process
    setTimeout(() => {
      // Check if element was hidden or removed by ad blocker
      const isBlocked =
        testAd.offsetHeight === 0 ||
        testAd.offsetWidth === 0 ||
        window.getComputedStyle(testAd).display === 'none' ||
        window.getComputedStyle(testAd).visibility === 'hidden'

      // Clean up
      document.body.removeChild(testAd)

      resolve(isBlocked)
    }, 100)
  })
}

/**
 * Check if user has already been notified about ad blocker
 */
export function hasSeenAdBlockerNotice(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem('adblock-notice-seen') === 'true'
  } catch {
    return false
  }
}

/**
 * Mark that user has seen the ad blocker notice
 */
export function markAdBlockerNoticeSeen(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('adblock-notice-seen', 'true')
  } catch {
    // Ignore if localStorage is not available
  }
}

/**
 * Reset the notice (for testing or user preference)
 */
export function resetAdBlockerNotice(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('adblock-notice-seen')
  } catch {
    // Ignore if localStorage is not available
  }
}
