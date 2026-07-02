/*
 * GalleryRoom.js — media utilities.
 * Renders each work type (image / video / youtube / iframe / text)
 * as an HTML string. All user-provided text goes through escapeHTML.
 */

export function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const MEDIA_TYPES = ["image", "video", "youtube", "iframe", "text"];

/*
 * Render the media element for a work.
 * options:
 *   lazy    — add loading="lazy" (wall view). Modal view passes false.
 *   inModal — modal rendering (larger iframes, autoplay-friendly video).
 */
export function renderMedia(work, options) {
  const opts = options || {};
  const lazy = opts.lazy !== false;
  const inModal = opts.inModal === true;
  const type = work.type;
  const title = escapeHTML(work.title || "");

  if (type === "text") {
    if (!work.content) {
      return '<div class="gr-placeholder"><p>No media source.</p></div>';
    }
    return '<div class="gr-text-work">' + escapeHTML(work.content) + "</div>";
  }

  if (!MEDIA_TYPES.includes(type)) {
    return '<div class="gr-unknown"><p>Unsupported work type.</p></div>';
  }

  if (!work.src) {
    return '<div class="gr-placeholder"><p>No media source.</p></div>';
  }

  const src = escapeHTML(work.src);

  if (type === "image") {
    const displaySrc = !inModal && work.thumbnail ? escapeHTML(work.thumbnail) : src;
    const lazyAttr = lazy ? ' loading="lazy"' : "";
    return '<img class="gr-media" src="' + displaySrc + '" alt="' + title + '"' + lazyAttr + ">";
  }

  if (type === "video") {
    const poster = work.thumbnail ? ' poster="' + escapeHTML(work.thumbnail) + '"' : "";
    return (
      '<video class="gr-media" src="' + src + '"' + poster +
      ' controls muted playsinline preload="metadata"></video>'
    );
  }

  if (type === "youtube" || type === "iframe") {
    const lazyAttr = lazy ? ' loading="lazy"' : "";
    const modalClass = inModal ? " gr-media-large" : "";
    return (
      '<iframe class="gr-media' + modalClass + '" src="' + src + '"' + lazyAttr +
      ' title="' + title + '" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>'
    );
  }

  return "";
}
