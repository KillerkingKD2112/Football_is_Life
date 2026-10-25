/* Analytics engine: match prediction, style profiling, player ratings and feedback.
   Pure functions, no DOM, so it runs in the browser and in Node tests. */
(function (root) {
  const HOME_ADVANTAGE = 1.12;
  const MAX_GOALS = 8;

  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  function poissonPmf(k, lambda) {
    let p = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) p *= lambda / i;
    return p;
  }

  function leagueAverages(teams) {
    return { xg: mean(teams.map((t) => t.xg)), xga: mean(teams.map((t) => t.xga)) };
  }

  /* Expected goals: attack strength x opponent defence weakness x league average. */
  function expectedGoals(home, away, teams) {
    const avg = leagueAverages(teams);
    const lh = (home.xg / avg.xg) * (away.xga / avg.xga) * avg.xg * HOME_ADVANTAGE;
    const la = (away.xg / avg.xg) * (home.xga / avg.xga) * avg.xg / HOME_ADVANTAGE;
    return { home: lh, away: la };
  }

  function predictMatch(home, away, teams) {
    const xg = expectedGoals(home, away, teams);
    const grid = [];
    let pHome = 0, pDraw = 0, pAway = 0, total = 0;
    for (let h = 0; h <= MAX_GOALS; h++) {
      grid[h] = [];
      for (let a = 0; a <= MAX_GOALS; a++) {
        const p = poissonPmf(h, xg.home) * poissonPmf(a, xg.away);
        grid[h][a] = p;
        total += p;
      }
    }
    const scorelines = [];
    for (let h = 0; h <= MAX_GOALS; h++) {
      for (let a = 0; a <= MAX_GOALS; a++) {
        grid[h][a] /= total; // renormalise the truncated tail
        const p = grid[h][a];
        if (h > a) pHome += p; else if (h === a) pDraw += p; else pAway += p;
        scorelines.push({ home: h, away: a, p });
      }
    }
    scorelines.sort((x, y) => y.p - x.p);
    let over25 = 0, btts = 0;
    for (let h = 0; h <= MAX_GOALS; h++) for (let a = 0; a <= MAX_GOALS; a++) {
      if (h + a > 2) over25 += grid[h][a];
      if (h > 0 && a > 0) btts += grid[h][a];
    }
    return { xg, pHome, pDraw, pAway, over25, btts, topScorelines: scorelines.slice(0, 5), grid };
  }

  /* Style profile: scores 0-100 on four axes plus a plain-language label. */
  function styleProfile(t) {
    const possession = clamp(((t.possession - 38) / 28) * 100, 0, 100);
    const pressing = clamp(((15 - t.ppda) / 8) * 100, 0, 100);
    const directness = clamp(t.directness * 100 / 0.6, 0, 100);
    const width = clamp(((t.width - 0.35) / 0.25) * 100, 0, 100);
    const line = clamp(((t.line - 40) / 36) * 100, 0, 100);
    let label;
    if (possession >= 65 && pressing >= 55) label = "Dominant possession with a high press";
    else if (possession >= 65) label = "Patient possession";
    else if (pressing >= 60 && directness >= 45) label = "Aggressive press and direct play";
    else if (directness >= 65 && possession < 40) label = "Direct, counter-attacking";
    else if (line < 35) label = "Low block, quick outlets";
    else label = "Balanced, mid-block";
    return { possession, pressing, directness, width, line, label };
  }

  /* Plain-language feedback on a team from its numbers versus the league. */
  function teamFeedback(t, teams) {
    const avg = leagueAverages(teams);
    const notes = [];
    const diff = t.xg - t.xga;
    notes.push(diff > 0.6 ? "Creates far more chance quality than it allows." : diff > 0.1 ? "Slightly ahead on chance quality." : diff > -0.3 ? "Chance quality is close to even; results can swing." : "Concedes better chances than it creates.");
    const conv = t.shots > 0 ? t.xg / t.shots : 0;
    if (conv < 0.1) notes.push("Shot quality is low: many efforts come from distance or tight angles.");
    else if (conv > 0.125) notes.push("Shot selection is strong: high xG per shot.");
    if (t.xga > avg.xga * 1.15) notes.push("Defence is the weakest area; the high xG against is the first thing to fix.");
    if (t.sot / t.shots < 0.33) notes.push("Too few shots hit the target; finishing technique or shot choice needs work.");
    return notes;
  }

  /* Role-aware player ratings as percentiles against peers in the same position. */
  const ROLE_METRICS = {
    FW: ["goals", "xg", "shots", "keyPasses", "dribbles"],
    MF: ["keyPasses", "passPct", "tackles", "dribbles", "xg"],
    DF: ["tackles", "passPct", "keyPasses", "dribbles"],
    GK: ["saves", "savePct", "passPct"]
  };
  const METRIC_LABEL = { goals: "Goals", xg: "xG", shots: "Shots", keyPasses: "Key passes", dribbles: "Dribbles", passPct: "Pass accuracy", tackles: "Tackles", saves: "Saves", savePct: "Save %" };

  function percentile(value, all) {
    if (all.length < 2) return 50;
    const below = all.filter((v) => v < value).length;
    const equal = all.filter((v) => v === value).length;
    return Math.round(((below + 0.5 * equal) / all.length) * 100);
  }

  function playerRating(p, players) {
    const peers = players.filter((q) => q.pos === p.pos);
    const metrics = ROLE_METRICS[p.pos].map((m) => ({
      key: m, label: METRIC_LABEL[m], value: p[m] || 0,
      pct: percentile(p[m] || 0, peers.map((q) => q[m] || 0))
    }));
    const overall = Math.round(mean(metrics.map((m) => m.pct)));
    const strengths = metrics.filter((m) => m.pct >= 75).map((m) => m.label);
    const weaknesses = metrics.filter((m) => m.pct <= 35).map((m) => m.label);
    const feedback = [];
    if (p.pos !== "GK" && p.xg > 0) {
      const delta = p.goals - p.xg;
      if (delta > 0.12) feedback.push("Scoring above expected; some of this usually fades over a longer sample.");
      else if (delta < -0.1) feedback.push("Scoring below expected; chances are there, finishing should recover.");
      else feedback.push("Output matches the quality of chances taken.");
    }
    if (strengths.length) feedback.push("Strongest in: " + strengths.join(", ") + ".");
    if (weaknesses.length) feedback.push("Room to improve: " + weaknesses.join(", ") + ".");
    return { overall, metrics, strengths, weaknesses, feedback, peerCount: peers.length };
  }

  /* Head to head style clash: where does each side's strength meet the other's weakness. */
  function matchupInsights(home, away) {
    const hs = styleProfile(home), as = styleProfile(away);
    const out = [];
    if (hs.pressing > 60 && as.possession > 60) out.push(`${home.name}'s press meets ${away.name}'s build-up: whoever wins the first pass decides the shape of the game.`);
    else if (as.pressing > 60 && hs.possession > 60) out.push(`${away.name}'s press meets ${home.name}'s build-up: whoever wins the first pass decides the shape of the game.`);
    if (hs.line > 65 && as.directness > 55) out.push(`${home.name}'s high line is exposed by ${away.name}'s long balls in behind.`);
    if (as.line > 65 && hs.directness > 55) out.push(`${away.name}'s high line is exposed by ${home.name}'s long balls in behind.`);
    if (!out.length) out.push("No sharp style clash; expect the stronger chance creator to edge it.");
    return out;
  }

  const api = { poissonPmf, expectedGoals, predictMatch, styleProfile, teamFeedback, playerRating, matchupInsights, leagueAverages, ROLE_METRICS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FootyEngine = api;
})(typeof self !== "undefined" ? self : this);
