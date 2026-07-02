/*
 * GalleryRoom.js — pseudo-3D depth utilities.
 * Assigns per-work CSS custom properties (--gr-depth / --gr-rotate-y /
 * --gr-height). Auto values cycle through small offsets and are scaled
 * by a per-theme intensity; manual values on a work are used as-is.
 */

export const DEPTH_VALUES = [0, 40, -20, 60, 10];
export const ROTATE_VALUES = [0, -4, 3, -2, 5];
export const HEIGHT_VALUES = [0, -12, 8, -6, 10];

export const THEME_DEPTH_INTENSITY = {
  "white-cube": 0.6,
  "dark-room": 1,
  "zine-wall": 1,
  "portfolio-clean": 0.5,
  "school-exhibition": 0.5,
  "museum": 0.8
};

export function resolveDepth(work, index, theme, layout) {
  const intensity = THEME_DEPTH_INTENSITY[theme] ?? 1;
  const depth = work.depth ?? DEPTH_VALUES[index % DEPTH_VALUES.length] * intensity;
  let rotate = work.rotate ?? ROTATE_VALUES[index % ROTATE_VALUES.length] * intensity;
  const height = work.height ?? HEIGHT_VALUES[index % HEIGHT_VALUES.length] * intensity;

  if (layout === "walkthrough" && work.rotate == null) {
    rotate += index % 2 === 0 ? 10 : -10;
  }

  return { depth, rotate, height };
}

export function applyDepthVars(element, values) {
  element.style.setProperty("--gr-depth", values.depth + "px");
  element.style.setProperty("--gr-rotate-y", values.rotate + "deg");
  element.style.setProperty("--gr-height", values.height + "px");
}
