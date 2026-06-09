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

  // Quote carousel — auto-rotate + clickable dots + pause on hover
  var quoteCarousel = document.querySelector("[data-quote-carousel]");
  if (quoteCarousel) {
    var quoteCards = quoteCarousel.querySelectorAll("[data-quote-card]");
    var quoteDots = quoteCarousel.querySelectorAll("[data-quote-dot]");
    var quoteIdx = 0;
    var quoteTimer = null;
    var quoteInterval = 5200;

    function showQuote(next) {
      if (next === quoteIdx) return;
      var prev = quoteIdx;
      quoteIdx = next;
      quoteCards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === next);
        card.classList.toggle("is-leaving", i === prev);
      });
      quoteDots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === next);
      });
      setTimeout(function () {
        quoteCards.forEach(function (card) {
          card.classList.remove("is-leaving");
        });
      }, 600);
    }

    function queueNextQuote() {
      clearTimeout(quoteTimer);
      quoteTimer = setTimeout(function () {
        var next = (quoteIdx + 1) % quoteCards.length;
        showQuote(next);
        queueNextQuote();
      }, quoteInterval);
    }

    if (quoteCards.length > 1 && !prefersReduced) {
      queueNextQuote();
      quoteCarousel.addEventListener("mouseenter", function () {
        clearTimeout(quoteTimer);
      });
      quoteCarousel.addEventListener("mouseleave", queueNextQuote);
    }

    quoteDots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var target = parseInt(dot.getAttribute("data-quote-dot") || "0", 10);
        showQuote(target);
        if (!prefersReduced) queueNextQuote();
      });
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

/* ============================================================
   UPGRADE LAYER — theme, palette, pipeline, scramble, toast,
   local time, fab, confetti
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var EMAIL = "natharris2000@yahoo.com";
  var onProjectsPage = /projects\.html$/.test(window.location.pathname);

  function pageHref(hash) {
    return onProjectsPage ? "index.html" + hash : hash;
  }

  /* ---------- Toast ---------- */
  var toastEl = document.querySelector("[data-toast]");
  var toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2400);
  }

  /* ---------- Copy email ---------- */
  function copyEmail(value) {
    var text = value || EMAIL;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { showToast("Email copied to clipboard"); },
        function () { showToast(text); }
      );
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("Email copied to clipboard");
      } catch (e) {
        showToast(text);
      }
      document.body.removeChild(ta);
    }
  }

  document.querySelectorAll("[data-copy-email]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyEmail(btn.getAttribute("data-copy-email"));
    });
  });

  /* ---------- Theme toggle ---------- */
  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, animate) {
    if (animate && !prefersReduced) {
      root.classList.add("theme-anim");
      setTimeout(function () {
        root.classList.remove("theme-anim");
      }, 450);
    }
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#161310" : "#14120f");
    }
  }

  function toggleTheme() {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
  }

  document
    .querySelectorAll("[data-theme-toggle], [data-theme-toggle-alt]")
    .forEach(function (btn) {
      btn.addEventListener("click", toggleTheme);
    });

  /* ---------- Hero name scramble ---------- */
  var scrambleEl = document.querySelector("[data-scramble]");
  if (scrambleEl && !prefersReduced) {
    var finalText = scrambleEl.getAttribute("data-scramble") || scrambleEl.textContent;
    var GLYPHS = "abcdefghijklmnopqrstuvwxyz·*&%#@!?";
    var frame = 0;
    var totalFrames = 36;
    function scrambleTick() {
      frame += 1;
      var progress = frame / totalFrames;
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        var revealPoint = (i + 1) / finalText.length;
        if (progress >= revealPoint) {
          out += finalText[i];
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      scrambleEl.textContent = out;
      if (progress < 1) {
        requestAnimationFrame(scrambleTick);
      } else {
        scrambleEl.textContent = finalText;
      }
    }
    setTimeout(function () {
      requestAnimationFrame(scrambleTick);
    }, 350);
  }

  /* ---------- Command palette ---------- */
  var paletteEl = document.querySelector("[data-palette]");
  var paletteInput = document.querySelector("[data-palette-input]");
  var paletteList = document.querySelector("[data-palette-list]");

  var paletteItems = [
    { group: "Navigate", icon: "↘", label: "Home", hint: "Section", run: function () { go(pageHref("#home")); } },
    { group: "Navigate", icon: "↘", label: "Work & highlights", hint: "Section", run: function () { go(pageHref("#impact")); } },
    { group: "Navigate", icon: "↘", label: "How a course ships (pipeline)", hint: "Section", run: function () { go(pageHref("#pipeline")); } },
    { group: "Navigate", icon: "↘", label: "Skills & tools", hint: "Section", run: function () { go(pageHref("#skills")); } },
    { group: "Navigate", icon: "↘", label: "Experience", hint: "Section", run: function () { go(pageHref("#experience")); } },
    { group: "Navigate", icon: "↘", label: "About", hint: "Section", run: function () { go(pageHref("#about")); } },
    { group: "Navigate", icon: "↘", label: "Contact", hint: "Section", run: function () { go(pageHref("#contact")); } },
    { group: "Navigate", icon: "▦", label: "Projects page", hint: "Page", run: function () { window.location.href = "projects.html"; } },
    { group: "Actions", icon: "◐", label: "Toggle dark / light mode", hint: "T", run: toggleTheme },
    { group: "Actions", icon: "✉", label: "Copy email address", hint: "Clipboard", run: function () { copyEmail(EMAIL); } },
    { group: "Actions", icon: "✎", label: "Compose email", hint: "Mail app", run: function () { window.location.href = "mailto:" + EMAIL; } },
    { group: "Links", icon: "in", label: "LinkedIn profile", hint: "↗", run: function () { window.open("https://www.linkedin.com/in/natasha-harris-", "_blank", "noopener"); } },
    { group: "Links", icon: "{}", label: "GitHub — portfolio source", hint: "↗", run: function () { window.open("https://github.com/ndh11/My-Portfolio", "_blank", "noopener"); } }
  ];

  var paletteSelected = 0;
  var paletteFiltered = paletteItems.slice();
  var lastFocused = null;

  function go(href) {
    if (href.charAt(0) === "#") {
      var target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
        return;
      }
    }
    window.location.href = href;
  }

  function renderPalette() {
    if (!paletteList) return;
    paletteList.innerHTML = "";
    if (!paletteFiltered.length) {
      var empty = document.createElement("li");
      empty.className = "palette__empty";
      empty.textContent = "No matches — try \u201ccontact\u201d or \u201cdark\u201d";
      paletteList.appendChild(empty);
      return;
    }
    var lastGroup = null;
    paletteFiltered.forEach(function (item, i) {
      if (item.group !== lastGroup) {
        lastGroup = item.group;
        var g = document.createElement("li");
        g.className = "palette__group";
        g.setAttribute("aria-hidden", "true");
        g.textContent = item.group;
        paletteList.appendChild(g);
      }
      var li = document.createElement("li");
      li.setAttribute("role", "presentation");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "palette__item" + (i === paletteSelected ? " is-selected" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", i === paletteSelected ? "true" : "false");
      btn.innerHTML =
        '<span class="palette__icon" aria-hidden="true">' + item.icon + "</span>" +
        "<span>" + item.label + "</span>" +
        '<span class="palette__item-hint">' + item.hint + "</span>";
      btn.addEventListener("click", function () {
        runPaletteItem(item);
      });
      btn.addEventListener("mousemove", function () {
        if (paletteSelected !== i) {
          paletteSelected = i;
          updatePaletteSelection();
        }
      });
      li.appendChild(btn);
      paletteList.appendChild(li);
    });
  }

  function updatePaletteSelection() {
    if (!paletteList) return;
    var buttons = paletteList.querySelectorAll(".palette__item");
    buttons.forEach(function (b, i) {
      b.classList.toggle("is-selected", i === paletteSelected);
      b.setAttribute("aria-selected", i === paletteSelected ? "true" : "false");
      if (i === paletteSelected) {
        b.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function filterPalette(query) {
    var q = query.trim().toLowerCase();
    paletteFiltered = !q
      ? paletteItems.slice()
      : paletteItems.filter(function (item) {
          return (item.label + " " + item.group + " " + item.hint).toLowerCase().indexOf(q) !== -1;
        });
    paletteSelected = 0;
    renderPalette();
  }

  function openPalette() {
    if (!paletteEl) return;
    lastFocused = document.activeElement;
    paletteEl.hidden = false;
    paletteInput.value = "";
    filterPalette("");
    paletteInput.focus();
    document.body.style.overflow = "hidden";
  }

  function closePalette() {
    if (!paletteEl || paletteEl.hidden) return;
    paletteEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  function runPaletteItem(item) {
    closePalette();
    setTimeout(item.run, 60);
  }

  if (paletteEl && paletteInput && paletteList) {
    document.querySelectorAll("[data-palette-open]").forEach(function (btn) {
      btn.addEventListener("click", openPalette);
    });
    document.querySelectorAll("[data-palette-close]").forEach(function (el) {
      el.addEventListener("click", closePalette);
    });
    paletteInput.addEventListener("input", function () {
      filterPalette(paletteInput.value);
    });
    paletteInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        paletteSelected = Math.min(paletteSelected + 1, paletteFiltered.length - 1);
        updatePaletteSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        paletteSelected = Math.max(paletteSelected - 1, 0);
        updatePaletteSelection();
      } else if (e.key === "Enter") {
        e.preventDefault();
        var item = paletteFiltered[paletteSelected];
        if (item) runPaletteItem(item);
      }
    });
  }

  /* ---------- Global keyboard shortcuts ---------- */
  document.addEventListener("keydown", function (e) {
    var isTyping =
      /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || "") ||
      (e.target && e.target.isContentEditable);

    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (paletteEl && paletteEl.hidden) {
        openPalette();
      } else {
        closePalette();
      }
      return;
    }
    if (e.key === "Escape") {
      closePalette();
      return;
    }
    if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "t" || e.key === "T") {
      toggleTheme();
    }
  });

  /* ---------- Pipeline ---------- */
  var pipelineEl = document.querySelector("[data-pipeline]");
  if (pipelineEl) {
    var stages = [
      {
        title: "Concept",
        desc: "Scope the course with learning outcomes first: who it\u2019s for, what they\u2019ll build, and where it fits the catalog. Roadmapped and sprint-planned before a single lesson exists.",
        tools: ["Notion", "ClickUp", "Roadmapping", "OKRs"]
      },
      {
        title: "AI draft",
        desc: "Generate first-pass curriculum, lesson copy, and exercises with AI \u2014 prompt-engineered templates keep voice and structure consistent across 40+ courses.",
        tools: ["ChatGPT", "Claude", "Gemini", "Prompt engineering"]
      },
      {
        title: "Build & QA",
        desc: "Humans take over where judgment matters: technical accuracy, age-appropriateness, and projects that actually compile. Automations route QA tickets so nothing slips.",
        tools: ["Make.com", "Zapier", "Python", "QA tracking"]
      },
      {
        title: "Launch",
        desc: "Video production, platform delivery, and publishing automations push the course live \u2014 plus ad creative across Meta, Google, and social to bring learners in.",
        tools: ["Premiere Pro", "Photoshop", "Meta Ads", "Google Ads"]
      },
      {
        title: "Measure",
        desc: "Completion funnels in BigQuery and Looker Studio show exactly where learners drop off. Underperforming modules get restructured \u2014 then the loop starts again.",
        tools: ["BigQuery (SQL)", "Looker Studio", "A/B testing", "Dashboards"]
      }
    ];

    var nodes = pipelineEl.querySelectorAll("[data-pipeline-node]");
    var fillEl = pipelineEl.querySelector("[data-pipeline-fill]");
    var packetEl = pipelineEl.querySelector("[data-pipeline-packet]");
    var detailEl = pipelineEl.querySelector("[data-pipeline-detail]");
    var titleEl = pipelineEl.querySelector("[data-pipeline-title]");
    var descEl = pipelineEl.querySelector("[data-pipeline-desc]");
    var toolsEl = pipelineEl.querySelector("[data-pipeline-tools]");
    var runBtn = pipelineEl.querySelector("[data-pipeline-run]");
    var statusEl = pipelineEl.querySelector("[data-pipeline-status]");
    var activeStage = 0;
    var isRunning = false;
    var runTimers = [];

    function setStage(idx, fromRun) {
      activeStage = idx;
      nodes.forEach(function (node, i) {
        node.classList.toggle("is-active", i === idx);
        node.classList.toggle("is-done", fromRun ? i < idx : false);
        node.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
      if (fillEl) {
        fillEl.style.width = (idx / (stages.length - 1)) * 100 + "%";
      }
      var stage = stages[idx];
      if (detailEl && !prefersReduced) {
        detailEl.classList.remove("is-switching");
        void detailEl.offsetWidth;
        detailEl.classList.add("is-switching");
      }
      if (titleEl) titleEl.textContent = stage.title;
      if (descEl) descEl.textContent = stage.desc;
      if (toolsEl) {
        toolsEl.innerHTML = "";
        stage.tools.forEach(function (tool) {
          var chip = document.createElement("span");
          chip.textContent = tool;
          toolsEl.appendChild(chip);
        });
      }
    }

    function stopRun() {
      runTimers.forEach(clearTimeout);
      runTimers = [];
      isRunning = false;
      if (packetEl) packetEl.classList.remove("is-running");
      if (runBtn) runBtn.innerHTML = 'Run the pipeline <span aria-hidden="true">\u25b8</span>';
    }

    function runPipeline() {
      if (isRunning) {
        stopRun();
        setStage(activeStage, false);
        if (statusEl) statusEl.textContent = "5 stages \u00b7 concept to live course";
        return;
      }
      isRunning = true;
      if (runBtn) runBtn.innerHTML = 'Stop <span aria-hidden="true">\u25a0</span>';
      var stepMs = prefersReduced ? 0 : 950;
      if (packetEl && !prefersReduced) {
        packetEl.classList.add("is-running");
        packetEl.style.transition = "left " + stepMs / 1000 + "s cubic-bezier(0.45, 0, 0.25, 1), transform 0.3s ease";
      }
      stages.forEach(function (stage, i) {
        var t = setTimeout(function () {
          setStage(i, true);
          if (packetEl) packetEl.style.left = (i / (stages.length - 1)) * 100 + "%";
          if (statusEl) statusEl.textContent = "Stage " + (i + 1) + " of " + stages.length + " \u2014 " + stage.title;
          if (i === stages.length - 1) {
            var done = setTimeout(function () {
              stopRun();
              nodes.forEach(function (node, j) {
                node.classList.toggle("is-done", j < stages.length - 1);
              });
              if (statusEl) statusEl.textContent = "Shipped \u2728 \u2014 and the data loops back to stage 01";
            }, stepMs);
            runTimers.push(done);
          }
        }, i * stepMs);
        runTimers.push(t);
      });
    }

    nodes.forEach(function (node) {
      node.addEventListener("click", function () {
        stopRun();
        setStage(parseInt(node.getAttribute("data-pipeline-node"), 10) || 0, false);
        if (statusEl) statusEl.textContent = "5 stages \u00b7 concept to live course";
      });
    });

    if (runBtn) runBtn.addEventListener("click", runPipeline);
    setStage(0, false);
  }

  /* ---------- Footer local time (Arizona, no DST) ---------- */
  var timeEl = document.querySelector("[data-local-time]");
  if (timeEl) {
    var updateTime = function () {
      try {
        timeEl.textContent = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Phoenix"
        }).format(new Date());
      } catch (e) {
        timeEl.textContent = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  /* ---------- Back-to-top progress ring ---------- */
  var fabEl = document.querySelector("[data-fab-top]");
  var fabRing = document.querySelector("[data-fab-ring]");
  var RING_LENGTH = 119.4;
  if (fabEl) {
    var updateFab = function () {
      var y = window.scrollY || 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? y / h : 0;
      fabEl.classList.toggle("is-visible", y > window.innerHeight * 0.6);
      if (fabRing) {
        fabRing.style.strokeDashoffset = String(RING_LENGTH * (1 - pct));
      }
    };
    window.addEventListener("scroll", updateFab, { passive: true });
    fabEl.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
    updateFab();
  }

  /* ---------- Confetti ---------- */
  var confettiCanvas = document.querySelector("[data-confetti-canvas]");
  var confettiBtns = document.querySelectorAll("[data-confetti]");
  if (confettiCanvas && confettiBtns.length && !prefersReduced) {
    var ctx = confettiCanvas.getContext("2d");
    var particles = [];
    var confettiRaf = 0;
    var COLORS = ["#c45c3e", "#e8a07a", "#8f3d28", "#786ed2", "#1f9d55", "#f3c88f"];

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      confettiCanvas.width = window.innerWidth * dpr;
      confettiCanvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burst(x, y) {
      sizeCanvas();
      for (var i = 0; i < 110; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 4 + Math.random() * 9;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          size: 4 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.3,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          shape: Math.random() > 0.5 ? "rect" : "circle"
        });
      }
      if (!confettiRaf) confettiLoop();
    }

    function confettiLoop() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles = particles.filter(function (p) { return p.life > 0; });
      if (!particles.length) {
        confettiRaf = 0;
        return;
      }
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.rotation += p.vr;
        p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      confettiRaf = requestAnimationFrame(confettiLoop);
    }

    confettiBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var r = btn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2);
        showToast("Thanks for stopping by \u2728");
      });
    });
  }

  /* ---------- Console greeting ---------- */
  try {
    console.log(
      "%c Hi, I\u2019m Natasha. %c\n\nYou checked the console \u2014 I like you already.\nThis site is hand-coded: no framework, no build step.\nPress \u2318K (or Ctrl+K) on the page for the command menu.\n\n\u2192 natharris2000@yahoo.com",
      "font-size: 16px; font-weight: bold; background: #c45c3e; color: #faf7f2; padding: 6px 12px; border-radius: 6px;",
      "font-size: 12px; color: #888;"
    );
  } catch (e) {}
})();
