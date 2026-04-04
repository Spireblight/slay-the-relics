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
  relicTip: Tip | null,
): RelicProp {
  const relicLoc = relicsLoc[relic];
  if (relicLoc === undefined || relicLoc === null) {
    // No localization available — use the mod-provided tip if we have one
    if (relicTip !== null) {
      return new RelicProp(relicTip.header, relicTip.description ?? "", []);
    }
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
  const name = relicLoc.NAME ?? relic;
  return new RelicProp(name, description, relicTip === null ? [] : [relicTip]);
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
  relicTips: Tip[];
  game?: string;
}) {
  const multiPage = props.relics.length > RELIC_PER_PAGE ? 1 : 0;
  const relicsLoc = useContext(LocalizationContext).relics;

  // STS2 relics are in the top bar but offset differently
  const hitboxLeft = props.game === "sts2" ? 1.0 : RELIC_HITBOX_LEFT;
  const hitboxY = props.game === "sts2" ? 7.5 : 6.111;
  const hitboxW = props.game === "sts2" ? 3.5 : 3.75;
  const hitboxH = props.game === "sts2" ? 8.0 : 8.666;
  const hitboxSpacing = props.game === "sts2" ? 3.5 : RELIC_HITBOX_WIDTH;

  return (
    <div id={"relic-bar"}>
      {props.relics.slice(0, RELIC_PER_PAGE).map((relic, i) => {
        const hitbox = {
          x:
            hitboxLeft +
            i * hitboxSpacing +
            multiPage * RELIC_HITBOX_MULTIPAGE_OFFSET +
            "%",
          y: hitboxY + "%",
          z: 1,
          w: hitboxW + "%",
          h: hitboxH + "%",
        };
        const relicParams = props.relicParams[i] || [];
        const lookupRelicTip = (i: number) => {
          if (!props.relicTips) {
            return null;
          }
          if (props.relicTips.length > i) {
            return props.relicTips[i];
          }
          return null;
        };

        return (
          <Relic
            character={props.character}
            key={"relic-bar-" + i}
            hitbox={hitbox}
            relic={LookupRelic(
              relic,
              relicParams,
              relicsLoc,
              lookupRelicTip(i),
            )}
          />
        );
      })}
    </div>
  );
}
