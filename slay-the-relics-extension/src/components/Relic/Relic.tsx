import { HitBox, PowerTipStrip, Tip } from "../Tip/Tip";
import { LocalizationContext, Relics } from "../Localization/Localization";
import { useContext } from "react";

const RELIC_HITBOX_WIDTH_PCT = 3.75;
const RELIC_HITBOX_LEFT_PCT = 1.458;
const RELIC_HITBOX_MULTIPAGE_OFFSET_PCT = 1.875;
const RELIC_PER_PAGE = 25;

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
    if (relicTip !== null) {
      return new RelicProp(relicTip.header, relicTip.description ?? "", []);
    }
    return new RelicProp(relic, relic, []);
  }

  const descriptions = [...relicLoc.DESCRIPTIONS];
  const params = [...relicParams];

  const descriptionParts = [];
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
  noExpand?: boolean;
}) {
  return (
    <PowerTipStrip
      character={props.character}
      magGlass={true}
      hitbox={props.hitbox}
      tips={props.relic.getTips()}
      place={"bottom-start"}
      noExpand={props.noExpand}
    />
  );
}

export function RelicBar(props: {
  character: string;
  relics: string[];
  relicParams: Record<number, (string | number)[]>;
  relicTips: Tip[];
  relicTipMap?: Record<string, Tip[]>;
  game?: string;
}) {
  const multiPage = props.relics.length > RELIC_PER_PAGE ? 1 : 0;
  const relicsLoc = useContext(LocalizationContext).relics;

  const hitboxLeft = props.game === "sts2" ? 1.0 : RELIC_HITBOX_LEFT_PCT;
  const hitboxY = props.game === "sts2" ? 7.5 : 6.111;
  const hitboxW = props.game === "sts2" ? 3.5 : 3.75;
  const hitboxH = props.game === "sts2" ? 8.0 : 8.666;
  const hitboxSpacing = props.game === "sts2" ? 3.5 : RELIC_HITBOX_WIDTH_PCT;

  return (
    <div id={"relic-bar"}>
      {props.relics.slice(0, RELIC_PER_PAGE).map((relic, i) => {
        const hitbox = {
          x:
            hitboxLeft +
            i * hitboxSpacing +
            multiPage * RELIC_HITBOX_MULTIPAGE_OFFSET_PCT +
            "%",
          y: hitboxY + "%",
          z: 1,
          w: hitboxW + "%",
          h: hitboxH + "%",
        };
        const relicParams = props.relicParams[i] || [];

        const relicTipMapEntry = props.relicTipMap?.[relic];
        const hasRelicTipMap = Boolean(
          relicTipMapEntry && relicTipMapEntry.length > 0,
        );
        const relicProp = hasRelicTipMap
          ? new RelicProp(
              relicTipMapEntry![0].header,
              relicTipMapEntry![0].description ?? "",
              relicTipMapEntry!.slice(1),
            )
          : LookupRelic(
              relic,
              relicParams,
              relicsLoc,
              props.relicTips?.[i] ?? null,
            );

        return (
          <Relic
            character={props.character}
            key={"relic-bar-" + i}
            hitbox={hitbox}
            relic={relicProp}
            noExpand={hasRelicTipMap}
          />
        );
      })}
    </div>
  );
}
