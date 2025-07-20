import { CSSProperties, ReactNode, useContext, useId } from "react";

import { PlacesType, Tooltip } from "react-tooltip";
import { Keywords, LocalizationContext } from "../Localization/Localization";

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

function EnergyOrbElement(props: { character: string; keyP: string }) {
  switch (props.character) {
    case "silent":
      return (
        <span key={props.keyP}>
          <img
            src={"./img/orbs/orbTheSilent.png"}
            alt={"Orb"}
            className={"inline-block energy-orb-img"}
          />
        </span>
      );
    case "defect":
      return (
        <span key={props.keyP}>
          <img
            src={"./img/orbs/orbDefect.png"}
            alt={"Orb"}
            className={"inline-block energy-orb-img"}
          />
          ;
        </span>
      );
    case "watcher":
      return (
        <span key={props.keyP}>
          <img
            src={"./img/orbs/orbWatcher.png"}
            alt={"Orb"}
            className={"inline-block energy-orb-img"}
          />
          ;
        </span>
      );
    default:
      return (
        <span key={props.keyP}>
          <img
            src={"./img/orbs/orbIronclad.png"}
            alt={"Orb"}
            className={"inline-block energy-orb-img"}
          />
        </span>
      );
  }
}

function TipPartElement(props: {
  part: string;
  index: number;
  character: string;
}) {
  const part = props.part;
  const key = "tip-part-" + props.index;

  if (part === "NL") {
    return <br key={key} />;
  } else if (part === "[E]") {
    return <EnergyOrbElement character={props.character} keyP={key} />;
  } else if (part === "[R]") {
    return <EnergyOrbElement character={"ironclad"} keyP={key} />;
  } else if (part === "[G]") {
    return <EnergyOrbElement character={"silent"} keyP={key} />;
  } else if (part === "[B]") {
    return <EnergyOrbElement character={"defect"} keyP={key} />;
  } else if (part === "[W]") {
    return <EnergyOrbElement character={"watcher"} keyP={key} />;
  } else if (part.startsWith("#y")) {
    return (
      <span key={key} className={"text-yellow"}>
        {part.substring(2) + " "}
      </span>
    );
  } else if (part.startsWith("#b")) {
    return (
      <span key={key} className={"text-blue"}>
        {part.substring(2) + " "}
      </span>
    );
  } else if (part.startsWith("#r")) {
    return (
      <span key={key} className={"text-red"}>
        {part.substring(2) + " "}
      </span>
    );
  } else if (part.startsWith("#g")) {
    return (
      <span key={key} className={"text-green"}>
        {part.substring(2) + " "}
      </span>
    );
  } else if (part.startsWith("#p")) {
    return (
      <span key={key} className={"text-pink"}>
        {part.substring(2) + " "}
      </span>
    );
  } else if (part.startsWith("#")) {
    return (
      <span key={key} className={"text-other"}>
        {part.substring(2) + " "}
      </span>
    );
  } else
    return (
      <span key={key} className={"text-white"}>
        {part + " "}
      </span>
    );
}

export function TipBody(props: {
  character: string;
  raw: string;
  className?: string;
}) {
  const parts = props.raw.split(" ");
  return (
    <div className={props.className ? props.className : ""}>
      {parts.map((part, index) => {
        return (
          <span key={"tip-body-span-" + index}>
            <TipPartElement
              key={"tipbody-" + index}
              part={part}
              index={index}
              character={props.character}
            />
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
        {props.tip.img && (
          <img
            className={"powertip-img inline-block"}
            src={"./img/" + props.tip.img + ".png"}
            alt={""}
          />
        )}
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
  if (import.meta.env.DEV) {
    classes += " outline";
  }
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

export function LookupKeyword(raw: string, keywords: Keywords) {
  let key = raw.toLowerCase().replaceAll(".", "").replaceAll(",", "");
  if (key.startsWith("#")) {
    key = key.substring(2);
  }

  for (const [k, v] of Object.entries(keywords)) {
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

export function KeywordTips(paragraph: string, keywords: Keywords): Tip[] {
  const keywordKeys: string[] = [];
  const parts = paragraph.split(" ");
  parts.forEach((part) => {
    const keyword = LookupKeyword(part, keywords);
    if (keyword && !keywordKeys.includes(keyword)) {
      keywordKeys.push(keyword);
    }
  });

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return keywordKeys.map((key) => {
    const keyword = keywords[key];
    return new Tip(capitalize(key), keyword.DESCRIPTION, "");
  });
}

function expandTips(tips: Tip[], keywords: Keywords): Tip[] {
  let paragraphs = "";

  tips.forEach((tip) => {
    paragraphs += tip.description + " ";
  });
  const keywordTips = KeywordTips(paragraphs, keywords);

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
  const keywords = useContext(LocalizationContext).keywords;
  let allTips = [];
  if (props.noExpand) {
    allTips = props.tips;
  } else {
    allTips = expandTips(props.tips, keywords);
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
        style={{ background: "transparent", zIndex: 50 }}
        id={props.hitbox}
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
      hitbox={props.hitbox}
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
  const keywords = useContext(LocalizationContext).keywords;
  const allTips = expandTips(props.tips, keywords);
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
