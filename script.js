(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 820) setMenu(false); });

  /* ---------- Название в первом экране: половинки расходятся за курсором ---------- */
  var hero = document.getElementById("home");
  var cut = hero.querySelector(".cut");
  if (finePointer && !reduce) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      cut.style.setProperty("--sx", (x * 2.4).toFixed(2) + "vw");
    });
    hero.addEventListener("mouseleave", function () { cut.style.setProperty("--sx", "0vw"); });
  }

  /* ---------- Лента фото: вторая копия для бесконечной прокрутки ---------- */
  var reelTrack = document.querySelector(".reel__track");
  if (reelTrack && !reduce) reelTrack.appendChild(reelTrack.firstElementChild.cloneNode(true));

  /* ---------- Параллакс фото в разделе «О нас» ---------- */
  var floaters = document.querySelectorAll("[data-speed]");
  function parallax() {
    var vh = window.innerHeight;
    floaters.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      var mid = r.top + r.height / 2 - vh / 2;
      el.style.transform = "translate3d(0," + (mid * Number(el.dataset.speed)).toFixed(1) + "px,0)";
    });
  }

  /* ---------- Калькулятор в прайсе ---------- */
  var calcList = document.getElementById("calcList");
  var priceEl = document.getElementById("calcPrice");
  var timeEl = document.getElementById("calcTime");
  var shownPrice = 0;

  function formatTime(min) {
    if (!min) return "0 мин";
    var h = Math.floor(min / 60);
    var m = min % 60;
    return (h ? h + " ч" : "") + (h && m ? " " : "") + (m ? m + " мин" : "");
  }
  function showPrice(v) { priceEl.textContent = v.toLocaleString("ru-RU") + " ₽"; }
  function animatePrice(to) {
    var from = shownPrice;
    shownPrice = to;
    if (reduce) { showPrice(to); return; }
    var start = performance.now();
    (function step(now) {
      var t = Math.min((now - start) / 450, 1);
      showPrice(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  // блокирует услуги, которые не сочетаются с выбранными (например, «Стрижка» и «Стрижка и борода»)
  function applyConflicts(inputs, idOf, conflictsOf) {
    inputs.forEach(function (i) { i.disabled = false; });
    inputs.forEach(function (i) {
      if (!i.checked) return;
      conflictsOf(i).forEach(function (id) {
        inputs.forEach(function (o) { if (idOf(o) === id) { o.disabled = true; o.checked = false; } });
      });
    });
  }

  var calcInputs = Array.prototype.slice.call(calcList.querySelectorAll("input"));
  calcList.addEventListener("change", function () {
    applyConflicts(calcInputs, function (i) { return i.dataset.id; }, function (i) { return (i.dataset.conflicts || "").split(" "); });
    var price = 0, time = 0;
    calcInputs.forEach(function (i) {
      if (!i.checked) return;
      price += Number(i.dataset.price);
      time += Number(i.dataset.time);
    });
    animatePrice(price);
    timeEl.textContent = formatTime(time);
  });

  /* ---------- Ритуал: горизонтальная прокрутка, закреплённая на экране ---------- */
  var ritual = document.getElementById("ritual");
  var track = document.getElementById("ritualTrack");
  var pinMq = window.matchMedia("(min-width: 900px) and (min-height: 600px)");
  var pinned = false, travel = 0;

  function setupRitual() {
    pinned = pinMq.matches && !reduce;
    ritual.classList.toggle("is-pinned", pinned);
    track.style.transform = "";
    if (!pinned) { ritual.style.height = ""; return; }
    travel = Math.max(track.scrollWidth - window.innerWidth, 0);
    ritual.style.height = (window.innerHeight + travel) + "px";
    moveRitual();
  }
  function moveRitual() {
    if (!pinned) return;
    var r = ritual.getBoundingClientRect();
    var p = Math.min(Math.max(-r.top / (r.height - window.innerHeight || 1), 0), 1);
    track.style.transform = "translate3d(" + (-travel * p).toFixed(1) + "px,0,0)";
  }

  /* ---------- Прокрутка: один обработчик на кадр ---------- */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (!reduce) parallax();
      moveRitual();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener("resize", setupRitual);
  window.addEventListener("load", setupRitual);
  setupRitual();
  if (!reduce) parallax();

  /* ---------- Отзывы ---------- */
  var quotes = document.querySelectorAll(".quote");
  var count = document.getElementById("count");
  var current = 0;
  function showQuote(n) {
    current = (n + quotes.length) % quotes.length;
    quotes.forEach(function (q, i) { q.classList.toggle("is-active", i === current); });
    count.textContent = (current + 1) + " / " + quotes.length;
  }
  document.getElementById("prev").addEventListener("click", function () { showQuote(current - 1); });
  document.getElementById("next").addEventListener("click", function () { showQuote(current + 1); });

  /* ---------- Работы: просмотр крупно ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
  var lbIndex = 0;
  function openTile(i) {
    lbIndex = (i + tiles.length) % tiles.length;
    var img = tiles[lbIndex].querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    if (!lb.open) lb.showModal();
  }
  tiles.forEach(function (t, i) { t.addEventListener("click", function () { openTile(i); }); });
  document.getElementById("lbClose").addEventListener("click", function () { lb.close(); });
  document.getElementById("lbPrev").addEventListener("click", function () { openTile(lbIndex - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { openTile(lbIndex + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") openTile(lbIndex - 1);
    if (e.key === "ArrowRight") openTile(lbIndex + 1);
  });

  /* ---------- Форма записи (демо: заявка никуда не отправляется) ---------- */
  var form = document.getElementById("bookingForm");
  var note = document.getElementById("formNote");
  var formServices = Array.prototype.slice.call(form.querySelectorAll('input[name="service"]'));
  var formConflicts = { cut: ["combo"], combo: ["cut", "beard"], beard: ["combo"], edge: [] };

  function syncFormConflicts() {
    applyConflicts(formServices, function (i) { return i.value; }, function (i) { return formConflicts[i.value]; });
  }
  form.addEventListener("change", function (e) { if (e.target.name === "service") syncFormConflicts(); });
  syncFormConflicts();

  // кнопка «Записаться» в прайсе переносит выбранные услуги в форму
  document.getElementById("calcBook").addEventListener("click", function () {
    var chosen = calcInputs.filter(function (i) { return i.checked; }).map(function (i) { return i.dataset.id; });
    if (!chosen.length) return;
    formServices.forEach(function (i) { i.checked = chosen.indexOf(i.value) !== -1; });
    syncFormConflicts();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name;
    var phone = form.elements.phone;
    var ok = true;
    [name, phone].forEach(function (input) {
      var empty = input.value.trim() === "";
      input.classList.toggle("is-error", empty);
      if (empty) ok = false;
    });
    if (!formServices.some(function (i) { return i.checked; })) {
      note.textContent = "Выберите хотя бы одну услугу.";
      return;
    }
    if (!ok) { note.textContent = "Заполните имя и телефон."; return; }
    note.textContent = "Заявка отправлена, " + name.value.trim() + ". Перезвоним в течение 15 минут.";
    form.reset();
    syncFormConflicts();
  });
})();
