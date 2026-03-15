import "./SpireMap.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReturnButton } from "../Buttons/Buttons";

const scalingFactor = 0.7;

function getImgForNode(node: string): HTMLImageElement {
  const img = new Image();
  switch (node) {
    case "M":
      img.src = "./img/map/monster.png";
      break;
    case "?":
      img.src = "./img/map/event.png";
      break;
    case "R":
      img.src = "./img/map/rest.png";
      break;
    case "E":
      img.src = "./img/map/elite.png";
      break;
    case "$":
      img.src = "./img/map/shop.png";
      break;
    case "T":
      img.src = "./img/map/chest.png";
      break;
    case "B":
      img.src = "./img/map/elite-burn.png";
      break;
    default:
      img.src = "./img/map/empty.png";
      break;
  }

  return img;
}

function getBossImage(boss: string): HTMLImageElement {
  const img = new Image();
  img.src = `./img/map/boss/${boss}.png`;
  return img;
}

export default function SpireMap(props: {
  nodes: { type: string; parents: number[] }[][];
  path: number[][];
  boss: string;
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
          style={props.game === "sts2" ? { right: "9.5%" } : undefined}
          onClick={() => {
            setShowMap((prev) => !prev);
          }}
        ></button>
      )}
      {showMap && props.nodes.length > 0 && (
        <MapCanvas boss={props.boss} nodes={props.nodes} path={props.path} game={props.game} />
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

    if (isSts2) {
      // STS2: wider, shorter map layout
      const maxCols = Math.max(...nodes.map(row => row.length));
      const nodeSpacing = 160;
      const rowSpacing = 180;
      const padding = 150;
      const canvasW = Math.max(maxCols * nodeSpacing + padding * 2, 1200);
      const canvasH = nodes.length * rowSpacing + 500;
      canvas.width = canvasW * scalingFactor;
      canvas.height = canvasH * scalingFactor;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scalingFactor, scalingFactor);

      const lineOffset = 64;

      const getLocation = (i: number, j: number) => {
        const rowCols = nodes[i]?.length ?? maxCols;
        const rowWidth = (rowCols - 1) * nodeSpacing;
        const rowStartX = (canvasW - rowWidth) / 2 - lineOffset;
        const x = rowStartX + j * nodeSpacing;
        const y = canvasH - padding - i * rowSpacing;
        return { x, y, r: 42 };
      };

      // Boss position: centered above top row
      const bossCenter = { x: canvasW / 2, y: padding + 60 };

      const bossImg = getBossImage(props.boss);
      bossImg.onload = () => {
        const bossScale = 0.9;
        const bw = bossImg.width * bossScale;
        const bh = bossImg.height * bossScale;
        ctx.drawImage(bossImg, bossCenter.x - bw / 2, bossCenter.y - bh / 2, bw, bh);
      };

      // Draw lines (including to boss from top row)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].length; j++) {
          const node = nodes[i][j];
          const { x, y } = getLocation(i, j);

          for (const parent of node.parents) {
            const start = getLocation(i - 1, parent);
            ctx.beginPath();
            const lineRatio = 0.27;
            const s = { x: start.x + lineOffset, y: start.y + lineOffset };
            const e = { x: x + lineOffset, y: y + lineOffset };
            ctx.moveTo(s.x + (e.x - s.x) * lineRatio, s.y + (e.y - s.y) * lineRatio);
            ctx.lineTo(e.x - (e.x - s.x) * lineRatio, e.y - (e.y - s.y) * lineRatio);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#453d3b";
            ctx.setLineDash([10]);
            ctx.stroke();
            ctx.closePath();
          }

          // Connect top row to boss
          if (i === nodes.length - 1 && node.type !== "*") {
            ctx.beginPath();
            const s = { x: x + lineOffset, y: y + lineOffset };
            const e = bossCenter;
            const lineRatio = 0.1;
            ctx.moveTo(s.x + (e.x - s.x) * lineRatio, s.y + (e.y - s.y) * lineRatio);
            ctx.lineTo(e.x - (e.x - s.x) * lineRatio, e.y - (e.y - s.y) * lineRatio);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#453d3b";
            ctx.setLineDash([10]);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      // Draw node icons
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].length; j++) {
          const node = nodes[i][j];
          const img = getImgForNode(node.type);
          const { x, y } = getLocation(i, j);
          img.onload = () => {
            ctx.drawImage(img, x, y);
          };
        }
      }

      // Draw visited path highlights
      for (const pathNode of path) {
        const node = getLocation(pathNode[1], pathNode[0]);
        ctx.beginPath();
        ctx.arc(node.x + lineOffset, node.y + lineOffset, node.r, 0, Math.PI * 2);
        ctx.strokeStyle = "#3972C6";
        ctx.lineWidth = 7;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.closePath();
      }
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
        ctx.arc(node.x + lineOffset, node.y + lineOffset, node.r, 0, Math.PI * 2);
        ctx.strokeStyle = "#3972C6";
        ctx.lineWidth = 7;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }, [nodes, path, canvasRef, isSts2]);

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
