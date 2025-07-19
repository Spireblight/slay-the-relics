import { HitBox, PowerTipStrip, Tip } from "../Tip/Tip";
import { LocalizationContext, Relics } from "../Localization/Localization";
import { useContext } from "react";

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

export function LookupRelic(
  relic: string,
  relicParams: (string | number)[],
  relicsLoc: Relics,
): RelicProp {
  const relicLoc = relicsLoc[relic];
  if (relicLoc === undefined || relicLoc === null) {
    return new RelicProp(relic, relic, []);
  }

  const descriptions = [...relicLoc.DESCRIPTIONS];
  const params = [...relicParams];

  const descriptionParts = [];
  // append to descriptionParts alternating between text and parameters
  while (descriptions.length > 0 || params.length > 0) {
    const des = descriptions.shift();
    if (des !== undefined) {
      descriptionParts.push(des);
    }
    const param = params.shift();
    if (param !== undefined) {
      descriptionParts.push(param);
    }
  }

  const description = descriptionParts.join("");
  return new RelicProp(relic, description, []);
}

export function Relic(props: {
  character: string;
  relic: RelicProp;
  hitbox: HitBox;
}) {
  return (
    <PowerTipStrip
      character={props.character}
      magGlass={true}
      hitbox={props.hitbox}
      tips={props.relic.getTips()}
      place={"bottom-start"}
    />
  );
}

export function RelicBar(props: {
  character: string;
  relics: string[];
  relicParams: Record<number, (string | number)[]>;
}) {
  const multiPage = props.relics.length > RELIC_PER_PAGE ? 1 : 0;
  const relicsLoc = useContext(LocalizationContext).relics;
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
        const relicParams = props.relicParams[i] || [];
        return (
          <Relic
            character={props.character}
            key={"relic-bar-" + i}
            hitbox={hitbox}
            relic={LookupRelic(relic, relicParams, relicsLoc)}
          />
        );
      })}
    </div>
  );
}
