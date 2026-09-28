#!/usr/bin/env python3
"""Lint tracked Markdown for formatting hygiene (pure stdlib).

Catches the class of bug that mangled the README command table — a table
whose data rows had a different column count than the header/separator
because unescaped ``|`` characters in inline code split cells. Also flags
trailing whitespace, missing final newlines, and hard tabs so Markdown
across the repo stays consistently formatted.

For ```mermaid blocks it additionally rejects backticks (markdown-string
label syntax that GitHub's mermaid lexer refuses) and unbalanced
double-quotes on label lines, so diagrams render on GitHub.

Run via ``make check`` / CI alongside the Python and OpenAPI gates. The
check is intentionally narrow and deterministic: it reports the file, line,
and reason for every violation and exits non-zero when any are found.
"""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {
    ".git",
    ".flox",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "flox",
    "htmlcov",
    "node_modules",
    "venv",
}

Violation = tuple[str, int, str]


def tracked_markdown() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "*.md"],
        cwd=ROOT,
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    paths: list[Path] = []
    for line in result.stdout.splitlines():
        relative_path = Path(line)
        if set(relative_path.parts) & EXCLUDED_PARTS:
            continue
        paths.append(relative_path)
    return paths


def _cell_count(row: str) -> int:
    """Number of cells in a Markdown table row, ignoring escaped pipes.

    A leading/trailing pipe wraps the row; ``\\|`` inside a cell (e.g. an
    inline-code command with alternatives) is a literal, not a delimiter.
    """
    stripped = row.strip()
    body = stripped
    if body.startswith("|"):
        body = body[1:]
    if body.endswith("|") and not body.endswith("\\|"):
        body = body[:-1]
    count = 1
    i = 0
    while i < len(body):
        char = body[i]
        if char == "\\":
            i += 2
            continue
        if char == "|":
            count += 1
        i += 1
    return count


def _is_separator(row: str) -> bool:
    cells = row.strip().strip("|").split("|")
    if not cells:
        return False
    for cell in cells:
        token = cell.strip()
        if token == "" or set(token) - {"-", ":"} or "-" not in token:
            return False
    return True


def check_file(path: Path) -> list[Violation]:
    violations: list[Violation] = []
    raw = (ROOT / path).read_bytes()
    if raw and not raw.endswith(b"\n"):
        violations.append((path.as_posix(), 0, "file does not end with a newline"))
    if raw.endswith(b"\n\n"):
        violations.append((path.as_posix(), 0, "file ends with a blank line"))

    text = raw.decode("utf-8", errors="replace")
    lines = text.split("\n")
    in_fence = False
    for lineno, line in enumerate(lines, start=1):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if line != line.rstrip():
            violations.append((path.as_posix(), lineno, "trailing whitespace"))
        if "\t" in line:
            violations.append((path.as_posix(), lineno, "hard tab in Markdown content"))

    _check_tables(path, lines, violations)
    _check_mermaid(path, lines, violations)
    return violations


def _check_mermaid(path: Path, lines: list[str], violations: list[Violation]) -> None:
    """Validate ```mermaid blocks the way GitHub's mermaid lexer would.

    Two failures are fatal to GitHub rendering and easy to miss in review:

    * A backtick anywhere inside the block. Markdown-string label syntax
      (``node[`text`]``) is rejected by GitHub's mermaid lexer, so any
      backtick in the diagram source is an error.
    * Unbalanced double-quotes on a label line. A quoted label
      (``node["text"]``) that never closes its quote breaks parsing.
    """
    in_block = False
    for lineno, line in enumerate(lines, start=1):
        stripped = line.lstrip()
        if stripped.startswith("```"):
            fence_lang = stripped[3:].strip().lower()
            if not in_block and fence_lang == "mermaid":
                in_block = True
            elif in_block:
                in_block = False
            continue
        if not in_block:
            continue
        if "`" in line:
            violations.append(
                (
                    path.as_posix(),
                    lineno,
                    "backtick inside mermaid block "
                    "(markdown-string labels are rejected by GitHub's lexer)",
                )
            )
        if line.count('"') % 2 != 0:
            violations.append(
                (
                    path.as_posix(),
                    lineno,
                    "unbalanced double-quote on mermaid label line",
                )
            )


def _check_tables(path: Path, lines: list[str], violations: list[Violation]) -> None:
    in_fence = False
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            i += 1
            continue
        # A table header is a pipe row immediately followed by a separator.
        if not in_fence and "|" in line and i + 1 < len(lines) and _is_separator(lines[i + 1]):
            header_cols = _cell_count(line)
            sep_cols = _cell_count(lines[i + 1])
            if sep_cols != header_cols:
                violations.append(
                    (
                        path.as_posix(),
                        i + 2,
                        f"table separator has {sep_cols} columns; header has {header_cols}",
                    )
                )
            j = i + 2
            while j < len(lines) and lines[j].strip().startswith("|"):
                row_cols = _cell_count(lines[j])
                if row_cols != header_cols:
                    violations.append(
                        (
                            path.as_posix(),
                            j + 1,
                            f"table row has {row_cols} columns; header has {header_cols} "
                            "(escape literal '|' inside cells as '\\|')",
                        )
                    )
                j += 1
            i = j
            continue
        i += 1


def main() -> int:
    failures: list[Violation] = []
    files = tracked_markdown()
    for path in files:
        failures.extend(check_file(path))

    if not failures:
        print(f"markdown check passed: {len(files)} files")
        return 0

    print("markdown check failed:")
    for file_path, lineno, reason in failures:
        location = f"{file_path}:{lineno}" if lineno else file_path
        print(f"  {location}: {reason}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
