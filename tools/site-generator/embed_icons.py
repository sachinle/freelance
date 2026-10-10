"""Embed mask icons in site.css as data URIs.

Browsers fetch CSS mask images in CORS mode, so `mask: url("../icons/x.svg")`
fails when a page is opened straight from disk (file://). Data URIs load
everywhere. The source file name is kept in a comment next to each value;
re-running is safe (already-embedded values are refreshed from the files).
"""
import os
import re
from urllib.parse import quote

SITE_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
CSS = os.path.join(SITE_ROOT, "assets", "css", "site.css")
ICONS = os.path.join(SITE_ROOT, "assets", "icons")

DECL = re.compile(
    r'(?P<prop>--icon|-webkit-mask|mask)(?P<sep>\s*:\s*)(?P<pre>[^;{}]*?)'
    r'url\("(?:\.\./icons/(?P<file>[\w.-]+\.svg)|data:image/svg\+xml,[^"]*)"\)'
    r'(?:\s*/\* icons/(?P<cfile>[\w.-]+\.svg) \*/)?'
)


def data_uri(name):
    svg = open(os.path.join(ICONS, name), encoding="utf-8").read()
    svg = re.sub(r"\s+", " ", svg).strip().replace('"', "'")
    return "data:image/svg+xml," + quote(svg, safe=" '=:/;,.-()")


def embed(css_path=CSS):
    s = open(css_path, encoding="utf-8").read()
    count = 0

    def sub(m):
        nonlocal count
        name = m.group("file") or m.group("cfile")
        if not name:
            return m.group(0)
        count += 1
        return f'{m.group("prop")}{m.group("sep")}{m.group("pre")}url("{data_uri(name)}") /* icons/{name} */'

    s = DECL.sub(sub, s)
    open(css_path, "w", encoding="utf-8", newline="\n").write(s)
    return count


if __name__ == "__main__":
    print("embedded", embed())
