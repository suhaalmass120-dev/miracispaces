(function () {
  var site = window.MIRACI_SITE || {};

  // Details from config.js
  document.querySelectorAll("[data-fill]").forEach(function (el) {
    var value = site[el.dataset.fill];
    if (value) el.textContent = value;
    else el.classList.add("todo");
  });

  var linkBuilders = {
    tel: function (el) { var number = site[el.dataset.fill]; return number && "tel:" + number.replace(/[^+\d]/g, ""); },
    mailto: function (el) { return site.email && "mailto:" + site.email; },
    wa: function (el) { return site.whatsapp && "https://wa.me/" + site.whatsapp; },
    maps: function (el) { return site.address && "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(site.address); },
    url: function (el) { return site[el.dataset.needs]; }
  };
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var href = linkBuilders[el.dataset.link](el);
    if (href) el.href = href;
  });
  document.querySelectorAll("[data-needs]").forEach(function (el) {
    if (!site[el.dataset.needs]) el.hidden = true;
  });

  if (site.address) {
    document.getElementById("office-map").src = "https://www.google.com/maps?q=" + encodeURIComponent(site.address) + "&output=embed";
  }

  // Hero video: still image for people who prefer less motion, a pause button for everyone else
  var heroVideo = document.querySelector(".hero-video");
  var pause = document.querySelector("[data-hero-pause]");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
  }
  heroVideo.addEventListener("error", function () { document.querySelector(".hero").classList.add("no-video"); }, true);
  pause.addEventListener("click", function () {
    var paused = !heroVideo.paused;
    if (paused) heroVideo.pause();
    else heroVideo.play();
    pause.setAttribute("aria-pressed", String(paused));
    pause.textContent = paused ? "Play video" : "Pause video";
  });

  // Header
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  function setSolid() { header.classList.toggle("is-solid", window.scrollY > 40); }
  function setMenu(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  }
  setSolid();
  window.addEventListener("scroll", setSolid, { passive: true });
  toggle.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  // Tabs
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });

  // Gallery
  var rail = document.querySelector("[data-rail]");
  function moveRail(dir) {
    var figure = rail.querySelector("figure");
    rail.scrollBy({ left: dir * (figure.offsetWidth + 16), behavior: "smooth" });
  }
  document.querySelector("[data-rail-prev]").addEventListener("click", function () { moveRail(-1); });
  document.querySelector("[data-rail-next]").addEventListener("click", function () { moveRail(1); });

  // Floor plan slider
  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var track = slider.querySelector("[data-slider-track]");
    var slides = Array.from(track.children);
    var count = slider.querySelector("[data-slider-count]");
    var prev = slider.querySelector("[data-slider-prev]");
    var next = slider.querySelector("[data-slider-next]");
    var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var current = 0;
    function offset(slide) { return slide.offsetLeft - slides[0].offsetLeft; }
    function show(i) {
      current = i;
      var heading = slides[i].querySelector("h3");
      count.textContent = i + 1 + " of " + slides.length + ": " + (slides[i].dataset.title || heading.textContent);
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    }
    function go(i) { track.scrollTo({ left: offset(slides[i]), behavior: smooth ? "smooth" : "auto" }); }
    prev.addEventListener("click", function () { go(Math.max(current - 1, 0)); });
    next.addEventListener("click", function () { go(Math.min(current + 1, slides.length - 1)); });
    track.addEventListener("scroll", function () {
      var nearest = 0;
      slides.forEach(function (slide, i) {
        if (Math.abs(offset(slide) - track.scrollLeft) < Math.abs(offset(slides[nearest]) - track.scrollLeft)) nearest = i;
      });
      if (nearest !== current) show(nearest);
    }, { passive: true });
    show(0);
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox.querySelector("img");
  document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lightboxImg.src = btn.dataset.lightbox;
      lightboxImg.alt = btn.querySelector("img").alt;
      lightbox.showModal();
    });
  });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) lightbox.close();
  });

  // Enquiry form: there is no server, so it hands over to WhatsApp or email with the details filled in.
  // It goes there in the same tab because browsers can block new windows without telling the page.
  var form = document.getElementById("enquiry-form");
  var status = document.getElementById("form-status");
  var fallback = document.getElementById("form-fallback");
  function say(text, isError) {
    status.textContent = text;
    status.classList.toggle("is-error", Boolean(isError));
    fallback.hidden = true;
  }
  function handOver(url, text, linkText) {
    say(text);
    fallback.href = url;
    fallback.textContent = linkText;
    fallback.hidden = false;
    window.location.href = url;
  }
  function buildMessage(data) {
    return [
      "New enquiry from the Miraci Spaces website",
      "Name: " + data.get("name"),
      "Phone: " + data.get("phone"),
      "Looking for: " + data.get("interest"),
      data.get("area") && "Plot or area: " + data.get("area"),
      data.get("message") && "Message: " + data.get("message")
    ].filter(Boolean).join("\n");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalid = null;
    Array.from(form.elements).forEach(function (field) {
      if (!field.willValidate) return;
      var ok = field.checkValidity();
      if (ok) field.removeAttribute("aria-invalid");
      else {
        field.setAttribute("aria-invalid", "true");
        invalid = invalid || field;
      }
    });
    if (invalid) {
      say(invalid.name === "phone" ? "Enter a phone number with at least 10 digits." : "Enter your name.", true);
      invalid.focus();
      return;
    }
    var text = buildMessage(new FormData(form));
    if (site.whatsapp) {
      handOver("https://wa.me/" + site.whatsapp + "?text=" + encodeURIComponent(text), "Opening WhatsApp. Your enquiry isn't sent until you press send there.", "WhatsApp didn't open? Tap here");
    } else if (site.email) {
      handOver("mailto:" + site.email + "?subject=" + encodeURIComponent("Website enquiry") + "&body=" + encodeURIComponent(text), "Opening your email app. Your enquiry isn't sent until you press send there.", "Email didn't open? Tap here");
    } else {
      say("Enquiries aren't connected yet. Add a WhatsApp number or email in assets/config.js.", true);
    }
  });
})();
