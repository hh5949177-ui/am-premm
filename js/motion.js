/* Motion primitives */
import Lenis from "https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.mjs";
import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

/* Lenis scroll */
export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}

/* card enter/exit */
export function enterCard(el) {
  if (!el) return;
  el.hidden = false;
  gsap.fromTo(
    el,
    { opacity: 0, y: 24, filter: "blur(6px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "expo.out" }
  );
  gsap.fromTo(
    el.querySelectorAll(".card-eyebrow, .card-title, .card-sub, .form, .premium-card, .premium-actions"),
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, delay: 0.15 }
  );
}

export function exitCard(el) {
  return new Promise((resolve) => {
    if (!el || el.hidden) return resolve();
    gsap.to(el, {
      opacity: 0, y: -18, filter: "blur(6px)",
      duration: 0.5, ease: "power2.in",
      onComplete: () => { el.hidden = true; gsap.set(el, { clearProps: "all" }); resolve(); },
    });
  });
}

/* stepper highlight */
export function setStep(n) {
  document.querySelectorAll(".step").forEach((el) => {
    const idx = Number(el.dataset.step);
    el.removeAttribute("data-state");
    if (idx < n) el.dataset.state = "done";
    else if (idx === n) el.dataset.state = "active";
  });
}

/* magnetic spark */
export function initMagneticButtons() {
  document.querySelectorAll("[data-cursor='magnetic']").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/* cursor dot */
export function initCursor() {
  const dot = document.querySelector(".cursor-dot");
  if (!dot) return;
  const s = { x: innerWidth / 2, y: innerHeight / 2, tx: 0, ty: 0 };
  const loop = () => {
    s.x += (s.tx - s.x) * 0.22;
    s.y += (s.ty - s.y) * 0.22;
    dot.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  addEventListener("pointermove", (e) => { s.tx = e.clientX; s.ty = e.clientY; dot.style.opacity = "1"; });
  addEventListener("pointerleave", () => (dot.style.opacity = "0"));
  document.querySelectorAll("a, button, input, textarea").forEach((el) => {
    el.addEventListener("pointerenter", () => { dot.style.width = "20px"; dot.style.height = "20px"; });
    el.addEventListener("pointerleave", () => { dot.style.width = "8px"; dot.style.height = "8px"; });
  });
}

/* process step indicator */
export function markProc(name, state) {
  const row = document.querySelector(`.proc-row[data-proc="${name}"]`);
  if (row) row.dataset.state = state;
}
export function resetProc() {
  document.querySelectorAll(".proc-row").forEach((r) => r.removeAttribute("data-state"));
}

/* premium entrance */
export function celebratePremium(el) {
  if (!el) return;
  animate(el, { opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.6, easing: [0.22, 1, 0.36, 1] });
  animate(
    el.querySelectorAll(".pc-row"),
    { opacity: [0, 1], x: [-10, 0] },
    { delay: stagger(0.06, { start: 0.3 }), duration: 0.5, easing: [0.22, 1, 0.36, 1] }
  );
  const badge = el.querySelector(".premium-badge");
  if (badge) {
    gsap.fromTo(badge, { scale: 0.4, rotate: -20, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1, ease: "elastic.out(1, 0.6)", delay: 0.15 });
  }
}

export function boot() {
  initSmoothScroll();
  initMagneticButtons();
  initCursor();
}