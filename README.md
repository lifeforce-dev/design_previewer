# Design Previewer

This repository contains the runtime previewer and a portable bootstrap script.

## Consumer workflow

1. Copy `include/setup_previewer.py` into your designs root folder.
2. Set `DESIGN_PREVIEWER_REPO=owner/design_previewer`.
3. Run `python setup_previewer.py --serve --open`.

The bootstrap script will:

1. Resolve the latest `dev-*` tag (or use `DESIGN_PREVIEWER_TAG` if pinned).
2. Download that tag into a sibling `design_previewer/` folder.
3. Run the runtime setup from the downloaded repo.
4. Generate `design_previewer/manifest.json` and optionally serve the designs root.

## Filesystem-only discovery

Manifest generation is folder-agnostic:

- Recursively scans `*.html` under the provided root.
- Ignores `index.html` files.
- Ignores hidden paths and the `design_previewer/` runtime folder.
- Groups entries by relative directory path (or `Root` for top-level files).
