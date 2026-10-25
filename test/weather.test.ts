// The weather extension (D-257, D-427, D-436): the rules of the climate score, and the extension in a campaign, through the engine's commands, with dice given.
import fc from "fast-check";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCommandLine } from "../../../src/command-line.ts";
import { campaignWidgets } from "../../../src/commands/game-widgets.ts";
import type { Context } from "../../../src/core/context.ts";
import { inPlay, makeTempFolder, readLogFile, removeFolder, testContext } from "../../../test/support.ts";
import { afternoonChange, coldColumn, morningChange, reading } from "../src/climate.ts";

/** Dice that show these faces in turn. */
function faces(...values: number[]): () => number
{
    const left = [...values];

    return () => {
        const next = left.shift();

        if (next === undefined) {
            throw new Error("the test ran out of dice");
        }

        return next;
    };
}

describe("the climate score", () => {
    it("moves by the morning's roll, the warm column and the cold one apart, never past 1 or 6", () => {
        const cases: [number, boolean, number[], ReturnType<typeof morningChange>][] = [
            // 1: worse, with fog on cold days.
            [4, false, [1], { score: 3, variable: false }],
            [4, true, [1, 1], { score: 3, variable: false, fog: "heavy" }],
            [4, true, [1, 3], { score: 3, variable: false, fog: "light" }],
            [4, true, [1, 5], { score: 3, variable: false }],
            [1, false, [1], { score: 1, variable: false }],
            // 2: variable everywhere, with fog on cold days; 3 variable on warm days only.
            [4, false, [2], { score: 4, variable: true }],
            [4, true, [2, 2], { score: 4, variable: true, fog: "light" }],
            [4, false, [3], { score: 4, variable: true }],
            [4, true, [3], { score: 4, variable: false }],
            // 4 stable; 5 better only after bad weather; 6 better, and on warm days better again after bad weather.
            [4, false, [4], { score: 4, variable: false }],
            [4, false, [5], { score: 4, variable: false }],
            [2, true, [5], { score: 3, variable: false }],
            [4, true, [6], { score: 5, variable: false }],
            [2, true, [6], { score: 3, variable: false }],
            [2, false, [6], { score: 4, variable: false }],
            [6, false, [6], { score: 6, variable: false }],
        ];

        for (const [score, cold, rolled, expected] of cases) {
            expect(morningChange(score, cold, faces(...rolled)), `${score} ${cold ? "cold" : "warm"} ${rolled.join(",")}`).toEqual(expected);
        }

        fc.assert(fc.property(fc.integer({ min: 1, max: 6 }), fc.boolean(), fc.array(fc.integer({ min: 1, max: 6 }), { minLength: 2, maxLength: 2 }), (score, cold, rolled) => {
            const { score: after } = morningChange(score, cold, faces(...rolled));
            expect(after).toBeGreaterThanOrEqual(1);
            expect(after).toBeLessThanOrEqual(6);
            expect(Math.abs(after - score)).toBeLessThanOrEqual(2);
        }));
    });

    it("rolls again in the afternoon of a variable day, where a 2 or a 3 keeps it", () => {
        expect([1, 2, 3, 4, 5, 6].map((roll) => afternoonChange(2, false, faces(roll)))).toEqual([1, 2, 2, 2, 3, 4]);
        expect([1, 2, 3, 4, 5, 6].map((roll) => afternoonChange(4, true, faces(roll)))).toEqual([3, 4, 4, 4, 4, 5]);
    });

    it("reads a score on the season's table, or on the zone's in its place; deserts take the warm column, the polar cold the cold one", () => {
        expect(reading(4, "spring", "temperate")).toEqual({ sky: "partly cloudy", low: 15, high: 20 });
        expect(reading(1, "winter", "temperate")).toEqual({ sky: "a snowstorm", low: -15, high: -5 });
        expect(reading(6, "summer", "temperate")).toEqual({ sky: "clear with a breeze", low: 25, high: 30 });
        expect(reading(5, "autumn", "temperate")).toEqual({ sky: "sunny and cool", low: 15, high: 20 });
        expect(reading(4, "winter", "torrid")).toEqual({ sky: "blazing sun", low: 30, high: 35 });
        expect(reading(2, "summer", "polar")).toEqual({ sky: "heavy snow", low: -30, high: -25 });
        expect([coldColumn("winter", "temperate"), coldColumn("autumn", "temperate"), coldColumn("spring", "temperate"), coldColumn("winter", "torrid"), coldColumn("summer", "polar")])
            .toEqual([true, true, false, false, true]);
    });
});

describe("the weather in a campaign", () => {
    let folder: string;
    let context: Context;
    const rpg = (...args: string[]) => runCommandLine(args, context);

    const ok = async (...args: string[]): Promise<string> => {
        const result = await rpg(...args);
        expect(result.exitCode, result.output).toBe(0);
        return result.output;
    };

    /** A campaign of this system that uses the weather, the story starting on this day of the world, and these faces of the dice in turn. */
    async function campaign(system: string, start: string, ...rolled: number[]): Promise<void>
    {
        await ok("init", "--name", "Valle", "--language", "en", "--system", system, "--difficulty", "normal", "--lethality", "dice");
        inPlay(folder);
        appendFileSync(join(folder, "campaign.yaml"), `calendar-start: ${start}\nextensions:\n  "@rpgengine/weather": 0.1.0\n`);
        context.random = faces(...rolled);
    }

    beforeEach(() => {
        folder = makeTempFolder();
        context = testContext(folder);
    });

    afterEach(() => removeFolder(folder));

    it("begins with the game, rolling the season's score, and changes at each dawn, telling the master in advance's output", async () => {
        await campaign("5e", "14 April", 3, 2, 6);
        expect(await ok("advance", "--to", "day 1, 18:00")).toBe("The game starts on day 1, 18:00 (14 April, spring).\nWeather: cloudy with showers, 10 to 15 °C.");
        expect(await ok("advance", "--by", "6h")).toBe("day 1, 18:00 → day 2, 00:00 (15 April, spring).");
        expect(await ok("advance", "--by", "7h")).toBe("day 2, 00:00 → day 2, 07:00 (15 April, spring).\nWeather this morning: cloudy with showers, 10 to 15 °C, as before; it may change in the afternoon.");
        expect(await ok("weather")).toBe(
            "Now: cloudy with showers, 10 to 15 °C; it may change in the afternoon. Score 3 of 6. weather-set takes, this spring here: "
                + "6 clear and warm, 5 sunny and mild, 4 partly cloudy, 3 cloudy with showers, 2 rain, 1 heavy rain and wind.",
        );
        expect(await ok("advance", "--by", "8h")).toBe("day 2, 07:00 → day 2, 15:00 (15 April, spring).\nWeather this afternoon: partly cloudy, 15 to 20 °C, better.");
        expect(readFileSync(join(folder, "extensions", "weather", "state.yaml"), "utf8")).toContain("score: 4\nday: 2\n");
        expect(readLogFile(folder).filter((entry) => entry.type === "extension").map((entry) => entry.data.text)).toEqual(["weather begins at 3", "weather at 3", "weather at 4"]);
    });

    it("brings fog on cold mornings, and tells many mornings at once, the last as it is now", async () => {
        await campaign("5e", "10 January", 4, 1, 1, 4, 6);
        await ok("advance", "--to", "day 1, 08:00");
        expect(await ok("advance", "--by", "1d")).toBe("day 1, 08:00 → day 2, 08:00 (11 January, winter).\nWeather this morning: fine, cold rain, -2 to 4 °C, worse; heavy fog this morning.");
        expect(await ok("advance", "--by", "2d")).toBe("day 2, 08:00 → day 4, 08:00 (13 January, winter).\nWeather over 2 mornings: fine, cold rain, cloudy and cold; now cloudy and cold, 0 to 5 °C, better.");
    });

    it("reads the table of a hot desert where the party is, in the campaign's units", async () => {
        await campaign("ironsworn", "1 July", 4);
        await ok("write", "Kira", "--type", "character", "--set", "role=pc");
        await ok("write", "Dune Rosse", "--type", "place", "--add", "contains=[[Kira]]", "--add", "environment=biome: desert");
        await ok("config", "units", "imperial");
        expect(await ok("advance", "--to", "day 1, 10:00")).toBe("The game starts on day 1, 10:00 (1 July, summer).\nWeather (hot desert): blazing sun, 86 to 95 °F.");
    });

    it("rolls afresh when the party comes into another zone, or out of it, whatever the dawns on the way rolled", async () => {
        await campaign("ironsworn", "1 July", 4, 2, 6);
        await ok("write", "Kira", "--type", "character", "--set", "role=pc");
        await ok("write", "Colline", "--type", "place", "--add", "contains=[[Kira]]");
        await ok("write", "Dune Rosse", "--type", "place", "--add", "environment=biome: desert");
        expect(await ok("advance", "--to", "day 1, 10:00")).toBe("The game starts on day 1, 10:00 (1 July, summer).\nWeather: sunny and hot, 25 to 30 °C.");
        await ok("move", "Kira", "--to", "Dune Rosse");
        // Advance tells also what holds around Kira: only the weather's line is looked at.
        expect(await ok("advance", "--by", "1h")).toContain("\nWeather, into the hot desert: oppressive heat, 40 to 45 °C.");
        expect(await ok("advance", "--by", "1h")).not.toContain("Weather");
        await ok("move", "Kira", "--to", "Colline");
        expect(await ok("advance", "--by", "1d")).toContain("\nWeather, out of the hot desert: clear with a breeze, 25 to 30 °C.");
        expect(readLogFile(folder).filter((entry) => entry.type === "extension").map((entry) => entry.data.text))
            .toEqual(["weather begins at 4", "weather begins at 2 in the hot desert", "weather begins at 6 in the lands of the seasons"]);
    });

    it("is off while the story counts only days, said once, with how to have it", async () => {
        await campaign("5e", "day 1", 4);
        const off = "Weather: off while the story counts only days. It follows the season: to have it, start the story on a day of the world with config calendar-start, "
            + "as 14 April (with no wish of the player's, roll 1d12 for the month, then a die of its days: 1d31, 1d30, or 1d28 for February).";
        expect(await ok("advance", "--to", "day 1, 18:00")).toBe(`The game starts on day 1, 18:00.\n${off}`);
        expect(await ok("advance", "--by", "1d")).toBe("day 1, 18:00 → day 2, 18:00.");
        expect(await ok("weather")).toBe(off);
    });

    it("never stops the time for a state written wrongly by hand: it begins again", async () => {
        await campaign("5e", "14 April", 4, 2);
        await ok("advance", "--to", "day 1, 18:00");
        writeFileSync(join(folder, "extensions", "weather", "state.yaml"), "score: [1\n");
        expect(await ok("advance", "--by", "1d")).toMatch(/^day 1, 18:00 → day 2, 18:00 \(15 April, spring\)\.\nThe extension weather failed after the time passed: .*The time did pass: do not advance again/);
        writeFileSync(join(folder, "extensions", "weather", "state.yaml"), "score: 9\nday: 2\n");
        expect(await ok("advance", "--by", "1d")).toBe("day 2, 18:00 → day 3, 18:00 (16 April, spring).\nWeather: rain, 10 to 15 °C.");
    });

    it("keeps its score when the season changes, read on the new season's table", async () => {
        await campaign("5e", "28 February", 4, 4);
        expect(await ok("advance", "--to", "day 1, 18:00")).toBe("The game starts on day 1, 18:00 (28 February, winter).\nWeather: cloudy and cold, 0 to 5 °C.");
        expect(await ok("advance", "--by", "1d")).toBe("day 1, 18:00 → day 2, 18:00 (1 March, spring).\nWeather this morning: partly cloudy, 15 to 20 °C, as before.");
    });

    it("shows on the dashboard the sky in the top and today's weather in the Scene, in the campaign's language and units (D-502)", async () => {
        await campaign("5e", "10 January", 4, 2, 2, 4);
        expect(await campaignWidgets(folder, context)).toEqual([
            expect.objectContaining({ id: "weather.now", place: "top", title: "Weather" }),
            expect.objectContaining({ id: "weather.today", place: "page", page: "scene" }),
        ]);
        expect((await campaignWidgets(folder, context)).some((widget) => widget.shows !== undefined)).toBe(false);

        await ok("advance", "--to", "day 1, 05:00");
        await ok("advance", "--by", "2h");
        const [now, today] = await campaignWidgets(folder, context);
        const range = { from: 0, to: 5, unit: "°C" };
        expect(now.shows).toEqual({ icon: expect.any(String), chip: { text: "{range}", values: { range } }, says: { text: "{sky}, {range}", values: { sky: "cloudy and cold", range } } });
        expect(today.shows?.parts).toEqual([{ lead: "Cloudy and cold", icon: now.shows?.icon, value: range }, { facts: ["Light fog this morning", "It may change in the afternoon"] }]);

        await ok("config", "language", "it");
        await ok("config", "units", "imperial");
        const [italian, card] = await campaignWidgets(folder, context);
        expect(italian).toMatchObject({ title: "Meteo", from: "il meteo secondo il punteggio del clima, di Stefano Caronia" });
        expect(italian.shows?.says).toEqual({ text: "{sky}, {range}", values: { sky: "nuvoloso e freddo", range: { from: 32, to: 41, unit: "°F" } } });
        expect(card.shows?.parts?.[0]).toMatchObject({ lead: "Nuvoloso e freddo" });
        expect(card.shows?.parts?.[1]).toEqual({ facts: ["Nebbia leggera stamattina", "Può cambiare nel pomeriggio"] });

        // Past noon the fog is gone, and past the afternoon's roll it changes no more today.
        await ok("advance", "--by", "8h");
        expect((await campaignWidgets(folder, context))[1].shows?.parts).toHaveLength(1);
    });

    it("is set by the master when the story changes it, until the next dawn", async () => {
        await campaign("5e", "14 April", 4, 4);
        await ok("advance", "--to", "day 1, 18:00");
        expect(await ok("weather-set", "1", "--why", "the druid's storm")).toBe("Now: heavy rain and wind, 5 to 10 °C. Score 1 of 6.");
        expect(readLogFile(folder).at(-1)?.data).toEqual({ extension: "weather", text: "weather set to 1: the druid's storm" });
        expect((await rpg("weather-set", "7")).exitCode).toBe(1);
        expect(await ok("advance", "--by", "13h")).toBe("day 1, 18:00 → day 2, 07:00 (15 April, spring).\nWeather this morning: heavy rain and wind, 5 to 10 °C, as before.");
    });

    it("sets the morning's fog apart from the score, keeping what is not given, and never past noon", async () => {
        await campaign("5e", "10 January", 4, 1, 1);
        await ok("advance", "--to", "day 1, 18:00");
        expect(await ok("advance", "--by", "13h")).toBe("day 1, 18:00 → day 2, 07:00 (11 January, winter).\nWeather this morning: fine, cold rain, -2 to 4 °C, worse; heavy fog this morning.");
        expect(await ok("weather-set", "2")).toBe("Now: light or heavy snow, -5 to 0 °C; heavy fog this morning. Score 2 of 6.");
        expect(await ok("weather-set", "--fog", "none")).toBe("Now: light or heavy snow, -5 to 0 °C. Score 2 of 6.");
        expect(await ok("weather-set", "--fog", "light", "--why", "the valley's page")).toBe("Now: light or heavy snow, -5 to 0 °C; light fog this morning. Score 2 of 6.");
        expect(readLogFile(folder).filter((entry) => entry.type === "extension").map((entry) => entry.data.text).slice(-3))
            .toEqual(["weather set to 2", "weather set to fog none", "weather set to fog light: the valley's page"]);
        expect((await rpg("weather-set")).exitCode).toBe(1);
        await ok("advance", "--by", "6h");
        expect((await rpg("weather-set", "--fog", "heavy")).output).toContain("past noon");
    });
});
