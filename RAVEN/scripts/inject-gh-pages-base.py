"""Inject GitHub Pages base-path fix into all HTML files (first line inside <head>)."""
import glob
import os

MARKER = "RAVEN_GH_PAGES"
SCRIPT = (
    '<script>/*RAVEN_GH_PAGES*/(function(){var h=location.hostname;'
    "if(!h.endsWith('github.io'))return;var p=location.pathname.split('/').filter(Boolean);"
    "if(!p.length)return;var r=p[0];if(r.indexOf('.')!==-1)return;"
    "if(h.split('.')[0].toLowerCase()===r.toLowerCase())return;"
    "var b=location.pathname.indexOf('/admin/')!==-1?'/'+r+'/admin/':'/'+r+'/';"
    "document.write('<base href=\"'+b+'\">');})();</script>"
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def patch(path: str) -> bool:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if MARKER in text:
        return False
    lower = text.lower()
    idx = lower.find("<head>")
    if idx == -1:
        idx = lower.find("<head ")
        if idx == -1:
            print("skip (no head):", path)
            return False
        end = text.find(">", idx) + 1
    else:
        end = idx + 6
    new_text = text[:end] + "\n  " + SCRIPT + text[end:]
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(new_text)
    return True


def main():
    count = 0
    for path in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        if patch(path):
            count += 1
            print("patched", os.path.relpath(path, ROOT))
    print(f"Done. Patched {count} file(s).")


if __name__ == "__main__":
    main()
