// The weather's code in the dashboard's page (D-510): the sky of the chip in the top, and the band of the sky in the Scene's card, from the data of its
// widgets. A stand-in for now, drawn with the page's tokens, which the full drawing takes the place of.
import type { FigureProps, PageModule } from "rpg-engine/page";
import type { Sky } from "./index.ts";

/** The sky of the chip: for now a disc, fuller the milder the day. */
function SkyFigure({ data, size }: FigureProps)
{
    const sky = data as Sky;
    return (
        <svg class="sky" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <circle cx={size.width / 2} cy={size.height / 2} r={(size.height / 2 - 2) * (sky.score / 6)} />
        </svg>
    );
}

/** The band of the Scene's card: for now a bar as long as the day is mild, and a veil while the morning's fog lasts. */
function TodayFigure({ data, size }: FigureProps)
{
    const sky = data as Sky;
    return (
        <svg class="today" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <rect class="day" x={0} y={size.height / 3} width={(size.width * sky.score) / 6} height={size.height / 3} />
            {sky.fog !== null && <rect class={`fog ${sky.fog}`} x={0} y={0} width={size.width} height={size.height} />}
        </svg>
    );
}

const page: PageModule = { figures: { sky: SkyFigure, today: TodayFigure } };

export default page;
