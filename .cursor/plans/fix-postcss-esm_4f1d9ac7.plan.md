---
name: fix-postcss-esm
overview: Convert the frontend PostCSS config to an ES module so Vitest runs cleanly and refresh the testing guide to match.
todos:
  - id: convert-config
    content: replace TS PostCSS config with JS ESM module
    status: pending
  - id: update-testing-guide
    content: refresh testing guide PostCSS note
    status: pending
  - id: verify-vitest
    content: run targeted Vitest suite to confirm fix
    status: pending
---

# Fix PostCSS ESM Setup

## convert-config
- Replace the current TypeScript configuration in [`Travel_Ease_Frontend/postcss.config.ts`](Travel_Ease_Frontend/postcss.config.ts) with a new `postcss.config.js` that imports `autoprefixer` and exports the plugin array using ESM syntax so both Vite and Vitest can load it under `"type": "module"`.
- Remove the obsolete `.ts` file so only the JS module remains on disk.

## update-testing-guide
- Update the troubleshooting note in [`docs/testing-guide.md`](docs/testing-guide.md) to reflect the new JS-based PostCSS setup (no longer recommend renaming to `.mjs`) and mention the expected Vitest command if issues persist.

## verify-vitest
- From `Travel_Ease_Frontend`, run `npm test -- --run src/__tests__/AuthCallback.test.tsx` to confirm Vitest starts without the `ERR_REQUIRE_ESM` error and executes the callback tests successfully.

