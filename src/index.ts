// The weather extension's code: each dawn the weather changes by the climate score, and at 14:00 again on a variable day, as advance and travel let time pass;
// weather says it, weather-set changes it when the story does. The rules are in climate.ts.
import type { ExtensionEntry, Game, GameMoment } from "rpg-engine";
import { afternoonChange, coldColumn, type Fog, morningChange, reading, type Season, seasons, type Zone } from "./climate.ts";

/**
 * What the weather keeps in the campaign: the score, the day it was rolled for, whether its afternoon rolls again, and its morning's fog; or that it is off,
 * while the story counts only days.
 */
type WeatherState = { score: number; day: number; variable?: boolean; fog?: Fog; } | { off: true; };

/** A moment the weather changes at: a dawn or the afternoon of a day. */
interface Turn
{
    day: number;
    kind: "dawn" | "afternoon";
}

const dawn = 6 * 60;
const afternoon = 14 * 60;
const dayMinutes = 24 * 60;
// How many skies of many mornings the output names: the last ones.
const shownSkies = 7;

const weather: ExtensionEntry = ({ z }) => ({
    commands: [
        {
            name: "weather",
            description: "The weather where the party is now: the sky, the temperature, the fog of the morning, whether it may change in the afternoon, and the scale "
                + "weather-set takes in this season and place. Advance and travel already tell it as it changes, each dawn: call this when you need it again. Read-only.",
            input: z.object({}),
            readOnly: true,
            run: (_input, game) => nowText(game, true),
        },
        {
            name: "weather-set",
            description: "Set the weather, when the story changes it (a spell, a storm you decide): its score on the scale weather gives for this season and place, "
                + "from 6, the mildest, to 1, its extreme, which in summer is a heat wave. It changes again at the next dawn. Example: weather-set 2, why the druid's storm.",
            input: z.object({
                // A number, as the command line gives it in words too.
                score: z.preprocess((value) => (typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : value), z.int().min(1).max(6))
                    .describe("from 6, the mildest, to 1, the season's extreme, as weather lists them"),
                why: z.string().optional().describe("why it changes, for the log"),
            }),
            positionals: ["score"],
            run: (input, game) => {
                const now = game.now();

                if (now === undefined) {
                    return "No weather yet: it begins when the game has its date, with advance to.";
                }

                game.state.write({ score: input.score, day: now.day } satisfies WeatherState);
                game.log(`weather set to ${input.score}${input.why === undefined ? "" : `: ${input.why}`}`);
                return nowText(game, false);
            },
        },
    ],
    timePassed: ({ from, to }, game) => {
        const state = readState(game);

        // As the game starts, or the extension comes to a game going on: the score of the season, 1d6.
        if (state === undefined || "off" in state) {
            return begin(game, to, state !== undefined);
        }

        const turns = turnsBetween(from, to);
        return turns.length === 0 ? [] : change(game, state, turns, to);
    },
});

export default weather;

/** The weather as it begins, with its season; off, said once, while the story counts only days. */
function begin(game: Game, at: GameMoment, saidOff: boolean): string[]
{
    const season = seasonOf(game, at.day);

    if (season === undefined) {
        game.state.write({ off: true } satisfies WeatherState);
        return saidOff ? [] : [offText];
    }

    if (!isSeason(season)) {
        return [season];
    }

    const score = game.roll("1d6").total;
    game.state.write({ score, day: at.day } satisfies WeatherState);
    game.log(`weather begins at ${score}`);
    return [`Weather${zoneText(zoneOf(game))}: ${readingText(game, score, season)}.`];
}

/** The dawns and afternoons that came: each dawn rolls the change, each afternoon of a variable day rolls it again; the output tells the last of them. */
function change(game: Game, kept: { score: number; day: number; variable?: boolean; fog?: Fog; }, turns: Turn[], to: GameMoment): string[]
{
    const zone = zoneOf(game);
    let state = kept;
    let before = kept.score;
    let last: { turn: Turn; season: Season; } | undefined;
    const skies: string[] = [];

    for (const turn of turns) {
        const season = seasonOf(game, turn.day);

        if (season === undefined || !isSeason(season)) {
            return [season ?? offText];
        }

        const cold = coldColumn(season, zone);
        const roll = (): number => game.roll("1d6").total;

        if (turn.kind === "dawn") {
            before = state.score;
            const changed = morningChange(state.score, cold, roll);
            state = { score: changed.score, day: turn.day, ...(changed.variable ? { variable: true } : {}), ...(changed.fog === undefined ? {} : { fog: changed.fog }) };
            skies.push(reading(state.score, season, zone).sky);
        } else if (state.variable === true && state.day === turn.day) {
            before = state.score;
            state = { score: afternoonChange(state.score, cold, roll), day: turn.day, ...(state.fog === undefined ? {} : { fog: state.fog }) };
        } else {
            continue;
        }

        last = { turn, season };
    }

    game.state.write(state);

    if (last === undefined) {
        return [];
    }

    game.log(`weather at ${state.score}`);
    const now = `${readingText(game, state.score, last.season)}, ${trendText(before, state.score)}${morningNotes(state, last.turn, to)}`;

    if (skies.length > 1) {
        const named = skies.length > shownSkies ? `…, ${skies.slice(-shownSkies).join(", ")}` : skies.join(", ");
        return [`Weather over ${skies.length} mornings${zoneText(zone)}: ${named}; now ${now}.`];
    }

    return [`Weather ${last.turn.kind === "dawn" ? "this morning" : "this afternoon"}${zoneText(zone)}: ${now}.`];
}

/** What the weather command says: now, and, for the master, the scale weather-set takes. */
function nowText(game: Game, withScale: boolean): string
{
    const state = readState(game);
    const now = game.now();

    if (now === undefined || state === undefined) {
        return "No weather yet: it begins when the game has its date, with advance to.";
    }

    const season = seasonOf(game, now.day);

    if ("off" in state || season === undefined) {
        return offText;
    }

    if (!isSeason(season)) {
        return season;
    }

    const zone = zoneOf(game);
    const today = state.day === now.day ? morningNotes(state, { day: now.day, kind: "dawn" }, now) : "";
    const scale = [6, 5, 4, 3, 2, 1].map((score) => `${score} ${reading(score, season, zone).sky}`).join(", ");
    return `Now${zoneText(zone)}: ${readingText(game, state.score, season)}${today}. Score ${state.score} of 6.${withScale ? ` weather-set takes, this ${season} here: ${scale}.` : ""}`;
}

/** The fog of this morning, and whether the afternoon may change it, while it is still to come. */
function morningNotes(state: { day: number; variable?: boolean; fog?: Fog; }, last: Turn, to: GameMoment): string
{
    const minute = to.minute ?? 0;
    const fog = state.fog !== undefined && to.day === state.day && minute < 12 * 60 ? `; ${state.fog} fog this morning` : "";
    const later = state.variable === true && to.day === state.day && minute < afternoon && last.kind === "dawn" ? "; it may change in the afternoon" : "";
    return `${fog}${later}`;
}

/** The sky and the temperature, in the campaign's units. */
function readingText(game: Game, score: number, season: Season): string
{
    const { sky, low, high } = reading(score, season, zoneOf(game));
    const imperial = game.units() === "imperial";
    const degrees = (celsius: number): number => (imperial ? Math.round(celsius * 9 / 5 + 32) : celsius);
    return `${sky}, ${degrees(low)} to ${degrees(high)} °${imperial ? "F" : "C"}`;
}

function trendText(before: number, after: number): string
{
    return after > before ? "better" : after < before ? "worse" : "as before";
}

function zoneText(zone: Zone): string
{
    return zone === "torrid" ? " (hot desert)" : zone === "polar" ? " (polar cold)" : "";
}

/** The zone where the party is: the climate its places say, or a desert's or snow's biome; elsewhere the seasons hold. */
function zoneOf(game: Game): Zone
{
    const environment = Object.fromEntries(Object.entries(game.party()?.environment ?? {}).map(([name, value]) => [name.toLowerCase(), value.toLowerCase()]));
    const said = environment.climate ?? environment.biome ?? "";
    return /desert|torrid|hot/.test(said) ? "torrid" : /polar|snow|arctic|glacier|high mountain/.test(said) ? "polar" : "temperate";
}

/** The season of a day; text that says why there is none, when the calendar's seasons are not the weather's; undefined while the story counts only days. */
function seasonOf(game: Game, day: number): string | undefined
{
    const date = game.calendarDay(day);

    if (date === undefined) {
        return undefined;
    }

    const season = date.season?.toLowerCase();
    return season !== undefined && isSeason(season)
        ? season
        : `Weather: it knows the seasons ${seasons.join(", ")}, and the calendar gives ${date.month} ${season === undefined ? "none" : `the season ${season}`}: give the campaign's calendar these seasons.`;
}

function isSeason(season: string): season is Season
{
    return (seasons as readonly string[]).includes(season);
}

const offText = "Weather: off while the story counts only days. It follows the season: to have it, start the story on a day of the world with config calendar-start, "
    + "as 14 April (with no wish of the player's, roll 1d12 for the month, then a die of its days: 1d31, 1d30, or 1d28 for February).";

/** The dawns and the afternoons after one moment and up to another, in order. */
function turnsBetween(from: GameMoment, to: GameMoment): Turn[]
{
    const minute = (moment: GameMoment): number => (moment.day - 1) * dayMinutes + (moment.minute ?? 0);
    const [start, end] = [minute(from), minute(to)];
    const turns: Turn[] = [];

    for (let day = from.day; day <= to.day; day += 1) {
        for (const [kind, at] of [["dawn", dawn], ["afternoon", afternoon]] as const) {
            const when = (day - 1) * dayMinutes + at;

            if (when > start && when <= end) {
                turns.push({ day, kind });
            }
        }
    }

    return turns;
}

/** The state as kept; undefined when there is none, or what is written there is not one, as by hand. */
function readState(game: Game): WeatherState | undefined
{
    const state = game.state.read() as Record<string, unknown> | null;

    if (state === null || typeof state !== "object") {
        return undefined;
    }

    if (state.off === true) {
        return { off: true };
    }

    const { score, day } = state;
    const whole = (value: unknown, least: number, most: number): boolean => typeof value === "number" && Number.isInteger(value) && value >= least && value <= most;
    return whole(score, 1, 6) && whole(day, 1, Number.MAX_SAFE_INTEGER)
        ? {
            score: score as number,
            day: day as number,
            ...(state.variable === true ? { variable: true } : {}),
            ...(state.fog === "heavy" || state.fog === "light" ? { fog: state.fog } : {}),
        }
        : undefined;
}
