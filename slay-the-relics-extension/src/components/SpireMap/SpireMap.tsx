import "./SpireMap.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReturnButton } from "../Buttons/Buttons";

const scalingFactor = 0.7;
const sts2LineOffset = 64;
const sts2NodeRadius = 42;
const sts2AncientRadius = 68;
const sts2AncientDrawSize = 144;

export interface Sts2MapNodeLocation {
  x: number;
  y: number;
  r: number;
}

export interface Sts2MapLayout {
  canvasW: number;
  canvasH: number;
  hasSecondBoss: boolean;
  bossScale: number;
  bossRadius: number;
  bossCenter: { x: number; y: number };
  secondBossCenter: { x: number; y: number } | null;
  getLocation: (i: number, j: number) => Sts2MapNodeLocation;
}

export function computeSts2MapLayout(
  nodes: { type: string; parents: number[] }[][],
  path: number[][],
  secondBoss?: string,
): Sts2MapLayout {
  const maxCols = Math.max(1, ...nodes.map((row) => row.length));
  const nodeSpacing = 160;
  const rowSpacing = 180;
  const padding = 150;
  const bottomPadding = 180;
  const hasSecondBoss =
    Boolean(secondBoss) || path.some((p) => p[1] >= nodes.length + 1);
  const canvasW = Math.max(maxCols * nodeSpacing + padding * 2, 1200);
  const canvasH = nodes.length * rowSpacing + (hasSecondBoss ? 840 : 530);

  const bossScale = hasSecondBoss ? 0.72 : 0.9;
  const bossRadius = hasSecondBoss ? 135 : 175;
  const secondBossCenter = hasSecondBoss
    ? { x: canvasW / 2, y: padding + 70 }
    : null;
  const bossCenter = hasSecondBoss
    ? { x: canvasW / 2, y: padding + 70 + 330 }
    : { x: canvasW / 2, y: padding + 90 };

  const getLocation = (i: number, j: number): Sts2MapNodeLocation => {
    if (i === nodes.length) {
      return {
        x: bossCenter.x - sts2LineOffset,
        y: bossCenter.y - sts2LineOffset,
        r: bossRadius,
      };
    }
    if (i >= nodes.length + 1) {
      const target = secondBossCenter ?? bossCenter;
      return {
        x: target.x - sts2LineOffset,
        y: target.y - sts2LineOffset,
        r: bossRadius,
      };
    }

    const rowCols = nodes[i]?.length ?? maxCols;
    const rowWidth = (rowCols - 1) * nodeSpacing;
    const rowStartX = (canvasW - rowWidth) / 2 - sts2LineOffset;
    const x = rowStartX + j * nodeSpacing;
    const y = canvasH - bottomPadding - i * rowSpacing;
    const r = nodes[i]?.[j]?.type === "A" ? sts2AncientRadius : sts2NodeRadius;
    return { x, y, r };
  };

  return {
    canvasW,
    canvasH,
    hasSecondBoss,
    bossScale,
    bossRadius,
    bossCenter,
    secondBossCenter,
    getLocation,
  };
}

function getNodeImgSrc(node: string, ancient?: string): string {
  switch (node) {
    case "M":
      return "./img/map/monster.png";
    case "?":
      return "./img/map/event.png";
    case "R":
      return "./img/map/rest.png";
    case "E":
      return "./img/map/elite.png";
    case "$":
      return "./img/map/shop.png";
    case "T":
      return "./img/map/chest.png";
    case "B":
      return "./img/map/elite-burn.png";
    case "A":
      return ancient
        ? `./img/map/ancient/${ancient}.png`
        : "./img/map/event.png";
    default:
      return "./img/map/empty.png";
  }
}

function getImgForNode(node: string): HTMLImageElement {
  const img = new Image();
  img.src = getNodeImgSrc(node);
  return img;
}

function getBossImage(boss: string): HTMLImageElement {
  const img = new Image();
  img.src = `./img/map/boss/${boss}.png`;
  return img;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawDashedConnector(
  ctx: CanvasRenderingContext2D,
  s: { x: number; y: number },
  e: { x: number; y: number },
  startTrim: number,
  endTrim: number,
) {
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= startTrim + endTrim) {
    return;
  }
  const ux = dx / dist;
  const uy = dy / dist;
  ctx.beginPath();
  ctx.moveTo(s.x + ux * startTrim, s.y + uy * startTrim);
  ctx.lineTo(e.x - ux * endTrim, e.y - uy * endTrim);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#453d3b";
  ctx.setLineDash([10]);
  ctx.stroke();
  ctx.closePath();
}

export default function SpireMap(props: {
  nodes: { type: string; parents: number[] }[][];
  path: number[][];
  boss: string;
  secondBoss?: string;
  ancient?: string;
  game?: string;
}) {
  const [showMap, setShowMap] = useState(false);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMap(false);
      }
    },
    [setShowMap],
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div>
      {props.nodes.length > 0 && (
        <button
          className={"button-border"}
          id={"map_button"}
          style={
            props.game === "sts2"
              ? { right: "9.167%", width: "4.167%", height: "7.407%" }
              : undefined
          }
          onClick={() => {
            setShowMap((prev) => !prev);
          }}
        ></button>
      )}
      {showMap && props.nodes.length > 0 && (
        <MapCanvas
          boss={props.boss}
          secondBoss={props.secondBoss}
          ancient={props.ancient}
          nodes={props.nodes}
          path={props.path}
          game={props.game}
        />
      )}
      {showMap && props.nodes.length > 0 && (
        <ReturnButton onClick={() => setShowMap(false)} text={"Close Map"} />
      )}
    </div>
  );
}

function MapCanvas(props: {
  nodes: { type: string; parents: number[] }[][];
  path: number[][];
  boss: string;
  secondBoss?: string;
  ancient?: string;
  game?: string;
}) {
  const nodes = props.nodes;
  const path = props.path;
  const isSts2 = props.game === "sts2";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) {
      return;
    }
    const act4 = props.boss === "heart";
    let cancelled = false;

    if (isSts2) {
      const layout = computeSts2MapLayout(nodes, path, props.secondBoss);
      const {
        canvasW,
        canvasH,
        hasSecondBoss,
        bossScale,
        bossRadius,
        bossCenter,
        secondBossCenter,
        getLocation,
      } = layout;

      canvas.width = canvasW * scalingFactor;
      canvas.height = canvasH * scalingFactor;

      const drawSts2Map = (images: Map<string, HTMLImageElement | null>) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scalingFactor, scalingFactor);

        // 1. Draw connector lines
        for (let i = 0; i < nodes.length; i++) {
          for (let j = 0; j < nodes[i].length; j++) {
            const node = nodes[i][j];
            const loc = getLocation(i, j);
            const nodeCenter = {
              x: loc.x + sts2LineOffset,
              y: loc.y + sts2LineOffset,
            };

            for (const parent of node.parents) {
              if (i === 0) continue;
              const start = getLocation(i - 1, parent);
              const startCenter = {
                x: start.x + sts2LineOffset,
                y: start.y + sts2LineOffset,
              };
              drawDashedConnector(
                ctx,
                startCenter,
                nodeCenter,
                start.r + 6,
                loc.r + 6,
              );
            }

            // Connect top row to first boss
            if (i === nodes.length - 1 && node.type !== "*") {
              drawDashedConnector(
                ctx,
                nodeCenter,
                bossCenter,
                loc.r + 6,
                bossRadius + 8,
              );
            }
          }
        }

        // Connect first boss to second boss in double-boss mode
        if (hasSecondBoss && secondBossCenter) {
          drawDashedConnector(
            ctx,
            bossCenter,
            secondBossCenter,
            bossRadius + 8,
            bossRadius + 8,
          );
        }

        // 2. Draw node icons (regular nodes + Ancient)
        for (let i = 0; i < nodes.length; i++) {
          for (let j = 0; j < nodes[i].length; j++) {
            const node = nodes[i][j];
            if (node.type === "*") continue;
            const { x, y } = getLocation(i, j);
            const src = getNodeImgSrc(node.type, props.ancient);
            const img =
              images.get(src) ??
              (node.type === "A"
                ? (images.get("./img/map/event.png") ?? null)
                : null);
            if (!img) continue;

            if (node.type === "A") {
              const scale = Math.min(
                sts2AncientDrawSize / img.width,
                sts2AncientDrawSize / img.height,
              );
              const aw = img.width * scale;
              const ah = img.height * scale;
              ctx.drawImage(
                img,
                x + sts2LineOffset - aw / 2,
                y + sts2LineOffset - ah / 2,
                aw,
                ah,
              );
            } else {
              ctx.drawImage(img, x, y);
            }
          }
        }

        // 3. Draw boss icon(s)
        const drawBossIcon = (
          bossId: string | undefined,
          center: { x: number; y: number } | null,
        ) => {
          if (!bossId || !center) return;
          const img = images.get(`./img/map/boss/${bossId}.png`);
          if (!img) return;
          const bw = img.width * bossScale;
          const bh = img.height * bossScale;
          ctx.drawImage(img, center.x - bw / 2, center.y - bh / 2, bw, bh);
        };

        drawBossIcon(props.boss, bossCenter);
        if (hasSecondBoss) {
          drawBossIcon(props.secondBoss, secondBossCenter);
        }

        // 4. Draw visited path highlights on top
        for (const pathNode of path) {
          const node = getLocation(pathNode[1], pathNode[0]);
          ctx.beginPath();
          ctx.arc(
            node.x + sts2LineOffset,
            node.y + sts2LineOffset,
            node.r,
            0,
            Math.PI * 2,
          );
          ctx.strokeStyle = "#3972C6";
          ctx.lineWidth = 7;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.closePath();
        }

        ctx.restore();
      };

      // Preload all unique image URLs needed for this map
      const urls = new Set<string>();
      for (const row of nodes) {
        for (const node of row) {
          if (node.type === "*") continue;
          urls.add(getNodeImgSrc(node.type, props.ancient));
          if (node.type === "A") {
            urls.add("./img/map/event.png");
          }
        }
      }
      if (props.boss) {
        urls.add(`./img/map/boss/${props.boss}.png`);
      }
      if (hasSecondBoss && props.secondBoss) {
        urls.add(`./img/map/boss/${props.secondBoss}.png`);
      }

      // Paint lines & visited path immediately while images load, then repaint once ready
      drawSts2Map(new Map());
      void Promise.all(
        Array.from(urls).map(
          async (url) => [url, await loadImage(url)] as const,
        ),
      ).then((entries) => {
        if (cancelled) return;
        drawSts2Map(new Map(entries));
      });
    } else {
      // STS1 layout
      canvas.width = 1400 * scalingFactor;
      canvas.height = 3150 * scalingFactor;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scalingFactor, scalingFactor);

      const bossImg = getBossImage(props.boss);
      bossImg.onload = () => {
        let length = nodes.length;
        if (act4) {
          length = 15;
        }
        const bossX = 3 * 160;
        const bossY = 365 + (length - 1 - 16) * 170;
        ctx.drawImage(bossImg, bossX, bossY);
      };

      let xOffset = 0;
      let yOffset = 0;
      if (act4) {
        xOffset = -75;
        yOffset = -350;
      }

      const getLocation = (i: number, j: number) => {
        const x = xOffset + 300 + j * 150;
        const y = yOffset + 600 + (nodes.length - 1 - i) * 160;
        const res = { x: x, y: y, r: 42 };
        if (i === nodes.length || (act4 && i === 3)) {
          res.r = 222;
          res.x = 300 + 2.5 * 150;
          res.y = 600 - 2.5 * 150;
        }
        return res;
      };
      const lineOffset = 64;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].length; j++) {
          const node = nodes[i][j];
          const img = getImgForNode(node.type);
          const { x, y } = getLocation(i, j);
          img.onload = () => {
            ctx.drawImage(img, x, y);
          };

          let parents = node.parents;
          if (act4 && node.type !== "*" && i > 0) {
            parents = [j];
          }

          for (const parent of parents) {
            const start = getLocation(i - 1, parent);
            ctx.beginPath();

            const lineRatio = 0.27;
            const s = { x: start.x + lineOffset, y: start.y + lineOffset };
            const e = { x: x + lineOffset, y: y + lineOffset };

            ctx.moveTo(
              s.x + (e.x - s.x) * lineRatio,
              s.y + (e.y - s.y) * lineRatio,
            );
            ctx.lineTo(
              e.x - (e.x - s.x) * lineRatio,
              e.y - (e.y - s.y) * lineRatio,
            );

            ctx.lineWidth = 5;
            ctx.strokeStyle = "#453d3b";
            ctx.setLineDash([10]);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      for (const pathNode of path) {
        const node = getLocation(pathNode[1], pathNode[0]);
        ctx.beginPath();
        ctx.arc(
          node.x + lineOffset,
          node.y + lineOffset,
          node.r,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = "#3972C6";
        ctx.lineWidth = 7;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.closePath();
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    nodes,
    path,
    canvasRef,
    isSts2,
    props.boss,
    props.secondBoss,
    props.ancient,
  ]);

  return (
    <div
      id={"spire-map"}
      className={
        "h-full w-full absolute spire-map-container flex justify-center items-start z-8"
      }
    >
      <canvas ref={canvasRef} className={"spire-map w-[70%]"}></canvas>
    </div>
  );
}
