/* Motion Engine — wizard flow */
import {
  boot, enterCard, exitCard, setStep, markProc, resetProc, celebratePremium,
} from "./motion.js";

boot();

/* ---------- state ---------- */
const state = { email: "" };

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const stages = { 1: $("#stage-1"), 2: $("#stage-2"), 3: $("#stage-3"), 4: $("#stage-4") };

async function goTo(n) {
  const current = document.querySelector(".card:not([hidden])");
  if (current && current !== stages[n]) await exitCard(current);
  setStep(n);
  enterCard(stages[n]);
}

function setError(stageN, message) {
  const el = document.querySelector(`.stage-error[data-for="${stageN}"]`);
  if (!el) return;
  if (!message) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.textContent = message;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/* ---------- step 1: email ---------- */
$("#form-email").addEventListener("submit", async (e) => {
  e.preventDefault();
  setError(1, "");
  const btn = e.target.querySelector("button");
  const email = e.target.email.value.trim();
  if (!email) return;

  btn.disabled = true;
  btn.querySelector(".btn-text").textContent = "Mengirim…";

  try {
    const { res, data } = await postJson("/api/send", { email });
    if (!res.ok) {
      setError(1, data?.error || data?.message || `HTTP ${res.status}`);
      return;
    }
    state.email = email.toLowerCase();
    $("#email-echo").textContent = state.email;
    await goTo(2);
  } catch (err) {
    setError(1, err.message || "Network failure");
  } finally {
    btn.disabled = false;
    btn.querySelector(".btn-text").textContent = "Kirim magic link";
  }
});

/* ---------- step 2: paste link ---------- */
$("#form-link").addEventListener("submit", async (e) => {
  e.preventDefault();
  setError(2, "");
  const magicLink = e.target.magicLink.value.trim();
  if (!magicLink) return;

  await goTo(3);
  resetProc();
  markProc("auth", "run");
  $("#proc-label").textContent = "Memverifikasi magic link";

  try {
    const { res, data } = await postJson("/api/verif", {
      email: state.email,
      magicLink,
    });

    if (!res.ok) {
      markProc("auth", "done");
      markProc("activate", "run");
      await new Promise((r) => setTimeout(r, 320));
      await goTo(2);
      setError(2, data?.error || data?.message || "Verifikasi gagal. Cek ulang magic link.");
      return;
    }

    markProc("auth", "done");
    markProc("activate", "run");
    $("#proc-label").textContent = "Menghubungi AM purchase verifier";
    await new Promise((r) => setTimeout(r, 380));

    const account = data?.data?.account;
    if (!account || account.status !== "ACTIVE") {
      markProc("activate", "done");
      await new Promise((r) => setTimeout(r, 260));
      await goTo(2);
      setError(2, data?.message || "Login berhasil, tapi aktivasi Pro ditolak.");
      return;
    }

    markProc("activate", "done");
    markProc("issue", "run");
    $("#proc-label").textContent = "Menyiapkan membership";
    await new Promise((r) => setTimeout(r, 420));
    markProc("issue", "done");
    await new Promise((r) => setTimeout(r, 320));

    fillPremium(account, data);
    await goTo(4);
    celebratePremium(stages[4]);
  } catch (err) {
    await goTo(2);
    setError(2, err.message || "Network failure");
  }
});

/* ---------- step 2: back ---------- */
$("#btn-back").addEventListener("click", () => {
  setError(2, "");
  goTo(1);
});

/* ---------- step 4: restart ---------- */
$("#btn-restart").addEventListener("click", async () => {
  state.email = "";
  $("#form-email").reset();
  $("#form-link").reset();
  await goTo(1);
});

/* ---------- fill premium screen ---------- */
function fillPremium(account, raw) {
  $("#ok-email").textContent = account.email ?? "—";
  $("#ok-uid").textContent = account.uid ?? "—";
  $("#ok-order").textContent = account.orderId ?? "—";
  $("#ok-activated").textContent = account.activatedAt
    ? new Date(account.activatedAt).toLocaleString()
    : "—";
  $("#ok-valid").textContent = account.validUntil
    ? new Date(account.validUntil).toLocaleDateString(undefined, {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";
  $("#ok-raw").textContent = JSON.stringify(raw, null, 2);
}

/* ---------- health probe ---------- */
(async () => {
  const chip = $("#status-chip");
  const label = $("#health-label");
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      chip.dataset.state = "up";
      label.textContent = "online";
    } else {
      chip.dataset.state = "down";
      label.textContent = `http ${res.status}`;
    }
  } catch {
    chip.dataset.state = "down";
    label.textContent = "offline";
  }
  const rt = $("#foot-runtime");
  if (rt) rt.textContent = `${new Date().getFullYear()} · ${navigator.platform || "web"}`;
})();

/* ---------- initial state ---------- */
setStep(1);