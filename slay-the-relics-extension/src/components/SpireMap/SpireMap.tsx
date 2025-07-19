import "./SpireMap.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReturnButton } from "../Buttons/Buttons";

const scalingFactor = 0.7;

function getImgForNode(node: string): HTMLImageElement {
  const img = new Image();
  switch (node) {
    case "M":
      img.src = "/img/map/monster.png";
      break;
    case "?":
      img.src = "/img/map/event.png";
      break;
    case "R":
      img.src = "/img/map/rest.png";
      break;
    case "E":
      img.src = "/img/map/elite.png";
      break;
    case "$":
      img.src = "/img/map/shop.png";
      break;
    case "T":
      img.src = "/img/map/chest.png";
      break;
    default:
      img.src = "/img/map/empty.png";
      break;
  }

  return img;
}

function getBossImage(boss: string): HTMLImageElement {
  const img = new Image();
  img.src = `/img/map/boss/${boss}.png`;
  return img;
}

export default function SpireMap(props: {
  nodes: { type: string; parents: number[] }[][];
  path: number[][];
  boss: string;
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
          onClick={() => {
            setShowMap((prev) => !prev);
          }}
        ></button>
      )}
      {showMap && props.nodes.length > 0 && (
        <MapCanvas boss={props.boss} nodes={props.nodes} path={props.path} />
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
}) {
  const nodes = props.nodes;
  const path = props.path;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) {
      return;
    }
    canvas.width = 1400 * scalingFactor;
    canvas.height = 3150 * scalingFactor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scalingFactor, scalingFactor);

    const bossImg = getBossImage(props.boss);
    bossImg.onload = () => {
      ctx.drawImage(bossImg, 3 * 160, 365 + (nodes.length - 1 - 16) * 170);
    };

    const getLocation = (i: number, j: number) => {
      const x = 200 + j * 160;
      const y = 600 + (nodes.length - 1 - i) * 160; // Invert y-axis for canvas
      return { x: x, y: y };
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
        for (const parent of node.parents) {
          const start = getLocation(i - 1, parent);
          ctx.beginPath();
          ctx.moveTo(start.x + lineOffset, start.y + lineOffset); // Center the line on the node
          ctx.lineTo(x + lineOffset, y + lineOffset); // Center the line on the node
          ctx.lineWidth = 5;
          ctx.strokeStyle = "#453d3b";
          ctx.setLineDash([15]);
          ctx.stroke();
          ctx.closePath();
        }
      }
    }

    for (const pathNode of path) {
      const node = getLocation(pathNode[1], pathNode[0]);
      ctx.beginPath();
      ctx.arc(node.x + lineOffset, node.y + lineOffset, 42, 0, Math.PI * 2);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.closePath();
    }
  }, [nodes, path, canvasRef]);

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
