# RIFT DB — LoL Esports Database Prototype

A static, responsive prototype for a global League of Legends esports database.

## Included
- Global league scaffold: LPL, LCK, LEC, LCP, LCS, CBLOL
- 2026 LPL Split 3 / Patch 26.14 sample dataset
- Team pages
- Player champion usage / wins / losses / win rate
- Taiwan Traditional Chinese champion names
- Global search for teams, players, champions
- Team comparison modal
- Raw-series data view
- Responsive desktop/mobile layout

## Run locally
Open `index.html` directly in a browser, or serve this folder with any static server.

## Deploy
This folder can be deployed as a static site to Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.

## Data note
This is a UI/data-architecture prototype. The sample LPL snapshot is intentionally finite and should be replaced by a verified per-game ingestion pipeline before public production use.

## 2026-07-24 update

- Activated LEC in the global league navigation.
- Added all 10 LEC 2026 Summer teams and current starting rosters.
- Added LEC team logos.
- Added per-league season/split/patch rendering so LPL can remain on `2026 Split 3` while LEC uses `2026 Summer`.
- LEC champion statistics intentionally start empty and will be added only after completed Bo3 series.

## 2026-07-25 LCP update

- Activated LCP on the global homepage and sidebar.
- Added all 8 LCP 2026 Split 3 teams and current active/opening rosters.
- Added current LoL Esports team-logo assets for LCP cards.
- LCP uses a Swiss Stage in Split 3; team records and champion statistics begin at 0-0 / empty before opening matches.
- LCP champion data will only be added after completed series, without importing Split 1 or Split 2 champion usage.
- Patch display is initialized to 26.14 and should be verified against the first completed Split 3 match record before stats are added.


## 2026-07-26 Patch 26.14 update
- LPL: all completed series through July 25 are included with player/champion win-loss aggregation.
- LEC: MKOI 1-2 G2 and KC 2-0 VIT are included; VIT vs G2 is intentionally excluded for now.
- LCP: GZ 0-2 MVK and SHG 0-2 TSW series results are included. Champion-level picks remain pending until a reliable post-match source is available.
