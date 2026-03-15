import { PowerTipStrip, Tip } from "../Tip/Tip";
import { LocalizationContext, Potions } from "../Localization/Localization";
import { useContext } from "react";

const POTION_HITBOX_WIDTH = 2.916; // %

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
  return (
    <div>
      {props.potions.map((potion, i) => {
        const tips = props.potionTips?.[i]
          ? [props.potionTips[i]]
          : getPotionTips(potion, hasBark, potionsLoc);
        const potionY = props.game === "sts2" ? "1.5%" : "0%";
        return (
          <PowerTipStrip
            place={"bottom-start"}
            character={props.character}
            key={"potion-" + i}
            magGlass={false}
            hitbox={{
              x: `${props.potionX - POTION_HITBOX_WIDTH / 2 + i * POTION_HITBOX_WIDTH}%`,
              y: potionY,
              z: 1,
              w: "2.916%",
              h: "5.556%",
            }}
            tips={tips}
          />
        );
      })}
    </div>
  );
}
