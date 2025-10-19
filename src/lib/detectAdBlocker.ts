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
    // Method 1: Try loading AdSense script
    const adsenseTest = document.createElement('script')
    adsenseTest.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    adsenseTest.async = true

    let scriptLoaded = false
    adsenseTest.onload = () => {
      scriptLoaded = true
    }

    document.head.appendChild(adsenseTest)

    // Method 2: Bait element with ad-like classes (more aggressive)
    const testAd = document.createElement('div')
    testAd.innerHTML = '&nbsp;'
    testAd.className = 'ad ads advertisement banner adsbox ad-placement adsbygoogle'
    testAd.style.cssText = 'width: 300px !important; height: 250px !important; position: absolute !important; left: -9999px !important; top: -9999px !important;'
    testAd.setAttribute('data-ad-slot', '1234567890')

    document.body.appendChild(testAd)

    // Wait for ad blockers to process
    setTimeout(() => {
      // Check multiple indicators
      const isBlocked =
        !scriptLoaded ||
        testAd.offsetHeight === 0 ||
        testAd.offsetWidth === 0 ||
        window.getComputedStyle(testAd).display === 'none' ||
        window.getComputedStyle(testAd).visibility === 'hidden' ||
        window.getComputedStyle(testAd).opacity === '0'

      // Clean up
      document.body.removeChild(testAd)
      document.head.removeChild(adsenseTest)

      resolve(isBlocked)
    }, 150)
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
