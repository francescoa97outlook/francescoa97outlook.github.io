/* main.js — nav toggle, theme toggle, scroll-reveal, gallery + lightbox.
   Vanilla JS, no dependencies. Safe to load with `defer`. */
(function () {
  "use strict";

  /* ---------- Theme toggle (persisted) ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.setAttribute("data-theme", "light");
  }
  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      themeBtn.setAttribute("aria-pressed", String(next === "light"));
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Gallery (built from GALLERY_DATA) + lightbox ---------- */
  var galleryRoot = document.getElementById("gallery");
  var flat = []; // flat list of media for lightbox navigation

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  if (galleryRoot && Array.isArray(window.GALLERY_DATA)) {
    window.GALLERY_DATA.forEach(function (cat) {
      var section = el("section", { class: "gallery-cat reveal" });
      section.appendChild(el("h2", null, cat.title));
      var grid = el("div", { class: "masonry" });
      cat.items.forEach(function (item) {
        var idx = flat.length;
        flat.push(Object.assign({ category: cat.title }, item));
        var fig = el("div", { class: "shot" });
        var btn = el("button", {
          type: "button",
          "data-index": String(idx),
          "aria-label": "Open " + (item.alt || cat.title) + " in viewer"
        });
        if (item.type === "video") {
          var v = el("video", { muted: "", playsinline: "", preload: "metadata" });
          v.appendChild(el("source", { src: item.src, type: "video/mp4" }));
          btn.appendChild(v);
        } else {
          btn.appendChild(el("img", { src: item.src, alt: item.alt || cat.title, loading: "lazy", decoding: "async" }));
        }
        fig.appendChild(btn);
        grid.appendChild(fig);
      });
      section.appendChild(grid);
      galleryRoot.appendChild(section);
    });

    // re-observe newly added reveal sections
    if ("IntersectionObserver" in window) {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io2.unobserve(en.target); } });
      }, { threshold: 0.05 });
      galleryRoot.querySelectorAll(".reveal").forEach(function (n) { io2.observe(n); });
    }
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById("lightbox");
  if (lb && flat.length) {
    var lbMedia = lb.querySelector(".lb-media");
    var lbCap = lb.querySelector("figcaption");
    var current = 0;
    var lastFocus = null;

    function render(i) {
      current = (i + flat.length) % flat.length;
      var m = flat[current];
      lbMedia.innerHTML = "";
      if (m.type === "video") {
        var v = el("video", { controls: "", autoplay: "", playsinline: "" });
        v.appendChild(el("source", { src: m.src, type: "video/mp4" }));
        lbMedia.appendChild(v);
      } else {
        lbMedia.appendChild(el("img", { src: m.src, alt: m.alt || m.category }));
      }
      lbCap.textContent = (m.alt ? m.alt + " — " : "") + m.category;
    }
    function open(i) {
      lastFocus = document.activeElement;
      render(i);
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      lbMedia.innerHTML = "";
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    galleryRoot.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-index]");
      if (b) open(parseInt(b.getAttribute("data-index"), 10));
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { render(current - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { render(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") render(current - 1);
      else if (e.key === "ArrowRight") render(current + 1);
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
