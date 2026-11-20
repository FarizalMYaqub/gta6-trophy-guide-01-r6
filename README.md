# Leonida Legend — GTA 6 Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/FarizalMYaqub/gta6-trophy-guide-01-r6/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/FarizalMYaqub/gta6-trophy-guide-01-r6/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides and tracks all 55 PlayStation 5 trophies of
Grand Theft Auto VI: the official names, descriptions and grades, a checklist
saved in the browser, filters by kind, a spoiler setting that hides story
trophies until they are earned, export and import, a roadmap to the platinum,
missable flags, and a guide to every trophy in our own words that cites its
sources.

Built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. It works with the
network off: every file it loads lives under `app/`.

## What is inside

- `app/index.html` — the guide's page
- `app/style.css` — its look
- `app/app.js` — tracker, filters, spoiler setting, export and import
- `app/data/trophies.json` — the 55 official trophies with guides and sources
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json`
- `screenshots/` — renders of the running guide

## Sources

The trophy names, descriptions and grades are the official PlayStation 5
list, as listed by Exophase and PSNProfiles. Every guide is written in our
own words from those descriptions and names its sources beside it; where the
official description does not pin down a place or a step, the guide says so
plainly instead of inventing one.

## License

MIT. See [LICENSE](LICENSE).
