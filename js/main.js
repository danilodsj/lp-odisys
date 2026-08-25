(function () {
  "use strict";

  function setupReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length || typeof IntersectionObserver === "undefined") {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  function setupCarousel() {
    var wrap = document.querySelector("[data-carousel-scroll]");
    if (!wrap) return;
    var track = wrap.querySelector("[data-carousel-track]");
    var slides = Array.prototype.slice.call(wrap.querySelectorAll("[data-carousel-slide]"));
    var dots = Array.prototype.slice.call(wrap.querySelectorAll("[data-carousel-dot]"));
    var steps = Array.prototype.slice.call(wrap.querySelectorAll("[data-carousel-step]"));
    var bar = wrap.querySelector("[data-carousel-bar]");
    var counter = wrap.querySelector("[data-carousel-counter]");
    var n = slides.length;
    if (!track || !n) return;

    slides.forEach(function (s, i) {
      Array.prototype.slice.call(s.querySelectorAll(".ig-slide-content")).forEach(function (c) {
        if (i > 0) {
          c.style.opacity = "0";
          c.style.transform = "translateY(12px)";
        }
      });
    });

    var current = -1;
    var alive = true;

    function apply() {
      var rect = wrap.getBoundingClientRect();
      var total = wrap.offsetHeight - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      var idx = Math.max(0, Math.min(n - 1, Math.floor(p * n * 0.999)));
      if (idx === current) return;
      current = idx;

      track.style.transform = "translateX(" + -idx * 100 + "%)";

      slides.forEach(function (s, i) {
        Array.prototype.slice.call(s.querySelectorAll(".ig-slide-content")).forEach(function (c) {
          var on = i <= idx;
          c.style.opacity = on ? "1" : "0";
          c.style.transform = on ? "none" : "translateY(12px)";
        });
      });

      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i <= idx);
      });

      steps.forEach(function (s, i) {
        var on = i <= idx;
        s.style.background = i === idx ? "var(--surface-2)" : "var(--void)";
        var num = s.children[0];
        var label = s.children[1];
        if (label) label.style.color = on ? "var(--ink)" : "var(--text-faint)";
        if (num) num.style.color = i === idx ? "var(--violet)" : "var(--text-faint)";
      });

      if (bar) bar.style.width = ((idx + 1) / n) * 100 + "%";
      if (counter) counter.textContent = "0" + (idx + 1) + " / 0" + n;
    }

    function tick() {
      if (!alive) return;
      apply();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupReveal();
    setupCarousel();
  });
})();
