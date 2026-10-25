(function () {
  const D = window.FOOTY_DATA, E = window.FootyEngine;
  const $ = (id) => document.getElementById(id);
  const teamById = (id) => D.teams.find((t) => t.id === id);
  const pct = (x) => Math.round(x * 100);
  const el = (tag, attrs, html) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.removeAttribute("aria-current"));
    b.setAttribute("aria-current", "page");
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + b.dataset.view));
  }));

  /* ---------- Match predictor ---------- */
  const homeSel = $("homeSel"), awaySel = $("awaySel");
  D.teams.forEach((t) => { homeSel.add(new Option(t.name, t.id)); awaySel.add(new Option(t.name, t.id)); });
  homeSel.value = "ARS"; awaySel.value = "LIV";

  function drawPitch(home, away) {
    const svg = $("pitch");
    const W = 1050, H = 680, M = 30, pw = W - 2 * M, ph = H - 2 * M;
    const hs = E.styleProfile(home), as = E.styleProfile(away);
    let s = `<g fill="none" stroke="#fbfdf6" stroke-width="3" opacity=".95">
      <rect x="${M}" y="${M}" width="${pw}" height="${ph}"/>
      <line x1="${W / 2}" y1="${M}" x2="${W / 2}" y2="${H - M}"/>
      <circle cx="${W / 2}" cy="${H / 2}" r="90"/>
      <rect x="${M}" y="${H / 2 - 165}" width="165" height="330"/><rect x="${M}" y="${H / 2 - 75}" width="55" height="150"/>
      <rect x="${W - M - 165}" y="${H / 2 - 165}" width="165" height="330"/><rect x="${W - M - 55}" y="${H / 2 - 75}" width="55" height="150"/>
    </g>`;
    // x for a team's defensive line: home defends left goal, away defends right goal.
    const lineX = (line, isHome) => { const f = 0.12 + (line / 100) * 0.38; return isHome ? M + pw * f : W - M - pw * f; };
    function side(style, isHome, color, t) {
      const lx = lineX(t.line, isHome);
      const reach = 40 + (style.pressing / 100) * 260; // press reaches into the opponent half
      const x0 = isHome ? lx : lx - reach, w = reach;
      const bandH = 22 + (style.width / 100) * 80; // flank band thickness
      const bx = isHome ? M : W / 2, bw = pw / 2;
      return `<rect x="${x0}" y="${M}" width="${w}" height="${ph}" fill="${color}" opacity=".22"/>
        <rect x="${bx}" y="${M}" width="${bw}" height="${bandH}" fill="${color}" opacity=".3"/>
        <rect x="${bx}" y="${H - M - bandH}" width="${bw}" height="${bandH}" fill="${color}" opacity=".3"/>
        <line x1="${lx}" y1="${M}" x2="${lx}" y2="${H - M}" stroke="${color}" stroke-width="5" stroke-dasharray="14 10"/>
        <text x="${isHome ? M + 14 : W - M - 14}" y="${H / 2 + 10}" text-anchor="${isHome ? "start" : "end"}" font-size="44" font-weight="900" fill="#fbfdf6" font-family="Archivo, sans-serif" opacity=".9">${esc(t.id)}</text>`;
    }
    s += side(hs, true, "#1f5d8c", home) + side(as, false, "#b4572a", away);
    svg.innerHTML = s;
  }

  function renderMatch() {
    const home = teamById(homeSel.value), away = teamById(awaySel.value);
    if (home.id === away.id) {
      $("insights").innerHTML = "<li>Pick two different teams to see a prediction.</li>";
      return;
    }
    const r = E.predictMatch(home, away, D.teams);
    $("homeName").textContent = home.name; $("awayName").textContent = away.name;
    $("homeXg").textContent = r.xg.home.toFixed(2); $("awayXg").textContent = r.xg.away.toFixed(2);
    const top = r.topScorelines[0];
    $("likelyScore").textContent = `${top.home}–${top.away}`;
    $("odds").innerHTML = `<div class="h" style="flex:${r.pHome}">${pct(r.pHome)}%</div><div class="d" style="flex:${r.pDraw}">${pct(r.pDraw)}%</div><div class="a" style="flex:${r.pAway}">${pct(r.pAway)}%</div>`;
    $("extraOdds").textContent = `${home.name} win, draw, ${away.name} win. Over 2.5 goals ${pct(r.over25)}%. Both score ${pct(r.btts)}%.`;
    const max = r.topScorelines[0].p;
    $("scorelines").innerHTML = r.topScorelines.map((s) => `<li><b>${s.home}–${s.away}</b><span class="bar" style="width:${(s.p / max) * 100}%"></span><span>${(s.p * 100).toFixed(1)}%</span></li>`).join("");
    $("insights").innerHTML = E.matchupInsights(home, away).map((t) => `<li>${esc(t)}</li>`).join("");
    drawPitch(home, away);
  }
  homeSel.addEventListener("change", renderMatch);
  awaySel.addEventListener("change", renderMatch);
  $("swapBtn").addEventListener("click", () => { const h = homeSel.value; homeSel.value = awaySel.value; awaySel.value = h; renderMatch(); });

  /* ---------- Teams ---------- */
  const cols = [
    ["name", "Team"], ["xg", "xG"], ["xga", "xGA"], ["shots", "Shots"], ["sot", "On target"],
    ["passes", "Passes"], ["possession", "Poss %"], ["tackles", "Tackles"], ["saves", "Saves"]
  ];
  let sortKey = "xg", sortDir = -1, selectedTeam = null;
  function renderTeams() {
    const rows = [...D.teams].sort((a, b) => (typeof a[sortKey] === "string" ? a[sortKey].localeCompare(b[sortKey]) : a[sortKey] - b[sortKey]) * sortDir);
    const thead = `<thead><tr>${cols.map(([k, l]) => `<th scope="col"><button data-k="${k}">${l}${sortKey === k ? (sortDir < 0 ? " ▼" : " ▲") : ""}</button></th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map((t) => `<tr tabindex="0" data-id="${t.id}" aria-selected="${t.id === selectedTeam}">${cols.map(([k]) => `<td>${k === "name" ? esc(t.name) : (k === "passes" || k === "possession" ? t[k] : t[k].toFixed(k === "xg" || k === "xga" ? 2 : 1))}</td>`).join("")}</tr>`).join("")}</tbody>`;
    $("teamTable").innerHTML = thead + tbody;
    $("teamTable").querySelectorAll("th button").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.k; sortDir = sortKey === k ? -sortDir : -1; sortKey = k; renderTeams(); }));
    $("teamTable").querySelectorAll("tbody tr").forEach((tr) => {
      const open = () => { selectedTeam = tr.dataset.id; renderTeams(); renderTeamDetail(); };
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }
  const meter = (label, v, cls) => `<div class="meter"><span>${label}</span><span class="track"><span class="fill ${cls || ""}" style="width:${v}%"></span></span><span>${Math.round(v)}</span></div>`;
  function renderTeamDetail() {
    const t = teamById(selectedTeam); if (!t) return;
    const st = E.styleProfile(t), fb = E.teamFeedback(t, D.teams), m = D.managers[t.manager];
    $("teamDetail").innerHTML = `<div class="card"><h3>${esc(t.name)}</h3><p class="label">${esc(st.label)}. Manager: ${esc(m.name)}.</p>
      ${meter("Possession", st.possession)}${meter("Pressing", st.pressing)}${meter("Directness", st.directness)}${meter("Width", st.width)}${meter("Defensive line", st.line)}
      <ul>${fb.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`;
  }

  /* ---------- Players ---------- */
  let posFilter = "ALL";
  const POS_NAMES = { ALL: "All", FW: "Forwards", MF: "Midfielders", DF: "Defenders", GK: "Goalkeepers" };
  function renderPlayers() {
    $("posFilters").innerHTML = Object.entries(POS_NAMES).map(([k, l]) => `<button data-p="${k}" aria-pressed="${k === posFilter}">${l}</button>`).join("");
    $("posFilters").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { posFilter = b.dataset.p; renderPlayers(); }));
    const list = D.players.filter((p) => posFilter === "ALL" || p.pos === posFilter)
      .map((p) => ({ p, r: E.playerRating(p, D.players) })).sort((a, b) => b.r.overall - a.r.overall);
    $("playerList").innerHTML = list.map(({ p, r }) => `<div class="card"><span class="ovr" title="Average percentile among ${r.peerCount} ${p.pos} players">${r.overall}</span>
      <h3>${esc(p.name)}</h3><p class="label">${esc(teamById(p.team).name)} · ${p.pos} · ${p.mins} min</p>
      ${r.metrics.map((m) => meter(m.label, m.pct, m.pct >= 75 ? "good" : m.pct <= 35 ? "weak" : "")).join("")}
      <ul>${r.feedback.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`).join("");
  }

  /* ---------- Managers ---------- */
  function renderManagers() {
    const TL = { buildUp: "Build-up", pressing: "Pressing", transitions: "Transitions", setPieces: "Set pieces", rotation: "Rotation" };
    $("managerList").innerHTML = D.teams.map((t) => {
      const m = D.managers[t.manager];
      return `<div class="card"><h3>${esc(m.name)}</h3><p class="label">${esc(t.name)} · ${esc(m.formation)}</p><p>${esc(m.philosophy)}</p>
        ${Object.entries(m.tendencies).map(([k, v]) => meter(TL[k], v * 10)).join("")}</div>`;
    }).join("");
  }

  renderMatch(); renderTeams(); renderPlayers(); renderManagers();
})();
