/*
 * GalleryRoom.js — filter utilities.
 */

/* Unique categories in order of first appearance. */
export function collectCategories(works) {
  const categories = [];
  for (const work of works) {
    if (work.category && !categories.includes(work.category)) {
      categories.push(work.category);
    }
  }
  return categories;
}

/* Works matching a category ("all" matches everything). */
export function filterWorks(works, category) {
  if (!category || category === "all") {
    return works.slice();
  }
  return works.filter((work) => work.category === category);
}
