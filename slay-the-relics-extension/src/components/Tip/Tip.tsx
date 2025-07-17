import { CSSProperties, ReactNode, useId } from "react";
import { Tooltip } from "react-tooltip";

export type HitBox = {
  x: string;
  y: string;
  w: string;
  h: string;
  z: number | string;
};

export class Tip {
  header: string;
  description: string;
  img: string | null;

  constructor(header: string, description: string, img: string | null) {
    this.header = header;
    this.description = description;
    this.img = img;
  }
}

export function PowerTip(props: { tip: Tip }) {
  const headerImgClass =
    props.tip.img === null ? "powertip-header-noimg" : "powertip-header-wimg";

  return (
    <div className={"powertip powertip-shadow"}>
      <div className={"powertip-header outline-black " + headerImgClass}>
        {props.tip.header}
      </div>
      <div>{props.tip.description}</div>
    </div>
  );
}

export function Hitbox(props: {
  magGlass: boolean;
  hitbox: HitBox;
  children: ReactNode;
}) {
  let classes = "hitbox";
  if (props.magGlass) {
    classes += " mag-glass";
  }
  classes += " outline";
  const style: CSSProperties = {
    left: props.hitbox.x,
    top: props.hitbox.y,
    width: props.hitbox.w,
    height: props.hitbox.h,
    zIndex: props.hitbox.z,
  };
  const tooltipID = useId();

  return (
    <div className={classes} style={style} data-tooltip-id={tooltipID}>
      <Tooltip style={{ background: "transparent" }} id={tooltipID}>
        {props.children}
      </Tooltip>
    </div>
  );
}

export function PowerTipBlock(props: {
  magGlass: boolean;
  hitbox: HitBox;
  tips: Tip[];
}) {
  return (
    <Hitbox magGlass={props.magGlass} hitbox={props.hitbox}>
      <div
        className={"flex max-h-120 flex-col flex-wrap justify-start gap-0.5"}
      >
        {props.tips.map((tip: Tip, i: number) => {
          return <PowerTip key={"power-tip-block-item-" + i} tip={tip} />;
        })}
      </div>
    </Hitbox>
  );
}

export function PowerTipStrip(props: {
  magGlass: boolean;
  hitbox: HitBox;
  tips: Tip[];
}) {
  return (
    <Hitbox magGlass={props.magGlass} hitbox={props.hitbox}>
      {props.tips.map((tip, i) => {
        return <PowerTip key={"power-tip-strip-" + i} tip={tip} />;
      })}
    </Hitbox>
  );
}
