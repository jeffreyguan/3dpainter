import { useEffect, useRef, useState } from "react";
import Viewer from "./Viewer";
import { to3D } from "./to3d";

const CANVAS_SIZE = 420;
const DEFAULT_COLOR = "#000000";
const DEFAULT_LINE_WIDTH = 4;
const COLORS = ["#000000", "#ff0000", "#00aa00", "#0000ff", "#ffff00ff"];
const MIN_LINE_WIDTH = 1;
const MAX_LINE_WIDTH = 10;
const DRAWING_MODES = {
  brush: "brush",
  bucket: "bucket",
};

function Toolbar({ color, mode, onColorChange, onModeChange, width, setWidth }) {
  function handleWidthChange(event) {
    const nextWidth = Number(event.target.value);

    if (Number.isNaN(nextWidth)) {
      return;
    }

    setWidth(Math.min(MAX_LINE_WIDTH, Math.max(MIN_LINE_WIDTH, nextWidth)));
  }

  return (
    <div className="toolbar">
      <div className="mode-switcher" aria-label="Drawing mode">
        <button
          type="button"
          className={`mode-button${mode === DRAWING_MODES.brush ? " is-active" : ""}`}
          onClick={() => onModeChange(DRAWING_MODES.brush)}
        >
          brush
        </button>
        <button
          type="button"
          className={`mode-button${mode === DRAWING_MODES.bucket ? " is-active" : ""}`}
          onClick={() => onModeChange(DRAWING_MODES.bucket)}
        >
          bucket
        </button>
      </div>

      {COLORS.map((switchColor) => (
        <button
          key={switchColor}
          type="button"
          className={`color-switch${color === switchColor ? " is-active" : ""}`}
          onClick={() => onColorChange(switchColor)}
          style={{ backgroundColor: switchColor }}
          aria-label={`Choose ${switchColor}`}
        />
      ))}

      <label className="color-picker">
        <span>Color wheel</span>
        <input
          type="color"
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          aria-label="Pick a custom color"
        />
      </label>

      <label className="line-width-picker">
        <span>Line width</span>
        <input
          type="number"
          value={width}
          min={MIN_LINE_WIDTH}
          max={MAX_LINE_WIDTH}
          step="1"
          onChange={handleWidthChange}
          aria-label="Pick a line width"
        />
      </label>
    </div>
  );
}

function hexToRgba(hexColor) {
  const hex = hexColor.replace("#", "");
  const normalizedHex = hex.length === 3
    ? hex.split("").map((character) => character + character).join("")
    : hex.padEnd(8, "f");

  return [
    Number.parseInt(normalizedHex.slice(0, 2), 16),
    Number.parseInt(normalizedHex.slice(2, 4), 16),
    Number.parseInt(normalizedHex.slice(4, 6), 16),
    Number.parseInt(normalizedHex.slice(6, 8), 16),
  ];
}

function colorsMatch(data, index, targetColor) {
  return (
    data[index] === targetColor[0] &&
    data[index + 1] === targetColor[1] &&
    data[index + 2] === targetColor[2] &&
    data[index + 3] === targetColor[3]
  );
}

function fillCanvasArea(canvas, startPoint, fillColor) {
  const context = canvas.getContext("2d");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = image;
  const startX = Math.floor(startPoint.x);
  const startY = Math.floor(startPoint.y);
  const startIndex = (startY * width + startX) * 4;
  const targetColor = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];
  const replacementColor = hexToRgba(fillColor);
  const stack = [[startX, startY]];

  if (colorsMatch(replacementColor, 0, targetColor)) {
    return;
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const index = (y * width + x) * 4;

    if (!colorsMatch(data, index, targetColor)) {
      continue;
    }

    data[index] = replacementColor[0];
    data[index + 1] = replacementColor[1];
    data[index + 2] = replacementColor[2];
    data[index + 3] = replacementColor[3];

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  context.putImageData(image, 0, 0);
}

function Canvas({ canvasRef, color, mode, width }) {
  const fallbackCanvasRef = useRef(null);
  const resolvedCanvasRef = canvasRef ?? fallbackCanvasRef;
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = resolvedCanvasRef.current;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
  }, [resolvedCanvasRef]);

  useEffect(() => {
    const canvas = resolvedCanvasRef.current;
    const context = canvas.getContext("2d");

    context.strokeStyle = color;
    context.lineWidth = width;
  }, [color, resolvedCanvasRef, width]);

  function getPoint(event) {
    const canvas = resolvedCanvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;

    return {
      x: (event.clientX - bounds.left) * scaleX,
      y: (event.clientY - bounds.top) * scaleY,
    };
  }

  function handlePointerDown(event) {
    const canvas = resolvedCanvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    if (mode === DRAWING_MODES.bucket) {
      fillCanvasArea(canvas, point, color);
      return;
    }

    context.strokeStyle = color;
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function handlePointerMove(event) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = resolvedCanvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing(event) {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = resolvedCanvasRef.current;

    isDrawingRef.current = false;
    if (event?.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <canvas
      ref={resolvedCanvasRef}
      className={`drawing-canvas drawing-canvas-${mode}`}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrawing}
      onPointerLeave={stopDrawing}
    />
  );
}

function Container({ canvasRef, color, mode, width, label }) {
    return (
        <div className="canvas-container">
            <div>{label}</div>
            <Canvas canvasRef={canvasRef} color={color} mode={mode} width={width} />
        </div>
    );
}

export default function App() {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [mode, setMode] = useState(DRAWING_MODES.brush);
  const [width, setWidth] = useState(DEFAULT_LINE_WIDTH);

  const sideCanvasRef = useRef(null);
  const frontCanvasRef = useRef(null);
  const topCanvasRef = useRef(null);

  const [is3dView, setIs3dView] = useState(false);
  const [pointcloud, setPointcloud] = useState([]);

  function generate() {
    const front = frontCanvasRef.current;
    const side = sideCanvasRef.current;
    const top = topCanvasRef.current;

    if (!front || !side || !top) {
      return;
    }

    const result = to3D(front, side, top);
    setPointcloud(result);
    setIs3dView(true);
  }

  return (
    <main className="app">
      { !is3dView && <><h1>3D Painter</h1>
      <section className="toolbar-area">
        <Toolbar
          color={color}
          mode={mode}
          onColorChange={setColor}
          onModeChange={setMode}
          width={width}
          setWidth={setWidth}
        />
      </section>
      <section className="canvas-panel">
        <div className="canvas-area">
          <Container canvasRef={sideCanvasRef} color={color} mode={mode} width={width} label="side view:" />
          <Container canvasRef={frontCanvasRef} color={color} mode={mode} width={width} label="front view:" />
          <Container canvasRef={topCanvasRef} color={color} mode={mode} width={width} label="top view:" />
        </div>
        <button 
        type="button" className="generate-scene-button"
        onClick={generate}
        >
          generate scene
        </button>
      </section> </>}
      { is3dView && <>
        <Viewer points={pointcloud} />
      </>}
    </main>
  );
}
