const DEFAULT_STEP = 10;
const DEFAULT_SAMPLE_RADIUS = 5;
const WHITE_THRESHOLD = 250;

function getImage(view) {
  if (view?.data && Number.isFinite(view.width) && Number.isFinite(view.height)) {
    return view;
  }

  const context = view?.getContext?.("2d");

  if (!context) {
    throw new TypeError("Expected a canvas element or ImageData.");
  }

  return context.getImageData(0, 0, view.width, view.height);
}

function isDrawnPixel(image, x, y) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return false;
  }

  const index = (y * image.width + x) * 4;
  const red = image.data[index];
  const green = image.data[index + 1];
  const blue = image.data[index + 2];
  const alpha = image.data[index + 3];

  return alpha > 0 && (red < WHITE_THRESHOLD || green < WHITE_THRESHOLD || blue < WHITE_THRESHOLD);
}

function hasDrawnPixelNear(image, x, y, radius = DEFAULT_SAMPLE_RADIUS) {
  const startX = Math.max(0, Math.floor(x - radius));
  const endX = Math.min(image.width - 1, Math.ceil(x + radius));
  const startY = Math.max(0, Math.floor(y - radius));
  const endY = Math.min(image.height - 1, Math.ceil(y + radius));

  for (let sampleY = startY; sampleY <= endY; sampleY += 1) {
    for (let sampleX = startX; sampleX <= endX; sampleX += 1) {
      if (isDrawnPixel(image, sampleX, sampleY)) {
        return true;
      }
    }
  }

  return false;
}

export function shouldPointExist(point, front, side, top, sampleRadius = DEFAULT_SAMPLE_RADIUS) {
  const { x, y, z } = point;
  const frontImage = getImage(front);
  const sideImage = getImage(side);
  const topImage = getImage(top);

  return (
    hasDrawnPixelNear(frontImage, x, y, sampleRadius) &&
    hasDrawnPixelNear(sideImage, z, y, sampleRadius) &&
    hasDrawnPixelNear(topImage, x, z, sampleRadius)
  );
}

export function to3D(front, side, top, options = {}) {
  const step = options.step ?? DEFAULT_STEP;
  const sampleRadius = options.sampleRadius ?? step / 2;
  const frontImage = getImage(front);
  const sideImage = getImage(side);
  const topImage = getImage(top);
  const maxX = Math.min(frontImage.width, topImage.width);
  const maxY = Math.min(frontImage.height, sideImage.height);
  const maxZ = Math.min(sideImage.width, topImage.height);
  const points = [];

  for (let x = 0; x < maxX; x += step) {
    for (let y = 0; y < maxY; y += step) {
      for (let z = 0; z < maxZ; z += step) {
        const point = { x, y, z };

        if (
          hasDrawnPixelNear(frontImage, x, y, sampleRadius) &&
          hasDrawnPixelNear(sideImage, z, y, sampleRadius) &&
          hasDrawnPixelNear(topImage, x, z, sampleRadius)
        ) {
          points.push(point);
        }
      }
    }
  }

  return points;
}