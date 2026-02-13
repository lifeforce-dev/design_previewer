from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, Field

class DesignItem(BaseModel):
    title: str
    path: str


class DesignGroup(BaseModel):
    key: str
    label: str
    items: list[DesignItem] = Field(default_factory=list)


class DesignVersion(BaseModel):
    key: str
    label: str
    groups: list[DesignGroup] = Field(default_factory=list)


class DesignManifest(BaseModel):
    title: str
    description: str
    generatedAt: str
    rootPath: str
    versions: list[DesignVersion] = Field(default_factory=list)


def title_words(value: str) -> str:
    if not value.strip():
        return value

    parts = [part for part in re.split(r"[-_\s]+", value) if part]
    if not parts:
        return value

    return " ".join(part if part.isdigit() else part.capitalize() for part in parts)


def file_title(file_name: str) -> str:
    stem = Path(file_name).stem
    return title_words(stem)


def group_label(relative_dir: str) -> str:
    if relative_dir == ".":
        return "Root"

    return " / ".join(title_words(part) for part in relative_dir.split("/") if part)


def rel_path(base_path: Path, target_path: Path) -> str:
    try:
        relative = target_path.relative_to(base_path)
    except ValueError:
        relative = Path(Path.cwd(), target_path).resolve().relative_to(base_path)

    return f"./{relative.as_posix()}"


def should_include_html(root_path: Path, html_path: Path) -> bool:
    if html_path.name.lower() == "index.html":
        return False

    relative = html_path.relative_to(root_path)
    if any(part.startswith(".") for part in relative.parts):
        return False

    if relative.parts and relative.parts[0].lower() == "design_previewer":
        return False

    return True


def discover_versions(root_path: Path) -> list[DesignVersion]:
    all_html_files = sorted(
        [path for path in root_path.rglob("*.html") if should_include_html(root_path, path)],
        key=lambda path: rel_path(root_path, path).lower(),
    )

    if not all_html_files:
        return []

    grouped_items: dict[str, list[DesignItem]] = {}
    for html_path in all_html_files:
        relative_dir = html_path.parent.relative_to(root_path).as_posix()
        grouped_items.setdefault(relative_dir, []).append(
            DesignItem(
                title=file_title(html_path.name),
                path=rel_path(root_path, html_path),
            )
        )

    groups = [
        DesignGroup(
            key=group_key if group_key != "." else "root",
            label=group_label(group_key),
            items=items,
        )
        for group_key, items in sorted(grouped_items.items(), key=lambda item: item[0].lower())
    ]

    return [DesignVersion(key="all", label="All", groups=groups)]


def build_manifest(root_path: Path, title: str, description: str) -> DesignManifest:
    return DesignManifest(
        title=title,
        description=description,
        generatedAt=datetime.now().astimezone().isoformat(timespec="seconds"),
        rootPath=str(root_path),
        versions=discover_versions(root_path),
    )
