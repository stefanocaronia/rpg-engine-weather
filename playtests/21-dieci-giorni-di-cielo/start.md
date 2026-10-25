# 21 Dieci giorni di cielo: the weather on a long road

The first long game with the weather extension, `@rpgengine/weather` 0.2.2 (D-436, D-437, D-440, D-441), installed from npm as a player would install it. A 5e campaign already under way, one player character, Corrado (cleric 3), on a ten-day journey with a deadline: two days of temperate hills at the end of August, two days and more waiting at the edge of the desert, three nights across the Deserto d'Ambra with a guide and her camel, then a fort on the far side, a storm on the ridges, and a choice between a short gorge that floods and a long valley road. The season turns on day 8, the 1st of September. Giulia's scenario (24 October).

It tests:

1. **The sky of each dawn**: the extension rolls it, `advance` and `travel` say it; the master tells it as the sky, never as its score, and it weighs on the march, the fatigue and the water.
2. **The zone**: the hot desert's table on the Pista del Sale and its stops, the seasons' table elsewhere, from the climate the regions write.
3. **The season from the date**: summer from the 25th of August, autumn from day 8, with its table and the fog of cold mornings.
4. **The weather a page gives**: the storm at the Rocca, set with `weather-set` when it comes and again at the next dawn, over the roll.
5. **A stop of several days**: one `advance` over several dawns, and the weather of all of them told short.
6. **The page**: what the dashboard shows of the date, the season and the weather.

Player: `players/marco-lungo.md`, Marco who counts rations and water on a journey, with [brief.md](brief.md), what he remembers. This file never goes into the campaign.

## The campaign

Every command below runs from the engine's repo, `rpg-engine`, beside this one: the runner, the player profiles and the questionnaire are there (its `playtests/README.md` says how to prepare a run). The results go to the maintainer's private notes, never into this repo.

Before session 1, in a new folder chosen as `README.md` says, from the repo at the commit under test (PowerShell). The extension comes from the npm registry, as for a user: it needs the network.

```
$run = "<runs>\<date>\<n>"
$campaign = "$run\cielo"
rpg init $campaign --name "Dieci giorni di cielo" --system 5e --language it --difficulty normal --lethality dice
Copy-Item -Recurse -Force ..\rpg-engine-weatherplaytests\21-dieci-giorni-di-cielo\world\* $campaign\world
Push-Location $campaign
rpg package install weather
rpg package list
rpg config saves checkpoint; rpg config rigor rules; rpg config dice digital; rpg config units metric
rpg config companions none; rpg config lines none; rpg config veils none; rpg config advancement milestones; rpg config mentor off
rpg config voices master; rpg config pictures none
rpg config calendar-start "25 August"
rpg mode "session zero"; rpg mode play
rpg advance --to "day 1, 06:50" --why "La partenza da Vallerana"
rpg weather
rpg validate; rpg status
Pop-Location
```

- `package install weather` installs `@rpgengine/weather` from npm, verified, with no yes asked, and adds it to `campaign.yaml`; `package list` must give it at 0.2.2. If npm has a newer version, write down which one was played.
- `advance` to day 1 starts the weather: its output ends with a line «Weather: …», the first score rolled with 1d6 on the summer table. `rpg weather` says the same with the scale of `weather-set`. The roll is the extension's, not a roll of the log, so `--prepared` accepts the campaign.
- The settings: rigor rules, so the rations are counted by the engine and the water is the master's to count, «a gallon each, two if the weather is hot» (5e `upkeep`); lethality dice; milestones; `voices master`, so that the run measures the weather and not the character agent; units metric, so degrees Celsius and kilometres.
- `world/`: 31 pages. `validate` finds no problems; `status` shows day 1, the 25th of August, summer, Corrado (hp 24, ac 18) in Vallerana with Mastra Ilde, the quest «Le erbe per Torralba» (deadline day 10, 18:00), and the event Il ritorno di Zaira (day 4, 18:00).
- With uncommitted changes in the repo, add `--uncommitted`. The dice have no seed: compare the moments, not the skies.

## The sessions

First the check, which plays nothing; then the sessions, from the repo; then the counts and the questionnaire:

```
$run = "<runs>\<date>\<n>"
node playtests/run-playtest.mjs --campaign "$run\cielo" --profile playtests\players\marco-lungo.md --out "$run\results" --prepared ..\rpg-engine-weatherplaytests\21-dieci-giorni-di-cielo\brief.md --first "Ciao! Si parte per Torralba, cominciamo?" --max 45 --check
node playtests/run-playtest.mjs --campaign "$run\cielo" --profile playtests\players\marco-lungo.md --out "$run\results" --prepared ..\rpg-engine-weatherplaytests\21-dieci-giorni-di-cielo\brief.md --first "Ciao! Si parte per Torralba, cominciamo?" --max 45
node playtests/run-playtest.mjs --campaign "$run\cielo" --profile playtests\players\marco-lungo.md --out "$run\results" --session 2 --first "Ciao, riprendiamo?" --max 45
node playtests/run-playtest.mjs --campaign "$run\cielo" --profile playtests\players\marco-lungo.md --out "$run\results" --session 3 --first "Ciao, riprendiamo?" --max 40 --dashboard
node playtests/count-playtest.mjs "$run\results" ..\rpg-engine-weatherplaytests\21-dieci-giorni-di-cielo\world > "$run\numbers.md"
node playtests/run-playtest.mjs --profile playtests\players\marco-lungo.md --out "$run\results" --questionnaire playtests\questionnaire.md
```

| Session | Days | Where |
|---|---|---|
| 1: the hills | 1–4 | Vallerana, the Strada dei Gelsi, the Locanda del Gelso, Sabbiedo; the wait, the market, Zaira's return on day 4 at 18:00 |
| 2: the desert | 5–7 | the Pista del Sale by night: the Pozzo delle Due Palme, the Cisterna d'Ambra with Ismaele, the Rocca del Varco; the storm |
| 3: the valley, with the dashboard | 8–10 | the flood, the choice of the way, Torralba |

A party faster than the table goes on to what comes next: session 2 may already reach the Rocca, session 3 may end early. Two sessions are enough when the desert is crossed in the first.

## The road

Positions in km east and north of Vallerana; normal pace, 4.5 km an hour, 8 hours a day.

- **Colli di Vallerana** (region, no climate: the seasons' table): Vallerana, the Strada dei Gelsi (Vallerana, 36 km, Locanda del Gelso, 36 km, Sabbiedo), Sabbiedo with its Caravanserraglio. Day 1 to the Locanda, about 15:00; day 2 to Sabbiedo, about 15:00.
- **Deserto d'Ambra** (region, `climate: torrid`, `biome: desert`, with `caldo` and `incontri` in its environment): the Pista del Sale (Sabbiedo, 30 km, Pozzo delle Due Palme, 34 km, Cisterna d'Ambra, 30 km, Rocca del Varco), the well and the cistern. The road is in the region's `contains`, so a party on it, or in a camp written `here` on it, reads the hot desert's table. With Zaira they march by night: off at 17:00 on day 5, the well about 23:40; off at 17:00 on day 6, the cistern about 00:30 on day 7; off at 17:00 on day 7, the Rocca about 23:40. Each dawn falls while they sleep at a water point.
- **Valle dell'Orsa** (region, no climate): the Rocca del Varco, where the Pista ends; the Strada della Valle (Rocca, 40 km, Osteria del Ponte, 40 km, Torralba), about 18 hours, arriving on day 10; the Sentiero della Gola (`path`: Rocca, 14 km, Gola del Lupo, 14 km, Torralba), about 6 hours.

The calendar: day 1 is the 25th of August; day 7 the 31st; day 8 the 1st of September, autumn. The hot desert's table is the same in every season; the season shows in the hills (summer: a heat wave at the bottom of the scale, a thunderstorm next to it) and in the valley (autumn: rain, wind, and fog on mornings that roll it).

## The story

Mastra Ilde, the apothecary of Vallerana, sends a case of dried herbs to Fra' Lucano at the hospital of Torralba before the September fevers: by day 10 at 18:00, dry.

- **Sabbiedo**: the guides are out with the caravans; Zaira is back on day 4 at sunset (event) and leaves on day 5 at sunset. Nobody else goes before the fair, but for 30 gp. The market has only six waterskins, a waxed cloth for the case, a shade cloth. Corrado may wait (the stop) or go alone.
- **The desert**: two gallons a day each, four waterskins; marching in the hot hours costs a Constitution save, with disadvantage in chain mail (Deserto d'Ambra#Il caldo). The sandstorm, «il vento rosso», only when the roll gives the bottom of the scale and the master takes it as a sandstorm rather than a scorching heat.
- **Il Pozzo delle Due Palme**: half silted (a secret): two waterskins an hour, or two hours of digging. **La Cisterna d'Ambra**: water enough, and Ismaele, a carter down with the heat: a day of care, or on the camel instead of half the water.
- **La Rocca del Varco**: soon after the arrival, the storm on the ridges (event, by condition): the weather the page gives, set at once and again at the next dawn, the morning of the 1st of September; the Gola del Lupo in flood until half a day after the last rain. Three ways to know the danger: Zaira#Le piene, Ismaele#La gola, Sergente Ada#Il torrente; and the dark lines on the gorge's walls. Zaira will not enter the gorge in the rain (a secret: her brother). The case of herbs must not get wet: the waxed cloth, or a choice.
- **The choice**: the gorge after noon, if the next sky holds, one day; the gorge at once, in the flood; or the valley road, safe, nearly three days, arriving on day 10 before the deadline only without delays.

## What to watch

Every moment below, in `dialogue.md` and `turns/`, and in `numbers.md`. The extension's lines are at the end of the outputs of `advance` and `travel`, and in the log as entries of type `extension`.

| | Moment | What should happen |
|---|---|---|
| W1 | Every dawn, days 2–10 (nine) | An output of `advance` or `travel` ends with «Weather this morning…» or «Weather over N mornings…». Count the dawns passed, the weather lines, and the lines told to the player: each new sky told, in a sentence or two, as what Corrado sees and feels; never the score, the scale or «il tiro del meteo dice» |
| W2 | The sky weighs | A sky that matters changes something the player can act on: the heat on the march and on the water, rain on the case of herbs and on the path, wind or a sandstorm on the pace and the camp, fog on the gorge's ledge. A sky told and then forgotten for the rest of the day is a finding; a mild sky in a line, no more |
| W3 | Water | In the desert the master counts four waterskins a day each, as the engine's «two if the weather is hot» and the region's page say; also in the hills on a day the roll makes hot. The totals right at the Rocca; the silted well bites |
| W4 | Fatigue | The Constitution save of «Il caldo» when Corrado walks or works in the hot hours, with disadvantage in chain mail, the stakes said before the roll; none for a night march. Exhaustion written on the sheet when it comes |
| W5 | The zone | On the Pista and at the well and the cistern, the extension's line says «(hot desert)»; at Sabbiedo and from the Rocca on, it does not. Into the desert and out of it at the Rocca, the first time passing there rolls the weather afresh: «Weather, into the hot desert: …», «Weather, out of the hot desert: …». A camp written with `write … here` on the Pista stays in the desert. A line that reads the wrong zone is a finding for the engine: note where the party was and which command passed the dawn |
| W6 | The season | Status and `advance` give the date with month and season; on day 8 the 1st of September, autumn, and the valley read on the autumn table. The master notices the change in the story if the sky shows it (a cooler morning, fog) |
| W7 | The stop at Sabbiedo | One `advance` over two or three dawns gives «Weather over N mornings»; the master tells the days in a few lines, not one sky each in full; the market and the wait still the player's choices |
| W8 | The storm at the Rocca | When the event comes due: `weather-set` with the score of rain on the scale `weather` gives (in summer 2, a thunderstorm), with a `why`; at the next dawn, autumn, again over the roll (2, rain), as play.md says; then the roll again once the page's storm is over. A storm told without `weather-set` is a finding: the world and the story apart |
| W9 | No bending | `weather-set` only for a spell or a page written before play (the storm), and back to what the dice gave when it ends, as `weather` says; never to spare the player a roll the master does not like, nor to make a sandstorm the dice did not give. Weather the master would like comes foretold by its signs, at the first dawn whose dice bring it: an event the master writes in play to set the sky is a finding. Count the calls and their reasons |
| W10 | The choice in the rain | The gorge, the wait, or the valley: the risk said before the choice (the flood, the case wet, the deadline), the three ways of knowing it there for the player to find, and the player choosing; whatever he chooses, the world holds (the flood's roll if he goes in) |
| W11 | `weather` | Called when the master needs the sky again (a new session, a question of the player), not after every output that already says it. Count the calls |
| W12 | Sessions 2 and 3 | A new master starts from the files: the sky of now from `weather` or the last line, the date, the water and the rations as the session before left them |
| W13 | Who travels | Zaira and Pazienza in `who` on every leg after Sabbiedo, or moved with the party; nobody left behind at a well |
| W14 | The page, session 3 | `page/`: the date with month and season in the header; whether the weather shows anywhere. The extensions' widget does not exist yet (PLAN, phase 4, step 6): what the page lacks is material for it, not the master's finding; note what the player asked about the sky that the page could have said |
| W15 | An uneventful day | One or two lines, with the sky in them |
