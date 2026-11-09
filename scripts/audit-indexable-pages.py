#!/usr/bin/env python3
"""Read-only check for sitemap URLs, static canonical tags and indexability."""
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import sys
ROOT=Path(__file__).resolve().parents[1]
ORIGIN="https://wild-rift-guide.vercel.app"
class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__();self.canonical=None;self.robots=None
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="link" and d.get("rel")=="canonical":self.canonical=d.get("href")
        if tag=="meta" and d.get("name")=="robots":self.robots=d.get("content","")
def main():
    failures=[];seen=set()
    for sitemap in ("sitemap.xml","sitemap-editorial.xml"):
        for e in ET.parse(ROOT/sitemap).iter():
            if not e.tag.endswith("loc") or not e.text:continue
            url=e.text
            if not url.startswith(ORIGIN+"/"):failures.append(("external",url));continue
            if url in seen:continue
            seen.add(url)
            parsed=urlparse(url)
            if parsed.query:failures.append(("query-in-sitemap",url));continue
            path=parsed.path.lstrip("/")
            file=ROOT/path if path else ROOT/"index.html"
            if file.is_dir():file=file/"index.html"
            if not file.is_file():failures.append(("missing-file",url));continue
            head=HeadParser();head.feed(file.read_text(encoding="utf-8"))
            if head.canonical!=url:failures.append(("canonical-mismatch",url,head.canonical))
            if head.robots and "noindex" in head.robots.lower():failures.append(("noindex-in-sitemap",url))
    print(f"Checked {len(seen)} distinct sitemap URLs; issues: {len(failures)}")
    for issue in failures[:50]:print(" | ".join(str(x) for x in issue))
    return 1 if failures else 0
if __name__=="__main__":sys.exit(main())
