(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector(".theme-toggle");
  function label() {
    toggle.textContent = root.getAttribute("data-theme") === "dark" ? "Light mode" : "Dark mode";
  }
  label();
  toggle.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });

  /* ---------- Cockpit window: robot pilot + bouncing icons ---------- */
  var stage = document.querySelector(".stage");
  var bubble = document.querySelector(".bubble");
  var mascot = document.querySelector(".mascot");
  var bot = document.querySelector(".bot");
  var pupils = document.querySelector(".pupils");
  var chipEls = Array.prototype.slice.call(document.querySelectorAll(".chip"));

  var messages = [
    "Hi, I’m Umar!",
    "Python developer in training",
    "Poke the icons!",
    "Let’s build something real",
    "Open to junior roles"
  ];
  var msgIndex = 0;
  var bubbleTimer = null;

  function say(text) {
    bubble.classList.remove("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      bubble.textContent = text;
      bubble.classList.add("show");
    }, reduce ? 0 : 220);
  }
  function nextMessage() {
    msgIndex = (msgIndex + 1) % messages.length;
    say(messages[msgIndex]);
  }

  var W = 0, H = 0, chips = [];
  var pointer = { x: 0, y: 0, active: false };
  var raf = null, last = 0, visible = true;

  function measure() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    chips.forEach(function (c) {
      c.w = c.el.offsetWidth;
      c.h = c.el.offsetHeight;
      c.x = Math.min(c.x, Math.max(0, W - c.w));
      c.y = Math.min(c.y, Math.max(0, H - c.h));
    });
  }

  function place(c) {
    c.el.style.transform = "translate(" + c.x.toFixed(1) + "px," + c.y.toFixed(1) + "px)";
  }

  function initStage() {
    chips = chipEls.map(function (el, i) {
      var angle = Math.random() * Math.PI * 2;
      var base = 55 + Math.random() * 40;
      return {
        el: el, x: 0, y: 0, w: 0, h: 0, base: base,
        vx: Math.cos(angle) * base, vy: Math.sin(angle) * base
      };
    });
    measure();

    if (reduce) {
      /* Still and tidy: icons sit in a grid at the top of the window */
      chips.forEach(function (c, i) {
        c.x = 14 + (i % 3) * (W / 3 - 6);
        c.y = 16 + Math.floor(i / 3) * 46;
        place(c);
      });
      say(messages[0]);
      return;
    }

    chips.forEach(function (c) {
      c.x = Math.random() * Math.max(1, W - c.w);
      c.y = Math.random() * Math.max(1, H - c.h);
      place(c);
    });
    setTimeout(function () { say(messages[0]); }, 1200);
    setInterval(function () { if (visible) { nextMessage(); } }, 5200);
    start();
  }

  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    chips.forEach(function (c) {
      if (pointer.active) {
        var dx = c.x + c.w / 2 - pointer.x;
        var dy = c.y + c.h / 2 - pointer.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < 110) {
          var f = ((110 - d) / 110) * 700 * dt;
          c.vx += (dx / d) * f;
          c.vy += (dy / d) * f;
        }
      }
      /* Ease speed back toward the icon's cruising speed */
      var sp = Math.sqrt(c.vx * c.vx + c.vy * c.vy) || 1;
      var k = 1 + (c.base / sp - 1) * Math.min(1, dt * 1.5);
      c.vx *= k; c.vy *= k;

      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.x < 0) { c.x = 0; c.vx = Math.abs(c.vx); }
      if (c.x > W - c.w) { c.x = W - c.w; c.vx = -Math.abs(c.vx); }
      if (c.y < 0) { c.y = 0; c.vy = Math.abs(c.vy); }
      if (c.y > H - c.h) { c.y = H - c.h; c.vy = -Math.abs(c.vy); }
      place(c);
    });
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf === null && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  /* Poke an icon: it spins, speeds off, and the pilot comments */
  chipEls.forEach(function (el, i) {
    el.addEventListener("click", function () {
      el.classList.remove("spin");
      void el.offsetWidth;
      el.classList.add("spin");
      setTimeout(function () { el.classList.remove("spin"); }, 650);
      if (chips[i] && !reduce) {
        var a = Math.random() * Math.PI * 2;
        chips[i].vx = Math.cos(a) * 320;
        chips[i].vy = Math.sin(a) * 320;
      }
      say(el.getAttribute("data-say"));
    });
  });

  /* Click the pilot: it jumps and says something new */
  mascot.addEventListener("click", function () {
    bot.classList.remove("jump");
    void bot.getBoundingClientRect();
    if (!reduce) { bot.classList.add("jump"); }
    nextMessage();
  });

  /* Icons run away from the pointer; pilot's eyes follow it */
  stage.addEventListener("pointermove", function (e) {
    var r = stage.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
  });
  stage.addEventListener("pointerleave", function () { pointer.active = false; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      var r = bot.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height * 0.4;
      var nx = clamp((e.clientX - cx) / 220, -1, 1) * 6;
      var ny = clamp((e.clientY - cy) / 220, -1, 1) * 5;
      pupils.setAttribute("transform", "translate(" + nx.toFixed(1) + " " + ny.toFixed(1) + ")");
    }, { passive: true });
  }

  window.addEventListener("resize", measure);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { start(); } else { stop(); }
    }).observe(stage);
  }

  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  ready.then(initStage);

  /* ---------- Reduced motion: plane sits at its destination ---------- */
  if (reduce) {
    var plane = document.querySelector(".plane");
    var anim = plane && plane.querySelector("animateMotion");
    if (anim) { anim.remove(); }
    if (plane) {
      plane.setAttribute("transform", "translate(616 24) rotate(-35)");
      plane.style.opacity = "1";
    }
    return;
  }

  /* ---------- Scroll progress bar ---------- */
  var bar = document.querySelector(".progress");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal sections as they scroll into view ---------- */
  if ("IntersectionObserver" in window) {
    root.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }
})();
