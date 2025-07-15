import { CSSProperties, ReactNode, useState } from "react";

export type HitBox = {
  x: string;
  y: string;
  w: string;
  h: string;
  z: number | string;
};

const REM_PX = 21.6;

const POTION_HITBOX_WIDTH = 2.916; // %
const POWERTIP_WIDTH = 16.406; //%
const POWERTIP_WIDTH_REM = 14.583; //%
const MAX_POWERTIP_MULTICOL_HEIGHT = 70.0; //%
const POWERTIP_BOTTOM_MARGIN = 0.365; //%
const MULTICOL_COLUMN_RIGHT_MARGIN = 0.469; //% - don't mess with this number or the columns won't be separated

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

export function PowerTip(props: {
  tip: Tip;
  offset: { x: string; y: string };
}) {
  const headerImgClass =
    props.tip.img === null ? "powertip-header-noimg" : "powertip-header-wimg";
  const additionalStyles: CSSProperties = {
    left: props.offset.x,
    top: props.offset.y,
  };

  return (
    <div className={"powertip"} style={additionalStyles}>
      <div className={"powertip-header outline " + headerImgClass}>
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
  const style: CSSProperties = {
    left: props.hitbox.x,
    top: props.hitbox.y,
    width: props.hitbox.w,
    height: props.hitbox.h,
    zIndex: props.hitbox.z,
  };
  const [shouldShow, setShouldShow] = useState(false);

  return (
    <div
      className={classes}
      style={style}
      onMouseEnter={() => setShouldShow(true)}
      onMouseLeave={() => setShouldShow(false)}
    >
      {shouldShow && props.children}
    </div>
  );
}

export function PowerTipBlock(props: {
  magGlass: boolean;
  hitbox: HitBox;
  tips: Tip[];
  offset: { x: string; y: string };
}) {
  const chunkSize = 4;
  const chunks: Tip[][] = [];
  for (let i = 0; i < props.tips.length; i += chunkSize) {
    const chunk = props.tips.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  return (
    <Hitbox magGlass={props.magGlass} hitbox={props.hitbox}>
      {chunks.map((chunk, i) => {
        return (
          <div
            key={"power-tip-block-chunk-" + i}
            className={"powertip-multicol-column"}
          >
            {chunk.map((tip, j) => {
              return (
                <PowerTip
                  key={"power-tip-block-item-" + i + "-" + j}
                  tip={tip}
                  offset={props.offset}
                />
              );
            })}
          </div>
        );
      })}
    </Hitbox>
  );
}

export function PowerTipStrip(props: {
  magGlass: boolean;
  hitbox: HitBox;
  tips: Tip[];
  offset: { x: string; y: string };
}) {
  return (
    <Hitbox magGlass={props.magGlass} hitbox={props.hitbox}>
      {props.tips.map((tip, i) => {
        return (
          <PowerTip
            key={"power-tip-strip-" + i}
            tip={tip}
            offset={props.offset}
          />
        );
      })}
    </Hitbox>
  );
}
