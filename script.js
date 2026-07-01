/* =========================================================
   LA DUEÑA — interactions
   Lenis smooth scroll · GSAP ScrollTrigger · Swiper
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll (single rAF driver) ---------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------- GSAP / ScrollTrigger ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on("scroll", ScrollTrigger.update); }

    /* Reveal on scroll */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", onEnter: function () { el.classList.add("is-visible"); } }
      });
    });

    /* Hero parallax (background image, not the headline) */
    if (!reduceMotion) {
      var heroImg = document.getElementById("heroImg");
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 12, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      }

      /* Section image parallax */
      gsap.utils.toArray("[data-parallax]").forEach(function (img) {
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: img.closest("[data-parallax-wrap]") || img, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    }

    /* Stat counters */
    gsap.utils.toArray("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end, duration: 1.8, ease: "power2.out",
            onUpdate: function () {
              var val = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString();
              el.textContent = val + suffix;
            }
          });
        }
      });
    });

    /* Letter stagger on signature titles */
    if (!reduceMotion) {
      gsap.utils.toArray("[data-letters]").forEach(function (title) {
        var text = title.textContent;
        title.innerHTML = "";
        text.split("").forEach(function (ch) {
          var span = document.createElement("span");
          span.className = "ltr";
          span.textContent = ch === " " ? " " : ch;
          title.appendChild(span);
        });
        gsap.from(title.querySelectorAll(".ltr"), {
          yPercent: 110, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.03,
          scrollTrigger: { trigger: title, start: "top 85%" }
        });
      });
    }
  }

  /* ---------- Nav: transparent over hero -> solid on scroll ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 60) nav.classList.add("is-solid");
    else nav.classList.remove("is-solid");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile overlay ---------- */
  var toggle = document.getElementById("navToggle");
  var overlay = document.getElementById("overlay");
  var overlayClose = document.getElementById("overlayClose");

  function openOverlay() {
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }
  function closeOverlay() {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
    document.body.style.overflow = "";
  }
  if (toggle) toggle.addEventListener("click", openOverlay);
  if (overlayClose) overlayClose.addEventListener("click", closeOverlay);
  overlay.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeOverlay); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeOverlay(); });

  /* ---------- Smooth anchor scrolling via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id === "#top") {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      var target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -70 });
        else target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu__tab");
  var panels = document.querySelectorAll(".menu__panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active"); tab.setAttribute("aria-selected", "true");
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* ---------- Highlight today's row ONLY when actually open now ---------- */
  (function () {
    var rows = document.querySelectorAll("#hours tbody tr");
    if (!rows.length) return;
    // open/close in minutes from midnight; close > 1440 = runs past midnight into next day
    var HRS = {
      0: { o: 960, c: 1440 },  // Sun 4:00 PM – 12:00 AM
      1: { o: 660, c: 1320 },  // Mon 11:00 AM – 10:00 PM
      2: { o: 660, c: 1440 },  // Tue 11:00 AM – 12:00 AM
      3: { o: 660, c: 1440 },  // Wed 11:00 AM – 12:00 AM
      4: { o: 660, c: 1560 },  // Thu 11:00 AM – 2:00 AM
      5: { o: 660, c: 1560 },  // Fri 11:00 AM – 2:00 AM
      6: { o: 660, c: 1560 }   // Sat 11:00 AM – 2:00 AM
    };
    var d = new Date();
    var day = d.getDay();                       // 0 Sun .. 6 Sat
    var now = d.getHours() * 60 + d.getMinutes();
    var open = false;
    var t = HRS[day];
    if (t && now >= t.o && now < Math.min(t.c, 1440)) open = true;   // today's shift, up to midnight
    var yt = HRS[(day + 6) % 7];                                     // yesterday
    if (yt && yt.c > 1440 && now < (yt.c - 1440)) open = true;       // still open from last night's late shift
    if (!open) return;                                              // closed → no highlight, no "Open now"
    var rowIndex = day === 0 ? 6 : day - 1;    // table order: Mon..Sun
    if (rows[rowIndex]) rows[rowIndex].classList.add("is-now");
  })();

  /* ---------- Gallery Swiper ---------- */
  if (window.Swiper) {
    if (document.querySelector(".gallery__swiper")) {
    new Swiper(".gallery__swiper", {
      slidesPerView: "auto",
      spaceBetween: 22,
      grabCursor: true,
      navigation: { prevEl: ".gallery__btn--prev", nextEl: ".gallery__btn--next" }
    });
    }

    new Swiper(".reviews__swiper", {
      slidesPerView: 1,
      loop: true,
      autoplay: { delay: 5200, disableOnInteraction: false },
      pagination: { el: ".reviews__dots", clickable: true },
      effect: "fade",
      fadeEffect: { crossFade: true }
    });
  }

  /* ---------- Catering form: friendly confirmation ---------- */
  var form = document.getElementById("caterForm");
  if (form) {
    form.addEventListener("submit", function () {
      var btn = form.querySelector(".cform__btn");
      if (btn) { btn.textContent = "Sending…"; }
    });
  }
})();
