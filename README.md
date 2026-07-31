# Design Previewer

This repository contains the runtime previewer and a portable bootstrap script.

## Consumer workflow

1. Copy `include/fetch_previewer.py` into your designs root folder.
2. Set `DESIGN_PREVIEWER_REPO=owner/design_previewer`.
3. Run `python fetch_previewer.py --serve --open`.

The bootstrap script will:

1. Resolve the latest `dev-*` tag (or use `DESIGN_PREVIEWER_TAG` if pinned).
2. Download that tag into a sibling `design_previewer/` folder.
3. Run `design_previewer/setup_previewer.py` from the downloaded repo.
4. Generate `design_previewer/manifest.json` and optionally serve the designs root.

## Filesystem-only discovery

Manifest generation is folder-agnostic:

- Recursively scans `*.html` under the provided root.
- Ignores `index.html` files.
- Ignores hidden paths and the `design_previewer/` runtime folder.
- Groups entries by relative directory path (or `Root` for top-level files).

## Preview scaling

Designs are laid out at a fixed logical width and then scaled to fit the
preview pane, so a wide desktop design shrinks proportionally instead of
reflowing into a narrow layout. Reflowing makes two designs incomparable,
because what is on screen is the layout at a width nobody uses.

The preview header carries Fit / 50% / 75% / 100% buttons and a Sidebar toggle.
Fit is the default and recalculates on resize.

Override the logical width before `previewer.js` loads:

```html
<script>window.DESIGN_PREVIEWER_LOGICAL_WIDTH = 1280;</script>
```

The controls are built by `previewer.js`, so an existing `index.html` picks
them up on its next fetch with no edits.

