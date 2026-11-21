# GHOSTLIGHT — The Meridian Vault Job
## Entry for the make.fun best-stealth-game-20261121-1759 bounty

[![make.fun bounty](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759) [![Leaderboard rank](https://make.fun/badge/best-stealth-game-20261121-1759/Brengsek27/best-stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard) [![Bounty reward](https://make.fun/badge/best-stealth-game-20261121-1759/Brengsek27/best-stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard)

**GHOSTLIGHT** is a top-down 2D stealth game: sneak past five patrolling guards with amber vision cones, steal three data cores from the Meridian Vault, then reach the exit unseen. Detection rises when a guard sees you and decays when you break line of sight; get spotted up close and you are caught. Sneak to move quietly, use cover and the guards' patrol rhythms, grab each core with E, and slip out the north exit.

Entered on make.fun: https://make.fun/bounty/best-stealth-game-20261121-1759

## How to play

- `node serve.ts` then open http://localhost:8080
- WASD / arrow keys move, Shift sneak, E grab a core, R restart, P pause, M mute
- `node main.ts` validates the entry and copies `game/` + `screenshots/` to `$MAKEFUN_OUTPUT_DIR`

## Repository contents

- `game/` — the game (`index.html` + `src/*.js`: config, simulation, rendering, input, staged shots)
- `screenshots/` — four staged frames (title, play, tension, win)
- `main.ts` — the runner entrypoint
- `serve.ts` — local dev server
- `shots.json` — the four staged shots
- `LICENSE` — MIT license file
