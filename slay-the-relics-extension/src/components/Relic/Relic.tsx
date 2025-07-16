import { HitBox, PowerTipStrip, Tip } from "../Tip/Tip";

const RELIC_HITBOX_WIDTH = 3.75; //%
const RELIC_HITBOX_LEFT = 1.458; //%
const RELIC_HITBOX_MULTIPAGE_OFFSET = 1.875; //%
const RELIC_PER_PAGE = 25; //count

export class RelicProp {
  name: string;
  description: string;
  additionalTips: Tip[];

  constructor(name: string, description: string, additionalTips: Tip[]) {
    this.name = name;
    this.description = description;
    this.additionalTips = additionalTips;
  }

  getTips(): Tip[] {
    return [new Tip(this.name, this.description, null)].concat(
      this.additionalTips,
    );
  }
}

export function LookupRelic(relic: string): RelicProp {
  switch (relic) {
    case "akabeko":
      return new RelicProp("Akabeko", "mu", []);
    default:
      return new RelicProp(relic, relic, []);
  }
}

export function Relic(props: { relic: RelicProp; hitbox: HitBox }) {
  return (
    <PowerTipStrip
      magGlass={true}
      hitbox={props.hitbox}
      tips={props.relic.getTips()}
    />
  );
}

export function RelicBar(props: { relics: string[] }) {
  const multiPage = props.relics.length > RELIC_PER_PAGE ? 1 : 0;
  return (
    <div id={"relic-bar"}>
      {props.relics.slice(0, RELIC_PER_PAGE).map((relic, i) => {
        const hitbox = {
          x:
            RELIC_HITBOX_LEFT +
            i * RELIC_HITBOX_WIDTH +
            multiPage * RELIC_HITBOX_MULTIPAGE_OFFSET +
            "%",
          y: 6.111 + "%",
          z: 1,
          w: 3.75 + "%",
          h: 8.666 + "%",
        };
        return (
          <Relic
            key={"relic-bar-" + i}
            hitbox={hitbox}
            relic={LookupRelic(relic)}
          />
        );
      })}
    </div>
  );
}
