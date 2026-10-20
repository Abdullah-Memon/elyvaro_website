/* v2: nav, reveals, cursor, magnetic, parallax, tilt, orbit. No deps. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- mobile navigation ---- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("mobile-menu");

  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var first = menu.querySelector("a");
        if (first) first.focus();
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    var mq = window.matchMedia("(min-width: 900px)");
    var onMq = function () {
      if (mq.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---- v3.1: auto-assign scroll reveals to remaining blocks ---- */
  var autoReveal = (function () {
    var FAMILY = /(^|\s)(reveal|reveal-l|reveal-r|reveal-pop|morph|clip|rise|rise-s|fade-io)(\s|$)/;
    var EXCLUDE = ".marquee, .orbit, .cursor, .nav, .hero, .footer__bottom, .visually-hidden, [data-par], [data-tilt], [data-magnetic], [data-orbit], .pairs__connector";
    var GRID = /^(depts|steps|features|gallery|duo|men|esplit|faq|intro__stats|pairs__grid|contact-grid|intro__grid|concept__grid|center-narrow|green__inner|band)$|__(grid|row|list|stats)$/;
    var CARD = /card|dept|tile|step|feature|fig|stat|item|pair|glow|form|side|info|men|esplit|ritual|band|check|col|num/i;
    var TEXT = /^(H[1-6]|P|UL|OL|BLOCKQUOTE|FIGCAPTION)$/;
    var TEXT_CLS = /s-head|eyebrow|sub|lede|note|tag|hint|status/i;

    var eligible = function (el) {
      if (!el || el.nodeType !== 1) return false;
      if (FAMILY.test(" " + el.className + " ")) return false;
      if (el.closest && el.closest(EXCLUDE)) return false;
      var t = el.tagName;
      if (t === "SCRIPT" || t === "STYLE" || t === "NOSCRIPT" || t === "HR" || t === "BR") return false;
      if (el.getAttribute("aria-hidden") === "true") return false;
      return true;
    };

    var kidsOf = function (root) {
      var out = [];
      Array.prototype.forEach.call(root.children, function (el) {
        if (eligible(el)) out.push(el);
      });
      return out;
    };

    var walk = function (root, depth) {
      var kids = kidsOf(root);
      kids.forEach(function (el, i) {
        var isGrid = depth < 2 && GRID.test(el.className);
        var sub = isGrid ? kidsOf(el) : null;
        if (sub && sub.length >= 2 && sub.length <= 14) {
          walk(el, depth + 1);
          return;
        }
        var cls;
        if (TEXT.test(el.tagName) || TEXT_CLS.test(el.className)) cls = "reveal";
        else if (kids.length === 1) cls = CARD.test(el.className) ? "reveal-pop" : "reveal";
        else cls = i % 2 === 0 ? "reveal-l" : "reveal-r";
        el.classList.add(cls);
        if (!/--d\s*:/.test(el.getAttribute("style") || "")) {
          el.style.setProperty("--d", Math.min(i, 6) * 90 + "ms");
        }
      });
    };

    return function () {
      if (reduced) return;
      Array.prototype.forEach.call(document.querySelectorAll("section, footer"), function (sec) {
        if (/\bhero\b/.test(sec.className)) return;
        sec.classList.add("fade-io");
        var wrap = null;
        Array.prototype.forEach.call(sec.children, function (c) {
          if (/\bwrap\b/.test(c.className)) wrap = c;
        });
        walk(wrap || sec, 0);
      });
    };
  })();
  autoReveal();

  /* ---- reveal on scroll (v2.2: reveal / reveal-l / reveal-r / reveal-pop / morph / clip / fade-io) ---- */
  var targets = document.querySelectorAll(".reveal, .reveal-l, .reveal-r, .reveal-pop, .morph, .clip, .fade-io");
  if (targets.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add("is-in");
      });
    } else {
      /* wrap morph words for stagger */
      Array.prototype.forEach.call(document.querySelectorAll(".morph"), function (el) {
        if (el.dataset.morphReady) return;
        el.dataset.morphReady = "1";
        var nodes = Array.prototype.slice.call(el.childNodes);
        var frag = document.createDocumentFragment();
        var wi = 0;
        nodes.forEach(function (node) {
          if (node.nodeType === 3) {
            var parts = node.textContent.split(/(\s+)/);
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              var w = document.createElement("span");
              w.className = "w";
              w.style.setProperty("--wi", wi);
              wi++;
              var inner = document.createElement("span");
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            });
          } else if (node.nodeType === 1) {
            /* keep accent spans etc. as a single morph unit */
            var w2 = document.createElement("span");
            w2.className = "w";
            w2.style.setProperty("--wi", wi);
            wi++;
            var inner2 = document.createElement("span");
            while (node.firstChild) inner2.appendChild(node.firstChild);
            inner2.className = node.className || "";
            w2.appendChild(inner2);
            frag.appendChild(w2);
          }
        });
        el.textContent = "";
        el.appendChild(frag);
      });

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: "0px 0px -16% 0px" }
      );
      Array.prototype.forEach.call(targets, function (el) {
        io.observe(el);
      });
    }
  }

  /* ---- cursor follower ---- */
  var cursor = document.querySelector(".cursor");
  if (cursor && finePointer && !reduced) {
    var cx = -100, cy = -100, tx = -100, ty = -100;
    var cursorOn = false;

    document.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!cursorOn) {
        cursorOn = true;
        cx = tx; cy = ty;
        cursor.classList.add("is-on");
      }
    });

    document.addEventListener("mouseleave", function () {
      cursor.classList.remove("is-on");
      cursorOn = false;
    });

    var hoverables = "a, button, [data-magnetic], .orbit__stage";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverables)) cursor.classList.add("is-big");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-big");
    });

    (function loopCursor() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loopCursor);
    })();
  }

  /* ---- magnetic buttons ---- */
  if (finePointer && !reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-magnetic]"), function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.3;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + mx * strength + "px," + my * strength + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---- mouse parallax ---- */
  if (finePointer && !reduced) {
    var parEls = document.querySelectorAll("[data-par]");
    if (parEls.length) {
      var host = document.querySelector("[data-par-host]") || document.body;
      host.addEventListener("mousemove", function (e) {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var nx = (e.clientX / w - 0.5) * 2;
        var ny = (e.clientY / h - 0.5) * 2;
        Array.prototype.forEach.call(parEls, function (el) {
          var s = parseFloat(el.getAttribute("data-par")) || 10;
          el.style.transform = "translate(" + nx * s + "px," + ny * s + "px)";
        });
      });
    }
  }

  /* ---- tilt cards ---- */
  if (finePointer && !reduced) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt]"), function (el) {
      var max = parseFloat(el.getAttribute("data-tilt")) || 5;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(900px) rotateY(" + px * max + "deg) rotateX(" + -py * max + "deg)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---- orbit carousel ---- */
  var orbit = document.querySelector("[data-orbit]");
  if (orbit) {
    var stage = orbit.querySelector(".orbit__stage");
    var ring = orbit.querySelector("[data-orbit-ring]");
    var items = orbit.querySelectorAll(".orbit__item");
    var titleEl = orbit.querySelector("[data-orbit-title]");
    var textEl = orbit.querySelector("[data-orbit-text]");
    var indexEl = orbit.querySelector("[data-orbit-index]");
    var count = items.length;
    var step = 360 / count;

    // set per-item step + radius from CSS vars based on viewport
    var setGeom = function () {
      var w = window.innerWidth;
      var radius = w < 768 ? 0 : w < 1100 ? 260 : 320;
      orbit.style.setProperty("--step", step + "deg");
      orbit.style.setProperty("--radius", radius + "px");
      Array.prototype.forEach.call(items, function (item, i) {
        item.style.setProperty("--i", i);
        item.style.setProperty("--step", step + "deg");
        item.style.setProperty("--radius", radius + "px");
      });
    };
    setGeom();
    window.addEventListener("resize", setGeom);

    var current = 0;
    var target = 0;
    var activeIdx = -1;

    var setActive = function (idx) {
      if (idx === activeIdx) return;
      activeIdx = idx;
      Array.prototype.forEach.call(items, function (item, i) {
        item.classList.toggle("is-active", i === idx);
      });
      var item = items[idx];
      if (item) {
        if (titleEl) titleEl.textContent = item.getAttribute("data-label") || "";
        if (textEl) textEl.textContent = item.getAttribute("data-text") || "";
        if (indexEl) indexEl.textContent = (idx + 1 < 10 ? "0" : "") + (idx + 1) + " / " + (count < 10 ? "0" : "") + count;
      }
    };

    setActive(0);

    if (window.matchMedia("(min-width: 768px)").matches) {
      // mouse-driven rotation
      orbit.addEventListener("mousemove", function (e) {
        var r = orbit.getBoundingClientRect();
        var ratio = (e.clientX - r.left) / r.width; // 0..1
        target = (ratio - 0.5) * 180; // -90..90 deg
      });

      // drag support
      var dragging = false;
      var dragX = 0;
      var dragStart = 0;
      stage.addEventListener("pointerdown", function (e) {
        dragging = true;
        dragX = e.clientX;
        dragStart = target;
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        target = dragStart + (e.clientX - dragX) * 0.35;
      });
      stage.addEventListener("pointerup", function () { dragging = false; });
      stage.addEventListener("pointercancel", function () { dragging = false; });

      // click item to bring front
      Array.prototype.forEach.call(items, function (item, i) {
        item.addEventListener("click", function () {
          // rotate so item i is at front: angle = -i * step
          target = -i * step;
        });
      });

      (function loopOrbit() {
        current += (target - current) * 0.08;
        ring.style.transform = "translate(-50%, -50%) rotateY(" + current + "deg)";
        // active item: the one closest to front (angle ≡ -current mod 360 near 0)
        var norm = ((-current % 360) + 360) % 360;
        var idx = Math.round(norm / step) % count;
        setActive(idx);
        requestAnimationFrame(loopOrbit);
      })();
    } else {
      // mobile: horizontal scroll - update HUD on scroll
      var scrollUpdate = function () {
        var stageRect = stage.getBoundingClientRect();
        var mid = stageRect.left + stageRect.width / 2;
        var best = 0;
        var bestDist = Infinity;
        Array.prototype.forEach.call(items, function (item, i) {
          var ir = item.getBoundingClientRect();
          var ic = ir.left + ir.width / 2;
          var d = Math.abs(ic - mid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setActive(best);
      };
      stage.addEventListener("scroll", scrollUpdate, { passive: true });
    }
  }

  /* ---- FAQ accordion ---- */
  var faqs = document.querySelectorAll(".faq");
  Array.prototype.forEach.call(faqs, function (faq) {
    var items = faq.querySelectorAll(".faq__item");
    Array.prototype.forEach.call(items, function (item) {
      var btn = item.querySelector(".faq__q");
      var panel = item.querySelector(".faq__a");
      if (!btn || !panel) return;
      btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");
        // close siblings
        Array.prototype.forEach.call(items, function (sib) {
          sib.classList.remove("is-open");
          var b = sib.querySelector(".faq__q");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!open) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  });

  /* ---- count-up (honest structural numbers only) ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var animateCount = function (el) {
      var end = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(end)) return;
      if (reduced) { el.textContent = String(end); return; }
      var dur = 900;
      var start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            animateCount(en.target);
            cio.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
    } else {
      Array.prototype.forEach.call(counters, animateCount);
    }
  }

  /* ---- select filled state (floating label) ---- */
  var selects = document.querySelectorAll(".field select");
  Array.prototype.forEach.call(selects, function (sel) {
    var sync = function () { sel.classList.toggle("is-filled", !!sel.value); };
    sel.addEventListener("change", sync);
    sync();
  });

  /* ---- contact form: captcha UI + mailto submit ---- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var captcha = form.querySelector("[data-captcha]");
    var captchaBox = form.querySelector("[data-captcha-box]");
    var captchaText = form.querySelector("[data-captcha-text]");
    var submitBtn = form.querySelector("[data-submit]");
    var statusEl = form.querySelector("[data-status]");
    var verified = false;
    var checking = false;

    var setSubmitEnabled = function () {
      if (submitBtn) submitBtn.disabled = !verified;
    };

    var setStatus = function (msg, ok) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.className = "form__status is-show " + (ok ? "is-ok" : "is-err");
    };

    if (captcha && captchaBox) {
      captchaBox.addEventListener("click", function () {
        if (verified || checking) return;
        checking = true;
        captcha.classList.add("is-checking");
        if (captchaText) captchaText.textContent = "Checking your browser…";
        // brief simulated check (client-side only; no external call)
        setTimeout(function () {
          checking = false;
          verified = true;
          captcha.classList.remove("is-checking");
          captcha.classList.add("is-verified");
          captchaBox.setAttribute("aria-checked", "true");
          if (captchaText) captchaText.textContent = "Verified. You can send your message.";
          setSubmitEnabled();
        }, 900);
      });
      captchaBox.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          captchaBox.click();
        }
      });
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        // honeypot
        var hp = form.querySelector("[name='_gotcha']");
        if (hp && hp.value) return; // silent drop

        if (!verified) {
          setStatus("Please complete the verification check first.", false);
          return;
        }

        var name = (form.querySelector('[name="name"]') || {}).value || "";
        var email = (form.querySelector('[name="email"]') || {}).value || "";
        var subject = (form.querySelector('[name="subject"]') || {}).value || "General enquiry";
        var message = (form.querySelector('[name="message"]') || {}).value || "";

        name = name.trim();
        email = email.trim();
        message = message.trim();

        if (!name || !email || !message) {
          setStatus("Please fill in your name, email, and message.", false);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setStatus("Please enter a valid email address.", false);
          return;
        }

        var body =
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          "Subject: " + subject + "\n\n" +
          message;

        var mailto =
          "mailto:hr@elyvaro.com" +
          "?subject=" + encodeURIComponent("[Website] " + subject) +
          "&body=" + encodeURIComponent(body);

        setStatus("Opening your email app with the message ready to send…", true);
        // open mailto
        window.location.href = mailto;

        // UI feedback after trigger
        setTimeout(function () {
          setStatus("Your email app should have opened. If nothing happened, email hr@elyvaro.com directly.", true);
        }, 600);
      });
    }

    setSubmitEnabled();
  }
})();
