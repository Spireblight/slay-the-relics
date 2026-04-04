import { PowerTipStrip, Tip } from "../Tip/Tip";
import { LocalizationContext, Potions } from "../Localization/Localization";
import { useContext } from "react";

const POTION_HITBOX_WIDTH = 2.916; // %
const POTION_HITBOX_WIDTH_STS2 = 3.22; // %

function getPotionTips(
  potion: string,
  hasBark: boolean,
  potionsLoc: Potions,
): Tip[] {
  const potionLoc = potionsLoc[potion || "Potion Slot"];
  if (!potionLoc) {
    return [new Tip(potion, "unknown potion", null)];
  }

  let description = potionLoc.DESCRIPTIONS[0];
  if (hasBark && potionLoc.DESCRIPTIONS.length > 1) {
    description = potionLoc.DESCRIPTIONS[1];
  }

  return [new Tip(potionLoc.NAME, description, null)];
}

export default function PotionBar(props: {
  character: string;
  potions: string[];
  relics: string[];
  potionX: number;
  potionTips?: Tip[];
  game?: string;
}) {
  const hasBark =
    props.relics.includes("Sacred Bark") || props.relics.includes("SacredBark");
  const potionsLoc = useContext(LocalizationContext).potions;
  const isSts2 = props.game === "sts2";
  const potionY = isSts2 ? "1.5%" : "0%";
  const hitboxW = isSts2 ? POTION_HITBOX_WIDTH_STS2 : POTION_HITBOX_WIDTH;
  const offsetPx = isSts2 ? 4 : 0;
  return (
    <div>
      {props.potions.map((potion, i) => {
        const tips = props.potionTips?.[i]
          ? [props.potionTips[i]]
          : getPotionTips(potion, hasBark, potionsLoc);
        return (
          <PowerTipStrip
            place={"bottom-start"}
            character={props.character}
            key={"potion-" + i}
            magGlass={false}
            hitbox={{
              x: `calc(${props.potionX - hitboxW / 2 + i * hitboxW}% - ${offsetPx}px)`,
              y: potionY,
              z: 1,
              w: `${hitboxW}%`,
              h: "5.556%",
            }}
            tips={tips}
          />
        );
      })}
    </div>
  );
}
