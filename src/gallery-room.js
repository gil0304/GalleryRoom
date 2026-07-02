/*
 * GalleryRoom.js
 * A JavaScript/CSS library for creating web exhibition galleries.
 *
 * Usage:
 *   const gallery = GalleryRoom.create("#gallery", { works: [...] });
 *
 * https://github.com/ryogo/gallery-room-js — MIT License
 */

import { escapeHTML, renderMedia } from "./utils/media.js";
import { collectCategories, filterWorks } from "./utils/filter.js";
import { findCurrentWorkId } from "./utils/map.js";
import { resolveDepth, applyDepthVars } from "./utils/depth.js";

const THEMES = [
  "white-cube",
  "dark-room",
  "zine-wall",
  "portfolio-clean",
  "school-exhibition",
  "museum"
];

const LAYOUTS = ["horizontal", "grid", "walkthrough"];

class GalleryRoom {
  constructor(selector, options) {
    this.selector = selector;
    this.root =
      typeof selector === "string" ? document.querySelector(selector) : selector;
    this.options = this.normalizeOptions(options || {});
    this.works = this.options.works;
    this.currentCategory = "all";
    this.currentWorkId = null;
    this.openedWorkId = null;
    this._listeners = [];
    this._scrollTicking = false;
    this._previousBodyOverflow = "";
    this._destroyed = false;
  }

  static create(selector, options) {
    const instance = new GalleryRoom(selector, options);
    if (!instance.root) {
      console.warn("[GalleryRoom] Target element not found: " + selector);
      return null;
    }
    instance.init();
    return instance;
  }

  init() {
    this.render();
    this.applyDepth();
    this.bindEvents();
    this.updateCurrentWork();
    this.dispatch("gr:ready", { instance: this });
  }

  /* ------------------------------------------------------------------ */
  /* Options                                                             */
  /* ------------------------------------------------------------------ */

  normalizeOptions(options) {
    const theme = THEMES.includes(options.theme) ? options.theme : "white-cube";
    const layout = LAYOUTS.includes(options.layout) ? options.layout : "horizontal";
    return {
      title: options.title || "Gallery Room",
      subtitle: options.subtitle || "",
      theme,
      layout,
      enableMap: options.enableMap ?? true,
      enableFilter: options.enableFilter ?? true,
      enableDepth: options.enableDepth ?? true,
      scroll: {
        wheelToHorizontal: options.scroll?.wheelToHorizontal ?? true,
        snap: options.scroll?.snap ?? true,
        smooth: options.scroll?.smooth ?? true
      },
      works: Array.isArray(options.works) ? options.works : []
    };
  }

  isHorizontal() {
    return this.options.layout !== "grid";
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  render() {
    const opts = this.options;
    this.root.innerHTML = "";

    const room = document.createElement("div");
    room.className = [
      "gr-room",
      "gr-theme-" + opts.theme,
      "gr-layout-" + opts.layout,
      opts.enableDepth ? "gr-depth-enabled" : "",
      opts.scroll.snap ? "gr-snap-enabled" : "",
      opts.scroll.smooth ? "gr-smooth-enabled" : ""
    ]
      .filter(Boolean)
      .join(" ");

    room.innerHTML =
      this.renderHeader() +
      (opts.enableFilter ? this.renderFilter() : "") +
      '<main class="gr-exhibition">' +
      (opts.enableMap ? this.renderMap() : "") +
      this.renderWall() +
      "</main>" +
      this.renderModal();

    this.root.appendChild(room);

    this.room = room;
    this.wall = room.querySelector(".gr-wall");
    this.workElements = Array.from(room.querySelectorAll(".gr-work"));
    this.mapElement = room.querySelector(".gr-map");
    this.filterElement = room.querySelector(".gr-filter");
    this.modal = room.querySelector(".gr-modal");
    this.emptyElement = room.querySelector(".gr-empty");

    this.updateEmptyState();
  }

  renderHeader() {
    const opts = this.options;
    const subtitle = opts.subtitle
      ? '<p class="gr-room-subtitle">' + escapeHTML(opts.subtitle) + "</p>"
      : "";
    return (
      '<header class="gr-room-header">' +
      '<h1 class="gr-room-title">' + escapeHTML(opts.title) + "</h1>" +
      subtitle +
      "</header>"
    );
  }

  renderFilter() {
    const categories = collectCategories(this.works);
    if (categories.length === 0) return "";
    let buttons =
      '<button type="button" class="gr-filter-button gr-active" data-category="all">All</button>';
    for (const category of categories) {
      buttons +=
        '<button type="button" class="gr-filter-button" data-category="' +
        escapeHTML(category) + '">' + escapeHTML(category) + "</button>";
    }
    return '<nav class="gr-filter" aria-label="Work categories">' + buttons + "</nav>";
  }

  renderMap() {
    let points = "";
    this.works.forEach((work, index) => {
      points +=
        '<button type="button" class="gr-map-point' + (index === 0 ? " gr-active" : "") +
        '" data-target="' + escapeHTML(work.id) +
        '" title="' + escapeHTML(work.title) +
        '" aria-label="' + escapeHTML(work.title) + '"></button>';
    });
    return (
      '<aside class="gr-map">' +
      '<div class="gr-map-title">Exhibition Map</div>' +
      '<div class="gr-map-track">' + points + "</div>" +
      "</aside>"
    );
  }

  renderWall() {
    let inner = "";
    this.works.forEach((work, index) => {
      inner += this.renderWork(work, index);
    });
    inner += '<div class="gr-empty" hidden><p>No works to display.</p></div>';
    return '<section class="gr-wall" tabindex="0">' + inner + "</section>";
  }

  renderWork(work, index) {
    const category = work.category ? ' data-category="' + escapeHTML(work.category) + '"' : "";
    return (
      '<article class="gr-work" data-id="' + escapeHTML(work.id) + '"' + category +
      ' tabindex="0" role="button" aria-haspopup="dialog"' +
      ' aria-label="' + escapeHTML(work.title) + '">' +
      '<div class="gr-frame">' + renderMedia(work, { lazy: true }) + "</div>" +
      this.renderCaption(work, index) +
      "</article>"
    );
  }

  renderCaption(work, index) {
    let html = '<div class="gr-caption">';
    html +=
      '<div class="gr-work-number">No. ' +
      String(index + 1).padStart(2, "0") + "</div>";
    html += "<h2>" + escapeHTML(work.title) + "</h2>";

    const meta = [work.year, work.category, work.author]
      .filter(Boolean)
      .map(escapeHTML)
      .join(" / ");
    if (meta) {
      html += '<p class="gr-meta">' + meta + "</p>";
    }
    if (work.size) {
      html += '<p class="gr-size">' + escapeHTML(work.size) + "</p>";
    }
    if (work.caption) {
      html += '<p class="gr-description">' + escapeHTML(work.caption) + "</p>";
    }
    if (Array.isArray(work.tags) && work.tags.length > 0) {
      html +=
        '<p class="gr-tags">' +
        work.tags.map((tag) => "<span>" + escapeHTML(tag) + "</span>").join("") +
        "</p>";
    }
    if (work.link) {
      html +=
        '<p class="gr-link"><a href="' + escapeHTML(work.link) +
        '" target="_blank" rel="noopener noreferrer">View Work &#8599;</a></p>';
    }
    if (work.qr) {
      html +=
        '<div class="gr-qr"><img src="' + escapeHTML(work.qr) +
        '" alt="QR code" loading="lazy"></div>';
    }
    html += "</div>";
    return html;
  }

  renderModal() {
    return (
      '<div class="gr-modal" aria-hidden="true">' +
      '<div class="gr-modal-backdrop"></div>' +
      '<div class="gr-modal-content" role="dialog" aria-modal="true">' +
      '<button type="button" class="gr-modal-close" aria-label="Close">&times;</button>' +
      '<div class="gr-modal-media"></div>' +
      '<div class="gr-modal-caption"></div>' +
      "</div>" +
      "</div>"
    );
  }

  /* ------------------------------------------------------------------ */
  /* Depth                                                               */
  /* ------------------------------------------------------------------ */

  applyDepth() {
    if (!this.options.enableDepth) return;
    this.workElements.forEach((element, index) => {
      const work = this.works[index];
      if (!work) return;
      applyDepthVars(
        element,
        resolveDepth(work, index, this.options.theme, this.options.layout)
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._listeners.push([target, type, handler, options]);
  }

  bindEvents() {
    for (const element of this.workElements) {
      this.addListener(element, "click", (event) => {
        if (event.target.closest("a")) return;
        this.open(element.dataset.id);
      });
      this.addListener(element, "keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.open(element.dataset.id);
        }
      });
    }

    if (this.filterElement) {
      this.addListener(this.filterElement, "click", (event) => {
        const button = event.target.closest(".gr-filter-button");
        if (button) this.filter(button.dataset.category);
      });
    }

    if (this.mapElement) {
      this.addListener(this.mapElement, "click", (event) => {
        const point = event.target.closest(".gr-map-point");
        if (point) this.goTo(point.dataset.target);
      });
    }

    this.addListener(this.modal.querySelector(".gr-modal-close"), "click", () =>
      this.close()
    );
    this.addListener(this.modal.querySelector(".gr-modal-backdrop"), "click", () =>
      this.close()
    );

    this._onDocumentKeydown = (event) => {
      if (event.key === "Escape" && this.openedWorkId) {
        this.close();
      }
    };
    this.addListener(document, "keydown", this._onDocumentKeydown);

    this.addListener(this.room, "keydown", (event) => {
      if (this.openedWorkId) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.step(-1);
      }
    });

    const onScroll = () => {
      if (this._scrollTicking) return;
      this._scrollTicking = true;
      requestAnimationFrame(() => {
        this._scrollTicking = false;
        this.updateCurrentWork();
      });
    };

    if (this.isHorizontal()) {
      this.addListener(this.wall, "scroll", onScroll, { passive: true });
      if (this.options.scroll.wheelToHorizontal) {
        this.addListener(
          this.wall,
          "wheel",
          (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            if (this.wall.scrollWidth <= this.wall.clientWidth) return;
            event.preventDefault();
            this.wall.scrollLeft += event.deltaY;
          },
          { passive: false }
        );
      }
    } else {
      this.addListener(window, "scroll", onScroll, { passive: true });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Current work / map                                                  */
  /* ------------------------------------------------------------------ */

  updateCurrentWork() {
    if (this._destroyed || this.workElements.length === 0) return;
    const id = findCurrentWorkId(this.wall, this.workElements, this.isHorizontal());
    if (!id || id === this.currentWorkId) return;
    this.currentWorkId = id;
    this.updateMapActive();
    const work = this.getWork(id);
    if (work) {
      this.dispatch("gr:currentWorkChange", { work });
    }
  }

  updateMapActive() {
    if (!this.mapElement) return;
    for (const point of this.mapElement.querySelectorAll(".gr-map-point")) {
      point.classList.toggle("gr-active", point.dataset.target === this.currentWorkId);
    }
  }

  updateMapVisibility() {
    if (!this.mapElement) return;
    const visibleIds = new Set(
      filterWorks(this.works, this.currentCategory).map((work) => work.id)
    );
    for (const point of this.mapElement.querySelectorAll(".gr-map-point")) {
      point.hidden = !visibleIds.has(point.dataset.target);
    }
  }

  updateEmptyState() {
    if (!this.emptyElement) return;
    const visible = filterWorks(this.works, this.currentCategory);
    if (this.works.length === 0) {
      this.emptyElement.querySelector("p").textContent = "No works to display.";
      this.emptyElement.hidden = false;
    } else if (visible.length === 0) {
      this.emptyElement.querySelector("p").textContent =
        "No works found in this category.";
      this.emptyElement.hidden = false;
    } else {
      this.emptyElement.hidden = true;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  filter(category) {
    this.currentCategory = category || "all";

    for (const element of this.workElements) {
      const matches =
        this.currentCategory === "all" ||
        element.dataset.category === this.currentCategory;
      element.classList.toggle("gr-hidden", !matches);
    }

    if (this.filterElement) {
      for (const button of this.filterElement.querySelectorAll(".gr-filter-button")) {
        button.classList.toggle(
          "gr-active",
          button.dataset.category === this.currentCategory
        );
      }
    }

    this.updateMapVisibility();
    this.updateEmptyState();

    const visible = filterWorks(this.works, this.currentCategory);
    if (visible.length > 0) {
      this.goTo(visible[0].id);
    }

    this.dispatch("gr:filterChange", { category: this.currentCategory });
  }

  goTo(id) {
    const element = this.workElements.find((el) => el.dataset.id === id);
    if (!element) return;
    const behavior = this.options.scroll.smooth ? "smooth" : "auto";
    if (this.isHorizontal()) {
      const left =
        element.offsetLeft - (this.wall.clientWidth - element.offsetWidth) / 2;
      this.wall.scrollTo({ left, behavior });
    } else {
      element.scrollIntoView({ behavior, block: "center" });
    }
  }

  open(id) {
    const work = this.getWork(id);
    if (!work) return;

    this.openedWorkId = id;
    this.modal.querySelector(".gr-modal-media").innerHTML = renderMedia(work, {
      lazy: false,
      inModal: true
    });
    const index = this.works.indexOf(work);
    this.modal.querySelector(".gr-modal-caption").innerHTML = this.renderCaption(
      work,
      index
    );

    this.modal.classList.add("gr-open");
    this.modal.setAttribute("aria-hidden", "false");

    this._previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    this.modal.querySelector(".gr-modal-close").focus();
    this.dispatch("gr:workOpen", { work });
  }

  close() {
    if (!this.openedWorkId) return;
    const work = this.getWork(this.openedWorkId);
    this.openedWorkId = null;

    this.modal.classList.remove("gr-open");
    this.modal.setAttribute("aria-hidden", "true");
    this.modal.querySelector(".gr-modal-media").innerHTML = "";
    this.modal.querySelector(".gr-modal-caption").innerHTML = "";

    document.body.style.overflow = this._previousBodyOverflow;

    if (work) {
      const element = this.workElements.find((el) => el.dataset.id === work.id);
      if (element) element.focus();
      this.dispatch("gr:workClose", { work });
    }
  }

  update(newOptions) {
    const merged = Object.assign({}, this.options, newOptions || {});
    this.removeListeners();
    this.options = this.normalizeOptions(merged);
    this.works = this.options.works;
    this.currentCategory = "all";
    this.currentWorkId = null;
    this.openedWorkId = null;
    document.body.style.overflow = this._previousBodyOverflow;
    this.init();
  }

  destroy() {
    this.removeListeners();
    if (this.openedWorkId) {
      document.body.style.overflow = this._previousBodyOverflow;
      this.openedWorkId = null;
    }
    this.root.innerHTML = "";
    this._destroyed = true;
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  step(direction) {
    const visible = filterWorks(this.works, this.currentCategory);
    if (visible.length === 0) return;
    const currentIndex = visible.findIndex((work) => work.id === this.currentWorkId);
    const nextIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      visible.length - 1
    );
    this.goTo(visible[nextIndex].id);
  }

  getWork(id) {
    return this.works.find((work) => work.id === id) || null;
  }

  removeListeners() {
    for (const [target, type, handler, options] of this._listeners) {
      target.removeEventListener(type, handler, options);
    }
    this._listeners = [];
  }

  dispatch(name, detail) {
    this.root.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }
}

export default GalleryRoom;
