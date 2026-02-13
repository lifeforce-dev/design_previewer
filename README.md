# Design Previewer Setup

This previewer uses a generated `manifest.json` to discover versions, groups, and design files.

## Requirements

- Python 3.9+
- `pydantic` (auto-installed by the setup script)

## One command bootstrap

Just get it running:

```bash
python setup_previewer.py --serve --open
```

From this folder:

```bash
python setup_previewer.py --title "Athena Design Previewer" --description "Auto-discovered from v* and design folders."
```

From anywhere:

```bash
python e:/source/athena/designs/design_previewer/setup_previewer.py --title "Athena Design Previewer" --description "Auto-discovered from v* and design folders."
```

The script will:

1. Create/use a local `.venv` next to the script.
2. Install missing dependencies in that `.venv`.
3. Re-run itself from the `.venv` Python.
4. Discover versions/groups/design files.
5. Generate `manifest.json`.

## Optional preview server

```bash
python setup_previewer.py --serve --open
```

This serves `index.html` locally and opens it in your browser.
