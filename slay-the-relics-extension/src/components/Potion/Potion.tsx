import { PowerTipStrip, Tip } from "../Tip/Tip";

const potionX = 33.3; // should come from the game PotionX / Settings.Width * 100
const POTION_HITBOX_WIDTH = 2.916; // %

function getPotionTips(potion: string): Tip[] {
  // This function should return an array of Tip objects based on the potion name
  // For now, we will return a dummy array
  if (!potion || potion === "") {
    return [new Tip("Potion slot", "No potion selected", null)];
  }

  return [new Tip(`Potion: ${potion}`, `Description for ${potion}`, null)];
}

export default function PotionBar(props: { potions: string[] }) {
  return (
    <div>
      {props.potions.map((potion, i) => {
        return (
          <PowerTipStrip
            key={"potion-" + i}
            magGlass={false}
            hitbox={{
              x: `${potionX - POTION_HITBOX_WIDTH / 2 + i * POTION_HITBOX_WIDTH}%`,
              y: "0%",
              z: 1,
              w: "2.916%",
              h: "5.556%",
            }}
            tips={getPotionTips(potion)}
          />
        );
      })}
    </div>
  );
}
