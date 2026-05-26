# 🅱️ Boldify Reading Assistant

> **Read Faster. Focus Better. Comprehend More.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Get_Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

Boldify is a free, open-source Chrome extension that transforms any webpage into an easier-to-read experience using **bionic reading techniques**. By intelligently bolding the initial letters of each word, Boldify creates visual anchoring points that help your eyes flow through text naturally.

![Boldify Demo](assets/demo.gif)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔘 **One-Click Toggle** | Instantly enable/disable on any website |
| 🎚️ **Adjustable Intensity** | Fine-tune bold percentage from 10% to 90% |
| 🔤 **Italic Mode** | Optional italic styling for enhanced distinction |
| ⌨️ **Keyboard Shortcut** | `Alt+B` to toggle without touching your mouse |
| 🌐 **Per-Site Memory** | Remembers your preferences for each website |
| 🌙 **Dark Mode** | Beautiful UI that respects your system theme |
| ⚡ **Lightweight** | Zero performance impact, runs only when needed |
| 🔒 **Privacy First** | No data collection, no tracking, 100% local |

---

## 🎯 Who Is This For?

- **People with ADHD** — Maintain focus and reduce re-reading
- **Students** — Process dense academic text more efficiently  
- **Professionals** — Read lengthy reports without fatigue
- **Speed Readers** — Improve natural reading flow
- **Dyslexic Readers** — Benefit from visual word anchoring
- **Non-Native Speakers** — Improve reading fluency
- **Anyone** — Who experiences screen reading fatigue

---

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore)
2. Click **"Add to Chrome"**
3. Click the Boldify icon in your toolbar to get started

### Manual Installation (Developer Mode)

```bash
# Clone the repository
git clone https://github.com/boldify/boldify-extension.git
cd boldify-extension
```

1. Open `chrome://extensions/` in Chrome
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `extension` folder from the cloned repository

---

## 🔬 How It Works

Boldify uses a technique inspired by bionic reading research. The algorithm:

1. **Traverses** the DOM tree to find text nodes
2. **Splits** text into individual words
3. **Calculates** the optimal number of characters to bold based on word length and your intensity setting
4. **Wraps** the bold portion in `<b>` tags while preserving the original DOM structure

### Example

```
Normal:    "Reading is powerful"
Boldified: "Rea­ding i­s pow­erful"
            ^^^     ^    ^^^
            bold   bold  bold
```

### Bold Calculation Algorithm

```javascript
function getBoldCount(wordLength, intensity) {
  if (wordLength <= 1) return 1;
  if (wordLength <= 2) return 1;
  
  // intensity: 0-100
  // ratio ranges from 0.2 (subtle) to 0.8 (strong)
  const ratio = 0.2 + (intensity / 100) * 0.6;
  
  return Math.ceil(wordLength * ratio);
}

// Examples at 50% intensity:
// "Reading"  → "Rea" + "ding"   (3 of 7)
// "the"      → "t" + "he"       (1 of 3)
// "powerful" → "pow" + "erful"  (3 of 8)
```

---

## ⚙️ Configuration

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Enabled | Off | On/Off | Master toggle for the extension |
| Intensity | 50% | 10-90% | Percentage of each word to bold |
| Italic | Off | On/Off | Add italic styling to bold text |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + B` | Toggle Boldify on/off for current page |

Customize shortcuts at `chrome://extensions/shortcuts`

---

## 📁 Project Structure

```
extension/
├── manifest.json       # Extension manifest (v3)
├── background.js       # Service worker for shortcuts & messaging
├── content.js          # Content script (DOM manipulation)
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md           # This file
├── PRIVACY.md          # Privacy policy
└──  LICENSE             # MIT License
```

---

## 🔒 Privacy

Boldify is committed to user privacy:

- ✅ All processing happens **locally in your browser**
- ✅ Settings stored via `chrome.storage.local` (never synced externally)
- ✅ **Zero analytics, tracking, or telemetry**
- ✅ **No external network requests**
- ✅ Fully open-source and auditable
- ✅ Minimal permissions (`activeTab` + `storage` only)

Read our full [Privacy Policy](PRIVACY.md).

---

## 🛠️ Development

### Prerequisites

- Google Chrome or Chromium-based browser
- Basic knowledge of Chrome extension development

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/boldify/boldify-extension.git
   cd boldify-extension
   ```

2. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

3. Make changes to the code

4. Reload the extension:
   - Click the refresh icon on the extension card
   - Or press `Ctrl+R` while focused on the extensions page

### Testing

Test on various websites:
- News articles (e.g., Medium, NYTimes)
- Documentation (e.g., MDN, GitHub docs)
- Social media (e.g., Twitter/X, Reddit)
- Academic papers
- Email (Gmail, Outlook web)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** — Open an issue describing the problem
2. **Suggest Features** — Open an issue with your idea
3. **Submit PRs** — Fork, branch, code, and submit a pull request

### Guidelines

- Follow existing code style
- Test on multiple websites before submitting
- Update documentation if needed
- Keep privacy as a core principle

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Boldify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- Inspired by [Bionic Reading®](https://bionic-reading.com/) research
- Built for the ADHD and neurodivergent community
- Thanks to all contributors and users

---

<p align="center">
  <br>
  Made with ❤️ for the reading community
  <br><br>
  <strong>Free forever. No ads. No premium tier. Just better reading.</strong>
  <br><br>
  ⭐ Star this repo if Boldify helps you read better!
</p>
