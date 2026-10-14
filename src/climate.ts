// The weather by the climate score, Stefano Caronia's system: a score from 1 to 6 that a morning roll moves, read on the table of the season, or of the
// zone in place of the season, and fog on cold days.

/** Where the party is, for the weather: a zone with seasons, or a hot desert or a polar cold that take their place. */
export type Zone = "temperate" | "torrid" | "polar";

/** The seasons the weather knows, as the calendar names them. */
export const seasons = ["winter", "spring", "summer", "autumn"] as const;

export type Season = (typeof seasons)[number];

/** What a score reads as: the sky, and the temperature by day, in °C. */
export interface Reading
{
    sky: string;
    low: number;
    high: number;
}

/** The fog of a cold morning. */
export type Fog = "heavy" | "light";

/** What a morning's roll made of the weather: the new score, whether the afternoon rolls again, and the fog it rolled. */
export interface Change
{
    score: number;
    variable: boolean;
    fog?: Fog;
}

// From 6, the mildest, to 1, an extreme.
const readings: Record<Season | Exclude<Zone, "temperate">, [string, number, number][]> = {
    winter: [
        ["clear and cool", 10, 15],
        ["sunny and cold", 5, 10],
        ["cloudy and cold", 0, 5],
        ["fine, cold rain", -2, 4],
        ["light or heavy snow", -5, 0],
        ["a snowstorm", -15, -5],
    ],
    spring: [
        ["clear and warm", 20, 25],
        ["sunny and mild", 15, 20],
        ["partly cloudy", 15, 20],
        ["cloudy with showers", 10, 15],
        ["rain", 10, 15],
        ["heavy rain and wind", 5, 10],
    ],
    summer: [
        ["clear with a breeze", 25, 30],
        ["clear and hot", 30, 35],
        ["sunny and hot", 25, 30],
        ["partly cloudy", 25, 30],
        ["a summer thunderstorm, or hail", 20, 25],
        ["a heat wave", 35, 42],
    ],
    autumn: [
        ["clear and mild", 20, 25],
        ["sunny and cool", 15, 20],
        ["partly cloudy", 10, 15],
        ["scattered rain", 10, 15],
        ["rain", 10, 15],
        ["strong wind", 5, 10],
    ],
    torrid: [
        ["partly cloudy and bearable", 20, 25],
        ["clear and hot", 25, 30],
        ["blazing sun", 30, 35],
        ["sultry heat", 35, 40],
        ["oppressive heat", 40, 45],
        ["a sandstorm, or scorching heat", 45, 50],
    ],
    polar: [
        ["clear and freezing", -10, -5],
        ["extreme cold", -15, -10],
        ["cloudy and frigid", -20, -15],
        ["light snow", -25, -20],
        ["heavy snow", -30, -25],
        ["a snowstorm", -35, -30],
    ],
};

/** What a score reads as in a season, or in a zone that takes the season's place. */
export function reading(score: number, season: Season, zone: Zone): Reading
{
    const [sky, low, high] = readings[zone === "temperate" ? season : zone][6 - score];
    return { sky, low, high };
}

/** Whether the cold column of the morning roll holds, with its fog: winter and autumn, and the polar zones; spring, summer and the hot deserts take the warm one. */
export function coldColumn(season: Season, zone: Zone): boolean
{
    return zone === "polar" || (zone === "temperate" && (season === "winter" || season === "autumn"));
}

/**
 * A morning: the roll of the change, 1d6, and the fog's when it comes. 1 worse; 2 variable, the afternoon rolls again; 3 variable on warm days, stable on cold
 * ones; 4 stable; 5 stable, but better after bad weather (1–2); 6 better, and on warm days better again after bad weather. Fog comes on cold days with 1 and 2.
 */
export function morningChange(score: number, cold: boolean, roll: () => number): Change
{
    const change = roll();
    const fog = cold && change <= 2 ? fogOf(roll()) : undefined;
    const variable = change === 2 || (change === 3 && !cold);
    return { score: moved(score, change, cold), variable, ...(fog === undefined ? {} : { fog }) };
}

/** The afternoon of a variable day: the change rolled again, where a 2 or a 3 keeps the weather as it is. */
export function afternoonChange(score: number, cold: boolean, roll: () => number): number
{
    const change = roll();
    return change === 2 || change === 3 ? score : moved(score, change, cold);
}

/** The score a change gives, never below 1 nor above 6. */
function moved(score: number, change: number, cold: boolean): number
{
    const bad = score <= 2;
    const step = change === 1 ? -1 : change === 5 ? (bad ? 1 : 0) : change === 6 ? (bad && !cold ? 2 : 1) : 0;
    return Math.min(6, Math.max(1, score + step));
}

/** The fog's roll, 1d6: 1 heavy, 2–3 light, 4–6 none. */
function fogOf(roll: number): Fog | undefined
{
    return roll === 1 ? "heavy" : roll <= 3 ? "light" : undefined;
}
