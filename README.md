# Weather by the climate score

An extension for [RPG Engine](https://github.com/stefanocaronia/rpg-engine): the weather where the party is changes each dawn by a roll of a climate score from 1, an extreme, to 6, the mildest, read on the table of the season, of hot deserts or of polar cold, with fog on cold mornings and afternoons that may turn on variable days, and rolled afresh when the party comes into a desert or the polar cold, or out of it. The master tells it as the sky; the engine keeps it. On the dashboard the sky and the temperature stand in the top, and today's weather is a card in the Scene; the player moves them in Settings.

This package works only inside [RPG Engine](https://github.com/stefanocaronia/rpg-engine): it is an extension the engine installs into a campaign, not a library of its own.

## Install

From a campaign, with RPG Engine 0.5.0 or later: `rpg package install weather`, or ask the master to install it. The story needs to start on a day of the world (`config calendar-start "14 April"`), for the season. It works with any game system.

## Develop and test

You need Node 22.4 or later, and the engine for its test kit, `rpg-engine/testing`:

```sh
npm install
npm test
```

`npm test` builds `dist/` first: the kit runs the extension as the engine installs it. To test against an engine you are changing, link it: `npm link` in the engine's folder, then `npm link rpg-engine` here; or keep the engine beside this repository and run `npm run test:downstream` from it, which builds the engine and runs these tests against it. `npm run lint` checks the types.

## Playtests

`playtests/` holds a scenario an AI master and an AI player play with the extension, a ten-day journey through hills, a hot desert and a storm. It is played with the runner of the engine's repo, beside this one: its `start.md` says how.

## Publish

Raise `version` in `package.json`, commit, and push a tag `v<version>`: the workflow `publish.yml` checks, builds, tests and publishes to npm with Trusted Publishing, from the environment `release`.

## Licence

Weather by the climate score, by Stefano Caronia, CC BY 4.0; its code is under MIT: see [LICENSE.md](LICENSE.md).
