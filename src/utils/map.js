/*
 * GalleryRoom.js — exhibition map utilities.
 * The current work is the one whose center is closest to the center
 * of the visible scroll area (horizontal layouts) or the viewport
 * (grid layout).
 */

export function findCurrentWorkId(wallElement, workElements, horizontal) {
  let bestId = null;
  let bestDistance = Infinity;

  if (horizontal) {
    const wallRect = wallElement.getBoundingClientRect();
    const viewCenter = wallRect.left + wallRect.width / 2;
    for (const el of workElements) {
      if (el.classList.contains("gr-hidden")) continue;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - viewCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = el.dataset.id;
      }
    }
    return bestId;
  }

  const viewCenter = window.innerHeight / 2;
  for (const el of workElements) {
    if (el.classList.contains("gr-hidden")) continue;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewCenter);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = el.dataset.id;
    }
  }
  return bestId;
}
