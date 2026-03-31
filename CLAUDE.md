# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an EasyEDA Pro extension that provides a timing diagram tool based on WaveDrom. It allows users to create and place professional digital timing diagrams in EasyEDA Pro schematics using WaveJSON syntax.

## Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript to dist/
npm run compile

# Lint code
npm run lint

# Fix linting issues
npm run fix

# Build extension package (.eext file)
npm run build
```

The built `.eext` file will be located in `build/dist/` with the naming format: `{name}_v{version}.eext`

## Architecture

### Extension Structure

- **src/index.ts** - Main extension entry point
  - Exports `activate()` function called when extension loads
  - Exports `openTimingDiagram()` to open the editor IFrame
  - Exports `showAbout()` to display about dialog
  - Imports multilingual data directly from JSON files and registers them via `eda.sys_I18n.importMultilingual()`

- **iframe/** - IFrame UI components (vanilla JavaScript, no framework)
  - `index.html` - Main editor interface
  - `app.js` - Editor logic, configuration management, WaveDrom rendering
  - `about.html` - About dialog
  - `locales.js` - Inline multilingual data (zh-Hans and en)
  - `style.css` - Styling
  - `wavedrom.min.js` - WaveDrom library for rendering timing diagrams
  - `default.js` - Default configuration templates

- **extension.json** - Extension metadata
  - Defines menu items registered in schematic editor
  - Entry point: `./dist/index`
  - Requires EasyEDA version ^3.2.0

- **locales/** - Internationalization source files (for reference only)
  - `zh-Hans.json` - Chinese translations
  - `en.json` - English translations
  - Note: These files are imported into code at build time, not loaded at runtime

### Build System

- **esbuild** is used for bundling TypeScript
- **config/esbuild.common.ts** - Base esbuild configuration
  - Entry: `./src/index`
  - Output: `./dist/`
  - Format: IIFE with global name `edaEsbuildExportName`
  - Platform: browser
  - Bundle: true, Minify: false (required by EasyEDA)

- **build/packaged.ts** - Packaging script
  - Reads `.edaignore` to filter files
  - Creates ZIP archive with `.eext` extension
  - Validates and fixes UUID in extension.json if needed

### Key Dependencies

- **@jlceda/pro-api-types** - TypeScript types for EasyEDA Pro API
- **wavedrom** - Timing diagram rendering engine
- **esbuild** - Build tool
- **jszip** - For creating .eext package files

## EasyEDA Pro API Usage

The extension uses the global `eda` object provided by EasyEDA Pro:

- `eda.sys_I18n.importMultilingual()` - Import translations (used in src/index.ts)
- `eda.sys_I18n.getCurrentLanguage()` - Get current language (used in iframe)
- `eda.sys_I18n.text()` - Get translated text
- `eda.sys_IFrame.openIFrame()` - Open IFrame windows
- `eda.sys_Message.showToastMessage()` - Show toast notifications

Note: The extension does NOT use `eda.sys_FileSystem.getExtensionFile()` for loading locales. Instead, multilingual data is bundled directly into the code at build time.

## Development Notes

- The extension uses strict TypeScript configuration
- Pre-commit hooks run `eslint --fix` on all files via lint-staged
- IFrame files (HTML/CSS/JS) are not compiled, they're included as-is in the package
- The `.edaignore` file controls which files are included in the final .eext package
- UUID in extension.json must be a 32-character hex string (no dashes)
