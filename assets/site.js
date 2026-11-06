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

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Opening transition: the CSS animation hides the screen on its own; this tidies up afterwards
  if (document.documentElement.classList.contains("intro")) {
    window.setTimeout(function () { document.documentElement.classList.remove("intro"); }, 3800);
  }

  // Hero image drifts slightly slower than the page as you scroll
  var heroImg = document.querySelector(".hero-img");
  if (!reducedMotion && heroImg) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.transform = "translate3d(0, " + (y * 0.18).toFixed(1) + "px, 0) scale(1.04)";
        ticking = false;
      });
    }, { passive: true });
  }

  // Content eases in as it scrolls into view
  if (!reducedMotion && "IntersectionObserver" in window) {
    var revealGroups = [".section > .wrap > h2", ".lede", ".prose", ".philosophy-lead", ".principles li", ".kicker", ".about-img", ".steps li", ".why li", ".rail figure", ".features li", ".feature-groups h3", ".plan-slider", ".location .landmarks li", ".map", ".emi-card", ".form", ".contact li"];
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealGroups.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el, i) {
        if (el.closest(".hero")) return;
        el.setAttribute("data-reveal", "");
        el.style.setProperty("--d", Math.min(i % 6, 5) * 0.08 + "s");
        revealObserver.observe(el);
      });
    });
    document.documentElement.classList.add("reveal-on");
  }

  // EMI calculator
  var emiForm = document.getElementById("emi-form");
  var rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  function updateEmi() {
    var amount = Number(emiForm.amount.value), rate = Number(emiForm.rate.value), years = Number(emiForm.years.value);
    var error = document.getElementById("emi-error");
    var fields = [emiForm.amount, emiForm.rate, emiForm.years];
    var bad = fields.filter(function (f) { return !f.value || !f.checkValidity(); });
    fields.forEach(function (f) { f.setAttribute("aria-invalid", String(bad.indexOf(f) !== -1)); });
    if (bad.length) {
      error.textContent = "Enter a loan between ₹1,00,000 and ₹5,00,00,000, a rate between 1% and 20%, and a term between 1 and 30 years.";
      return;
    }
    error.textContent = "";
    var months = years * 12, monthlyRate = rate / 12 / 100;
    var growth = Math.pow(1 + monthlyRate, months);
    var monthly = amount * monthlyRate * growth / (growth - 1);
    document.getElementById("emi-monthly").textContent = rupees.format(monthly);
    document.getElementById("emi-interest").textContent = rupees.format(monthly * months - amount);
    document.getElementById("emi-total").textContent = rupees.format(monthly * months);
  }
  emiForm.querySelectorAll('input[type="range"]').forEach(function (slider) {
    var box = document.getElementById(slider.dataset.for);
    slider.addEventListener("input", function () { box.value = slider.value; updateEmi(); });
    box.addEventListener("input", function () { if (box.checkValidity()) slider.value = box.value; updateEmi(); });
  });
  emiForm.addEventListener("submit", function (e) { e.preventDefault(); });
  updateEmi();

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
    var smooth = !reducedMotion;
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
  var today = new Date();
  form.elements.date.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  var fieldErrors = {
    name: "Enter your name.",
    phone: "Enter a phone number with at least 10 digits.",
    email: "Enter a valid email address, or leave it blank.",
    date: "Choose a date from today onwards."
  };
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
      data.get("email") && "Email: " + data.get("email"),
      "Looking for: " + data.get("interest"),
      data.get("project") && data.get("project") !== "Not sure yet" && "Design or project: " + data.get("project"),
      "Meeting: " + data.get("meeting"),
      data.get("date") && "Preferred date: " + new Date(data.get("date") + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      data.get("time") && "Preferred time: " + data.get("time"),
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
      say(fieldErrors[invalid.name] || "Check the highlighted field.", true);
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
