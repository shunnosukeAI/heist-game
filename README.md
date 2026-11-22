# heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/shunnosukeAI/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/shunnosukeAI/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Moonlight Gallery Heist** is a top-down stealth heist game that runs in a desktop browser from static files — no build step, no network. You are a thief in a moonlit museum after closing time: slip past three patrolling guards and two sweeping security cameras, lift the loot, steal the legendary Moonlight Star from the deep gallery, and run for the green service exit.

## The risk–reward twist

Every exhibit carries a rarity, shown by its colour and frame at a glance: green **Common** pieces sit near the entrance and are safe, blue **Rare** pieces sit mid-gallery, purple **Epic** pieces sit deep inside, and the gold **Legendary** Moonlight Star waits in the farthest room under the heaviest patrols. Play it safe and bank a small score, or risk the deep rooms for the big one. Once the Star is taken, every guard speeds up and the alarm rises faster — the getaway pays off the planning.

## How to play

- **Move:** WASD or arrow keys. Walking is fast but loud — guards turn toward noise.
- **Sneak:** hold Shift to move slowly and silently.
- **Decoy coin (Q, 3 total):** throws a coin toward the mouse; guards in earshot go to investigate the clink.
- **Smoke (E, 2 total):** drops a smoke puff at your feet that blinds guards and cameras for a few seconds.
- **Mute:** M. **Restart after being caught or escaping:** R. **Start:** Enter or click.

Being seen fills the alarm meter (guards fill it faster than cameras); hiding lets it drain. At 100% the museum locks down and you are caught — and a guard grabbing you ends the run at once. Display cases block both movement and sight, so every room has several covered routes. Escape through the green EXIT door with the Star for the win, plus a bonus for tools left unused.

All art is drawn in code and all sound is synthesised with the Web Audio API — the game ships no image or audio files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. `main.ts` is the program that hands the entry in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4vexb5f4&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
