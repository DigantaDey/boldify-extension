# Privacy Policy for Boldify Reading Assistant

**Last Updated:** May 2026

## Overview

Boldify Reading Assistant ("Boldify", "we", "our", or "the extension") is committed to protecting your privacy. This privacy policy explains how Boldify handles your data.

**TL;DR: We don't collect, store, or transmit any of your personal data. Everything happens locally in your browser.**

---

## Data Collection

### What We DO NOT Collect

Boldify does NOT collect, store, or transmit:

- ❌ Personal information (name, email, etc.)
- ❌ Browsing history or URLs you visit
- ❌ Page content or text you read
- ❌ Usage analytics or telemetry
- ❌ Device identifiers or fingerprints
- ❌ IP addresses
- ❌ Cookies or tracking data
- ❌ Any data to external servers

### What We Store Locally

Boldify stores the following data **locally on your device only** using Chrome's `storage.local` API:

1. **User Preferences**
   - Bold intensity setting (0-100%)
   - Italic mode toggle (on/off)
   - Theme preference (light/dark)

2. **Per-Site Settings**
   - Whether Boldify is enabled for specific websites
   - Site-specific intensity and style preferences

3. **Anonymous Usage Statistics** (local only)
   - Total words processed (counter)
   - Total pages processed (counter)
   - Install date

This data:
- Never leaves your device
- Is not synced to any cloud service
- Is not accessible to us or any third party
- Can be deleted by uninstalling the extension

---

## Permissions Explained

### `activeTab`

**Purpose:** To read and modify text content on the current webpage.

**How it's used:** When you activate Boldify on a page (via the popup toggle or keyboard shortcut), the extension reads the text nodes in the DOM and applies bold formatting to the first few characters of each word.

**Privacy implications:** 
- The extension only accesses the page when YOU activate it
- No page content is ever transmitted externally
- Processing happens entirely in your browser

### `storage`

**Purpose:** To save your preferences locally.

**How it's used:** Your settings (intensity, italic mode, per-site preferences) are saved to Chrome's local storage so they persist between browser sessions.

**Privacy implications:**
- Data is stored only on your device
- Never synced to external servers
- Deleted when you uninstall the extension

---

## Third-Party Services

Boldify does NOT use any third-party services, including:

- ❌ Analytics platforms (Google Analytics, Mixpanel, etc.)
- ❌ Crash reporting services
- ❌ Advertising networks
- ❌ External APIs
- ❌ Cloud storage services

---

## Data Security

Since no data is transmitted externally, there is no risk of data breaches affecting your information. All processing occurs locally within Chrome's sandboxed extension environment.

---

## Children's Privacy

Boldify does not knowingly collect any personal information from anyone, including children under 13. The extension does not collect personal information at all.

---

## Changes to This Policy

If we make changes to this privacy policy, we will:

1. Update the "Last Updated" date at the top
2. Include a summary of changes in the extension update notes
3. For significant changes, display a notice in the extension popup

---

## Open Source

Boldify is open source. You can review our complete source code to verify our privacy practices:

🔗 **GitHub Repository:** [github.com/DigantaDey/boldify-extension](https://github.com/DigantaDey/boldify-extension)

---

## Contact

If you have questions about this privacy policy or Boldify's data practices:

- **GitHub Issues:** [Submit a question](https://github.com/DigantaDey/boldify-extension/issues)
- **Email:** diganta.dey2013@gmail.com (if applicable)

---

## Summary

| Data Type | Collected? | Stored? | Transmitted? |
|-----------|------------|---------|--------------|
| Personal info | ❌ No | ❌ No | ❌ No |
| Browsing history | ❌ No | ❌ No | ❌ No |
| Page content | ❌ No | ❌ No | ❌ No |
| User preferences | ❌ No | ✅ Locally | ❌ No |
| Analytics | ❌ No | ❌ No | ❌ No |

**Boldify is designed with privacy as a core principle. Your reading habits are your business, not ours.**
