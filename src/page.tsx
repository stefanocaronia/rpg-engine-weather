// The weather's code in the dashboard's page (D-510): the sky of the chip in the top, and the band of the day's sky over the words of the Scene's card. Drawn
// with the page's tokens in style objects (the page's security keeps out <style>), without words: the sky, the temperature and the notes stay the page's,
// in the lead's words and the card's facts. Nothing loops: a sky is not waiting for the player.
import type { JSX } from "preact";
import { useState } from "preact/hooks";
import type { FigureProps, PageModule } from "rpg-engine/page";
import type { Sky } from "./index.ts";

/** The chip's sky: the icon of its kind, as the page strokes its own, and the morning's fog under it. */
function SkyFigure({ data }: FigureProps)
{
    const sky = data as Sky;
    const fogged = sky.fog !== null;
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
            <path d={icons[sky.icon] ?? icons.clear} style={{ ...stroke, ...(fogged ? { opacity: 0.55 } : {}) }} />
            {fogged && <path d={sky.fog === "heavy" ? "M3 16.5h18 M5 19.5h14 M3 22.5h18" : "M4 19.5h16 M6 22.5h12"} style={{ ...stroke, stroke: "var(--muted)" }} />}
        </svg>
    );
}

/**
 * The band of the day's sky: its ground and air in the season's colour, or the desert's and the ice's; the sun, the clouds, rain, snow, a storm or the wind
 * by its kind, as many clouds as the day is grey; the fog of the morning on its start; the afternoon that may change, past a dashed line, a cloud only
 * outlined; and the day's lowest to highest along its foot, on one scale from bitter cold to desert heat.
 */
function TodayFigure({ data }: FigureProps)
{
    const sky = data as Sky;
    const tint = tintOf(sky);
    const kind = sky.icon;
    const clouds = cloudsOf(kind, sky.score);
    const sun = kind === "clear" || kind === "partly" || kind === "heat" || kind === "cold";
    const fog = sky.fog;
    const id = useId();
    return (
        <svg viewBox="0 0 360 72" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
            <defs>
                <clipPath id={`${id}-band`}>
                    <rect x={0} y={0} width={360} height={72} rx={10} />
                </clipPath>
                <linearGradient id={`${id}-air`} x1={0} y1={0} x2={0} y2={1}>
                    <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${tint} 22%, var(--float))` }} />
                    <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${tint} 6%, var(--float))` }} />
                </linearGradient>
                <linearGradient id={`${id}-fog`} x1={0} y1={0} x2={1} y2={0}>
                    <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--muted) 55%, var(--float))", stopOpacity: fog === "heavy" ? 0.92 : 0.7 }} />
                    <stop offset="0.55" style={{ stopColor: "color-mix(in srgb, var(--muted) 55%, var(--float))", stopOpacity: fog === "heavy" ? 0.6 : 0.35 }} />
                    <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--muted) 55%, var(--float))", stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <g clip-path={`url(#${id}-band)`}>
                <rect x={0} y={0} width={360} height={72} style={{ fill: `url(#${id}-air)` }} />
                {sun && <Sun x={74} y={24} hot={kind === "heat" || sky.zone === "torrid"} pale={kind === "cold"} />}
                {kind === "cold" && <Glints />}
                {clouds.map((cloud, index) => <Cloud key={index} {...cloud} dark={kind === "rain" || kind === "storm" || kind === "snow"} />)}
                {kind === "rain" && <Fall shape="rain" from={clouds} />}
                {kind === "snow" && <Fall shape="snow" from={clouds} />}
                {kind === "storm" && (
                    <>
                        <Fall shape="rain" from={clouds} />
                        <path d="M196 30l-7 11h7l-5 10" style={{ fill: "none", stroke: "var(--gold)", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" }} />
                    </>
                )}
                {kind === "wind" && <path d="M40 22h150a8 8 0 1 0-8-8 M70 34h200a8 8 0 1 1-8 8 M30 46h110a6 6 0 1 1-6 6" style={{ ...stroke, stroke: "var(--muted)", strokeWidth: 1.8 }} />}
                <Ground sky={sky} tint={tint} />
                {(kind === "heat" || sky.zone === "torrid") && <Shimmer />}
                {(kind === "cold" || sky.zone === "polar" || sky.low <= freezing(sky)) && <Frost />}
                {fog !== null && <Fog heavy={fog === "heavy"} fill={`url(#${id}-fog)`} />}
                {sky.changes && <Afternoon />}
                <Range sky={sky} />
            </g>
            <rect x={0.75} y={0.75} width={358.5} height={70.5} rx={10} style={{ fill: "none", stroke: "var(--rule)", strokeWidth: 1.5 }} />
        </svg>
    );
}

const page: PageModule = { figures: { sky: SkyFigure, today: TodayFigure } };

export default page;

/** The icons of extension.yaml, the same skies the chip drew without page code. */
const icons: Record<string, string> = {
    clear: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z M12 2.5v2 M12 19.5v2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M2.5 12h2 M19.5 12h2 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4",
    partly: "M8.5 2.5v1.5 M3.5 7.5H2 M4.6 3.6l1 1 M12.4 3.6l-1 1 M5.6 10.6a3.5 3.5 0 0 1 6.2-3.5 M8 20h9a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.3 12.4a3.8 3.8 0 0 0-.3 7.6Z",
    cloudy: "M7 18.5h10a3.8 3.8 0 0 0 .5-7.57A5.8 5.8 0 0 0 6.4 9.8a4.4 4.4 0 0 0 .6 8.7Z",
    rain: "M7 14.5h10a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 6.6 6.5a4 4 0 0 0 .4 8Z M8.5 17.5l-1 3 M12.5 17.5l-1 3 M16.5 17.5l-1 3",
    storm: "M7 14.5h10a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 6.6 6.5a4 4 0 0 0 .4 8Z M12.5 16l-2 3h3l-2 3",
    snow: "M7 14.5h10a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 6.6 6.5a4 4 0 0 0 .4 8Z M8 18h.01 M12 18h.01 M16 18h.01 M10 21h.01 M14 21h.01",
    wind: "M3 8.5h10.5a2.5 2.5 0 1 0-2.5-2.5 M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5 M3 16.5h7a2 2 0 1 1-2 2",
    heat: "M12 3a2 2 0 0 1 2 2v8.5a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2Z M12 8v8 M18 5.5h2.5 M18 9h2.5",
    cold: "M12 2.5v19 M3.8 7.25l16.4 9.5 M3.8 16.75l16.4-9.5 M9.5 3.8l2.5 1.7 2.5-1.7 M9.5 20.2l2.5-1.7 2.5 1.7",
};

const stroke: JSX.CSSProperties = { fill: "none", stroke: "var(--accent)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

/** The colour of the day's air and ground: the season's, the desert's sand or the ice. */
function tintOf(sky: Sky): string
{
    return sky.zone === "torrid" ? "var(--season-summer)" : sky.zone === "polar" ? "var(--season-winter)" : `var(--season-${sky.season})`;
}

/** The clouds of a sky: one for a partly cloudy day, more the greyer it is; none on a clear one. */
function cloudsOf(kind: string, score: number): { x: number; y: number; size: number; }[]
{
    const all = [{ x: 124, y: 24, size: 1.1 }, { x: 186, y: 17, size: 1.3 }, { x: 240, y: 27, size: 1 }, { x: 72, y: 31, size: 0.9 }];
    const count = kind === "partly" ? 1 : kind === "cloudy" || kind === "rain" || kind === "storm" || kind === "snow" ? (score <= 2 ? 4 : 3) : kind === "wind" ? 1 : 0;
    return all.slice(0, count);
}

/** The sun, ringed; a little larger on a hot day, pale in the frost. */
function Sun({ x, y, hot, pale }: { x: number; y: number; hot: boolean; pale: boolean; })
{
    const rays = Array.from({ length: 8 }, (_, ray) => {
        const angle = (ray * Math.PI) / 4;
        const [inner, outer] = hot ? [14, 20] : [12, 17];
        return `M${x + Math.cos(angle) * inner} ${y + Math.sin(angle) * inner}L${x + Math.cos(angle) * outer} ${y + Math.sin(angle) * outer}`;
    }).join(" ");
    return (
        <g style={pale ? { opacity: 0.5 } : {}}>
            <circle cx={x} cy={y} r={hot ? 10 : 8.5} style={{ fill: "var(--gold)" }} />
            <path d={rays} style={{ stroke: "var(--gold)", strokeWidth: 2, strokeLinecap: "round" }} />
        </g>
    );
}

/** A cloud, three rounds on a flat foot; greyer when it rains or snows. */
function Cloud({ x, y, size, dark, outline }: { x: number; y: number; size: number; dark: boolean; outline?: boolean; })
{
    const d = `M${x - 22 * size} ${y + 8 * size}h${44 * size}a${9 * size} ${9 * size} 0 0 0 -2 -17.5a${13 * size} ${13 * size} 0 0 0 -24 -3a${10 * size} ${10 * size} 0 0 0 -18 20.5Z`;
    const fill = dark ? "color-mix(in srgb, var(--muted) 55%, var(--float))" : "color-mix(in srgb, var(--muted) 18%, var(--float))";
    return <path d={d} style={outline === true ? { fill: "none", stroke: "var(--muted)", strokeWidth: 1.5, strokeDasharray: "3 3" } : { fill, stroke: "var(--muted)", strokeWidth: 1.2 }} />;
}

/** What falls from the clouds: slanted strokes of rain, or flakes. */
function Fall({ shape, from }: { shape: "rain" | "snow"; from: { x: number; y: number; size: number; }[]; })
{
    const marks = from.flatMap((cloud) => [-14, -4, 6, 16].map((dx, index) => ({ x: cloud.x + dx * cloud.size, y: cloud.y + 14 * cloud.size + (index % 2) * 7 })));
    return shape === "rain"
        ? <path d={marks.map((mark) => `M${mark.x} ${mark.y}l-3 8`).join(" ")} style={{ stroke: "var(--accent)", strokeWidth: 1.6, strokeLinecap: "round", opacity: 0.85 }} />
        : <g style={{ fill: "var(--ink)", opacity: 0.7 }}>{marks.map((mark, index) => <circle key={index} cx={mark.x} cy={mark.y + 3} r={1.7} />)}</g>;
}

/** The ground: low hills in the day's colour, sand dunes in the desert, a flat field of ice at the pole. */
function Ground({ sky, tint }: { sky: Sky; tint: string; })
{
    const d = sky.zone === "torrid"
        ? "M0 58C40 50 70 50 110 57S180 62 220 54S300 50 360 57V72H0Z"
        : sky.zone === "polar"
        ? "M0 59H360V72H0Z"
        : "M0 60C50 52 90 54 140 59S230 56 280 58S340 56 360 58V72H0Z";
    return <path d={d} style={{ fill: `color-mix(in srgb, ${tint} 40%, var(--float))` }} />;
}

/** The heat's shimmer over the ground. */
function Shimmer()
{
    const waves = [150, 220, 290].map((x) => `M${x} 50q3 -3 6 0t6 0t6 0`).join(" ");
    return <path d={waves} style={{ fill: "none", stroke: "var(--low)", strokeWidth: 1.4, strokeLinecap: "round", opacity: 0.7 }} />;
}

/** Ice glinting in the bitter air. */
function Glints()
{
    const glints = [[140, 20], [196, 34], [250, 16], [300, 30], [118, 42]].map(([x, y]) => `M${x} ${y - 3}v6 M${x - 3} ${y}h6`).join(" ");
    return <path d={glints} style={{ fill: "none", stroke: "var(--season-winter)", strokeWidth: 1.4, strokeLinecap: "round" }} />;
}

/** Frost on the ground: small crystals. */
function Frost()
{
    const crystals = [40, 120, 210, 300].map((x) => `M${x} 53v6 M${x - 3} 54.5l6 3 M${x - 3} 57.5l6 -3`).join(" ");
    return <path d={crystals} style={{ fill: "none", stroke: "var(--season-winter)", strokeWidth: 1.3, strokeLinecap: "round" }} />;
}

/** The morning's fog: a veil over the start of the band, thinning towards noon, with its banks. */
function Fog({ heavy, fill }: { heavy: boolean; fill: string; })
{
    const banks = (heavy ? [30, 42, 54] : [44, 56]).map((y) => `M8 ${y}h${heavy ? 190 : 150}`).join(" ");
    return (
        <g>
            <rect x={0} y={0} width={270} height={72} style={{ fill }} />
            <path d={banks} style={{ fill: "none", stroke: "var(--muted)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.5 }} />
        </g>
    );
}

/** The afternoon that may change: past a dashed line, a cloud only outlined. */
function Afternoon()
{
    return (
        <g>
            <line x1={282} y1={8} x2={282} y2={58} style={{ stroke: "var(--muted)", strokeWidth: 1.2, strokeDasharray: "3 4" }} />
            <Cloud x={322} y={30} size={0.8} dark={false} outline />
        </g>
    );
}

/** The day's lowest to highest on one scale, from −20 °C to 45 °C, along the band's foot; a mark at freezing. */
function Range({ sky }: { sky: Sky; })
{
    const [cold, hot] = [-20, 45];
    const celsius = (value: number): number => (sky.unit === "°F" ? ((value - 32) * 5) / 9 : value);
    const at = (value: number): number => 16 + ((Math.min(hot, Math.max(cold, celsius(value))) - cold) / (hot - cold)) * 328;
    const zero = at(sky.unit === "°F" ? 32 : 0);
    return (
        <g>
            <line x1={16} y1={66} x2={344} y2={66} style={{ stroke: "color-mix(in srgb, var(--ink) 18%, transparent)", strokeWidth: 3, strokeLinecap: "round" }} />
            <line x1={zero} y1={63} x2={zero} y2={69} style={{ stroke: "var(--season-winter)", strokeWidth: 1.5 }} />
            <line x1={at(sky.low)} y1={66} x2={Math.max(at(sky.high), at(sky.low) + 1)} y2={66} style={{ stroke: "var(--accent)", strokeWidth: 4, strokeLinecap: "round" }} />
        </g>
    );
}

/** Freezing, in the sky's units. */
function freezing(sky: Sky): number
{
    return sky.unit === "°F" ? 32 : 0;
}

// Ids of each band's gradients and clip, one set per band drawn.
let drawn = 0;

/** An id of its own for each band, kept as it is drawn again. */
function useId(): string
{
    const [id] = useState(() => `today-${++drawn}`);
    return id;
}
