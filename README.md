# Task Helper for Jira

A Chrome extension scaffold that analyzes Jira issue pages, highlights missing information, suggests labels, and provides quick reply templates.

## Features

- Parses Jira issue summary and description.
- Detects missing reproduction steps, expected behavior, environment links, platform scope, and partner credentials.
- Shows warning messages and a copy-ready checklist overlay.
- Suggests labels for `SRTR`, `WebSDK`, and `Campaign` based on issue content.
- Includes a popup with quick reply templates and a simple technical English helper.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `groom-helper` folder.

## Usage

- Open a Jira issue page.
- The extension injects a floating panel with analysis and checklist items.
- Use the popup to copy ready-made reply templates or improve short text snippets.
