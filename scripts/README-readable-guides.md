# Readable guide maintenance

The interactive guides and readable guides use the same source data. When hero,
item, rune, spell or ARAM JSON changes, regenerate the readable pages before
packaging. Keep ARAM's own version and sources; do not label it as a new patch
merely because Summoner's Rift changed.

From the repository root:

```sh
python3 scripts/generate-rift-readable-v120.py
python3 scripts/generate-aram-readable-v120.py
python3 scripts/validate-rift-readable-v120.py
python3 scripts/test-aram-readable-v120.py
python3 scripts/sync-sitemaps-v120.py
```

The old `refresh-share-v115.py` and `generate-static-seo-guides.py` entry points
must not be used to publish current guides: the former replaces content with
redirects and the latter hardcodes old versions. Existing helper imports are
safe only where the v120 scripts use them without calling their old main entry.

These checks establish content consistency, not AdSense approval. Preserve
pending source/evidence notes and avoid claiming a full in-game test.
