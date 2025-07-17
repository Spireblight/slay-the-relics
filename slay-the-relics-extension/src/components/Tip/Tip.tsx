import { CSSProperties, ReactNode, useId } from "react";

import orbIronclad from "../../img/orbs/orbIronclad.png";
import orbTheSilent from "../../img/orbs/orbTheSilent.png";
import orbDefect from "../../img/orbs/orbDefect.png";
import orbWatcher from "../../img/orbs/orbWatcher.png";
import { PlacesType, Tooltip } from "react-tooltip";
import { KeywordsLoc } from "../tmp";

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

function TipPartElement(props: {
  part: string;
  index: number;
  character: string;
}) {
  const { part, index } = props;
  const key = "tip-part-" + index;

  if (part === "NL") {
    return <br key={key} />;
  } else if (part === "[E]") {
    switch (props.character) {
      case "silent":
        return <img key={key} src={orbTheSilent} alt={"Orb"} />;
      case "defect":
        return <img key={key} src={orbDefect} alt={"Orb"} />;
      case "watcher":
        return <img key={key} src={orbWatcher} alt={"Orb"} />;
      default:
        return <img key={key} src={orbIronclad} alt={"Orb"} />;
    }
  } else if (part === "[R]") {
    return <img key={key} src={orbIronclad} alt={"Orb"} />;
  } else if (part === "[G]") {
    return <img key={key} src={orbTheSilent} alt={"Orb"} />;
  } else if (part === "[B]") {
    return <img key={key} src={orbDefect} alt={"Orb"} />;
  } else if (part === "[W]") {
    return <img key={key} src={orbWatcher} alt={"Orb"} />;
  } else if (part.startsWith("#y")) {
    return (
      <span key={key} className={"text-yellow"}>
        {part.substring(2)}
      </span>
    );
  } else if (part.startsWith("#b")) {
    return (
      <span key={key} className={"text-blue"}>
        {part.substring(2)}
      </span>
    );
  } else if (part.startsWith("#r")) {
    return (
      <span key={key} className={"text-red"}>
        {part.substring(2)}
      </span>
    );
  } else if (part.startsWith("#g")) {
    return (
      <span key={key} className={"text-green"}>
        {part.substring(2)}
      </span>
    );
  } else if (part.startsWith("#p")) {
    return (
      <span key={key} className={"text-pink"}>
        {part.substring(2)}
      </span>
    );
  } else if (part.startsWith("#")) {
    return (
      <span key={key} className={"text-other"}>
        {part.substring(2)}
      </span>
    );
  } else
    return (
      <span key={key} className={"text-white"}>
        {part}
      </span>
    );
}

function TipBody(props: { character: string; raw: string }) {
  const parts = props.raw.split(" ");
  return (
    <div>
      {parts.map((part, index) => {
        return (
          <span key={"tip-body-span-" + index}>
            <TipPartElement
              key={"tipbody-" + index}
              part={part}
              index={index}
              character={props.character}
            />
            {index < parts.length - 1 ? " " : ""}
          </span>
        );
      })}
    </div>
  );
}

export function PowerTip(props: { tip: Tip; character: string }) {
  const headerImgClass =
    props.tip.img === null ? "powertip-header-noimg" : "powertip-header-wimg";

  return (
    <div className={"powertip powertip-shadow"}>
      <div className={"powertip-header outline-black " + headerImgClass}>
        {props.tip.header}
      </div>
      <TipBody character={props.character} raw={props.tip.description} />
    </div>
  );
}

export function Hitbox(props: {
  magGlass: boolean;
  hitbox: HitBox;
  children: ReactNode;
  offset?: number;
  place?: PlacesType;
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
      <Tooltip
        style={{ background: "transparent" }}
        id={tooltipID}
        offset={props.offset}
        place={props.place}
      >
        {props.children}
      </Tooltip>
    </div>
  );
}

export function LookupKeyword(raw: string) {
  let key = raw.toLowerCase().replaceAll(".", "").replaceAll(",", "");
  if (key.startsWith("#")) {
    key = key.substring(2);
  }

  for (const [k, v] of Object.entries(KeywordsLoc)) {
    if (k.toLowerCase() === key) {
      return k;
    }
    for (const alias of v.NAMES) {
      if (alias.toLowerCase() === key) {
        return k;
      }
    }
  }

  return null;
}

export function KeywordTips(paragraph: string): Tip[] {
  const keywordKeys: string[] = [];
  const parts = paragraph.split(" ");
  parts.forEach((part) => {
    const keyword = LookupKeyword(part);
    if (keyword && !keywordKeys.includes(keyword)) {
      keywordKeys.push(keyword);
    }
  });

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return keywordKeys.map((key) => {
    const keyword = KeywordsLoc[key];
    return new Tip(capitalize(key), keyword.DESCRIPTION, "");
  });
}

function expandTips(tips: Tip[]): Tip[] {
  let paragraphs = "";

  tips.forEach((tip) => {
    paragraphs += tip.description + " ";
  });
  const keywordTips = KeywordTips(paragraphs);

  return tips.concat(keywordTips);
}

export function PowerTipBlock(props: {
  magGlass: boolean;
  hitbox: HitBox | string;
  tips: Tip[];
  character: string;
  offset?: number;
  place?: PlacesType;
  noExpand?: boolean;
}) {
  let allTips = [];
  if (props.noExpand) {
    allTips = props.tips;
  } else {
    allTips = expandTips(props.tips);
  }

  const tooltipBlock = (
    <div className={"flex max-h-120 flex-col flex-wrap justify-start gap-0.5"}>
      {allTips.map((tip: Tip, i: number) => {
        return (
          <PowerTip
            character={props.character}
            key={"power-tip-block-item-" + i}
            tip={tip}
          />
        );
      })}
    </div>
  );

  if (typeof props.hitbox === "string") {
    return (
      <Tooltip
        style={{ background: "transparent", zIndex: 30 }}
        id={props.hitbox as string}
        offset={props.offset}
        place={props.place}
      >
        {tooltipBlock}
      </Tooltip>
    );
  }

  return (
    <Hitbox
      magGlass={props.magGlass}
      hitbox={props.hitbox as HitBox}
      offset={props.offset}
      place={props.place}
    >
      {tooltipBlock}
    </Hitbox>
  );
}

export function PowerTipStrip(props: {
  magGlass: boolean;
  hitbox: HitBox;
  tips: Tip[];
  character: string;
  offset?: number;
  place?: PlacesType;
}) {
  const allTips = expandTips(props.tips);
  return (
    <Hitbox
      magGlass={props.magGlass}
      hitbox={props.hitbox}
      offset={props.offset}
      place={props.place}
    >
      {allTips.map((tip, i) => {
        return (
          <PowerTip
            character={props.character}
            key={"power-tip-strip-" + i}
            tip={tip}
          />
        );
      })}
    </Hitbox>
  );
}
