(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var header = document.querySelector("[data-header]");
  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");
  var yearEl = document.querySelector("[data-year]");
  var progressEl = document.querySelector("[data-progress]");
  var cursorEl = document.querySelector("[data-cursor]");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Mobile nav toggle
  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        setNavOpen(false);
      });
    });
  }

  // Header shadow + scroll progress bar
  function updateScroll() {
    var y = window.scrollY || 0;
    if (header) {
      header.style.boxShadow =
        y > 12 ? "0 8px 32px rgba(20, 18, 15, 0.06)" : "none";
    }
    if (progressEl) {
      var h =
        document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (y / h) * 100 : 0;
      progressEl.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }
    updateTimeline();
    updateActiveNav();
  }

  // Reveal with staggered children
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && "IntersectionObserver" in window) {
    if (prefersReduced) {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              if (entry.target.hasAttribute("data-stagger")) {
                var children = entry.target.children;
                for (var i = 0; i < children.length; i++) {
                  children[i].style.setProperty(
                    "--reveal-delay",
                    i * 90 + "ms"
                  );
                }
              }
              io.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    }
  } else if (revealEls.length) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Animated counters
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !prefersReduced) {
    var cIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (c) {
      cIO.observe(c);
    });
  } else if (counters.length) {
    counters.forEach(function (c) {
      var target = c.querySelector("[data-count-target]");
      if (target) {
        target.textContent =
          c.getAttribute("data-count") +
          (c.getAttribute("data-suffix") || "");
      }
    });
  }

  function animateCount(el) {
    var target = el.querySelector("[data-count-target]");
    if (!target) return;
    var end = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var current = Math.round(end * eased);
      target.textContent = current + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Rotating words
  var rotator = document.querySelector("[data-rotator]");
  if (rotator && !prefersReduced) {
    var words = rotator.querySelectorAll(".rotator__word");
    if (words.length > 1) {
      var idx = 0;
      setInterval(function () {
        var current = words[idx];
        var nextIdx = (idx + 1) % words.length;
        var next = words[nextIdx];
        current.classList.add("is-leaving");
        current.classList.remove("is-active");
        next.classList.add("is-active");
        setTimeout(function () {
          current.classList.remove("is-leaving");
        }, 600);
        idx = nextIdx;
      }, 2200);
    }
  }

  // Card tilt + parallax spotlight
  if (canHover && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var rect = null;
      var isCard = el.classList.contains("card");
      var maxTilt = isCard ? 5 : 8;
      function onMove(e) {
        rect = rect || el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var px = x / rect.width;
        var py = y / rect.height;
        var ry = (px - 0.5) * 2 * maxTilt;
        var rx = -(py - 0.5) * 2 * maxTilt;
        el.style.transform =
          "perspective(900px) rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg)";
        if (isCard) {
          el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        }
      }
      function onLeave() {
        rect = null;
        el.style.transform = "";
      }
      function onEnter() {
        rect = el.getBoundingClientRect();
      }
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });

    // Magnetic buttons
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 12;
      var raf = 0;
      function apply(x, y) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform =
            "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
        });
      }
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * strength * 2;
        var y = ((e.clientY - r.top) / r.height - 0.5) * strength * 2;
        apply(x, y);
      });
      el.addEventListener("mouseleave", function () {
        apply(0, 0);
        setTimeout(function () {
          el.style.transform = "";
        }, 180);
      });
    });

    // Cursor glow follower
    if (cursorEl) {
      var cx = -1000;
      var cy = -1000;
      var tx = cx;
      var ty = cy;
      document.addEventListener(
        "mousemove",
        function (e) {
          tx = e.clientX;
          ty = e.clientY;
          cursorEl.classList.add("is-visible");
        },
        { passive: true }
      );
      document.addEventListener("mouseleave", function () {
        cursorEl.classList.remove("is-visible");
      });
      function cursorLoop() {
        cx += (tx - cx) * 0.15;
        cy += (ty - cy) * 0.15;
        cursorEl.style.transform =
          "translate(-50%, -50%) translate3d(" + cx + "px, " + cy + "px, 0)";
        requestAnimationFrame(cursorLoop);
      }
      cursorLoop();
    }
  }

  // Timeline progress fill
  var timelineEl = document.querySelector("[data-timeline]");
  function updateTimeline() {
    if (!timelineEl) return;
    var rect = timelineEl.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height + vh;
    var seen = Math.min(total, Math.max(0, vh - rect.top));
    var pct = Math.max(0, Math.min(100, (seen / total) * 110));
    timelineEl.style.setProperty("--progress", pct.toFixed(1) + "%");
  }

  // Active nav section tracking
  var navLinks = document.querySelectorAll(".site-nav a[href^='#']");
  var sections = [];
  navLinks.forEach(function (l) {
    var id = l.getAttribute("href");
    if (id && id.length > 1) {
      var sec = document.querySelector(id);
      if (sec) sections.push({ link: l, sec: sec });
    }
  });
  function updateActiveNav() {
    if (!sections.length) return;
    var y = window.scrollY + 120;
    var activeIdx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].sec.offsetTop <= y) activeIdx = i;
    }
    sections.forEach(function (s, i) {
      s.link.classList.toggle("is-active", i === activeIdx);
    });
  }

  // Projects filters
  var filterBtns = document.querySelectorAll("[data-filters] .filter");
  var projectCards = document.querySelectorAll("[data-project-grid] .project-card");
  var emptyMsg = document.querySelector("[data-empty]");
  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter") || "all";
        filterBtns.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        var shown = 0;
        projectCards.forEach(function (card) {
          var cats = (card.getAttribute("data-category") || "").split(/\s+/);
          var match = filter === "all" || cats.indexOf(filter) !== -1;
          card.classList.toggle("is-hidden", !match);
          if (match) shown += 1;
        });
        if (emptyMsg) {
          emptyMsg.hidden = shown !== 0;
        }
      });
    });
  }

  window.addEventListener("scroll", updateScroll, { passive: true });
  window.addEventListener("resize", updateScroll);
  updateScroll();
})();
