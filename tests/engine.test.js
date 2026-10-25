const assert = require("assert");
const E = require("../js/engine");
const D = require("../js/data");

const byId = (id) => D.teams.find((t) => t.id === id);
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("ok  " + name); };

test("poisson pmf sums to ~1", () => {
  let s = 0; for (let k = 0; k < 30; k++) s += E.poissonPmf(k, 1.7);
  assert(Math.abs(s - 1) < 1e-9);
});

test("1X2 probabilities sum to 1", () => {
  const r = E.predictMatch(byId("ARS"), byId("LIV"), D.teams);
  assert(Math.abs(r.pHome + r.pDraw + r.pAway - 1) < 1e-9);
});

test("stronger side is favoured, home advantage counts", () => {
  const r = E.predictMatch(byId("MCI"), byId("BUR"), D.teams);
  assert(r.pHome > 0.7 && r.pHome > r.pAway);
  const flip = E.predictMatch(byId("BUR"), byId("MCI"), D.teams);
  assert(flip.pAway > 0.5);
});

test("identical teams: home side slightly ahead", () => {
  const t = byId("AVL");
  const r = E.predictMatch(t, { ...t, id: "X" }, D.teams);
  assert(r.pHome > r.pAway);
});

test("top scorelines sorted descending", () => {
  const r = E.predictMatch(byId("NEW"), byId("BRE"), D.teams);
  for (let i = 1; i < r.topScorelines.length; i++) assert(r.topScorelines[i - 1].p >= r.topScorelines[i].p);
});

test("style profile separates possession and counter sides", () => {
  assert(E.styleProfile(byId("MCI")).possession > E.styleProfile(byId("BUR")).possession);
  assert(E.styleProfile(byId("BUR")).directness > E.styleProfile(byId("MCI")).directness);
});

test("player ratings bounded 0-100 with feedback", () => {
  D.players.forEach((p) => {
    const r = E.playerRating(p, D.players);
    assert(r.overall >= 0 && r.overall <= 100);
    assert(r.metrics.length > 0);
  });
});

test("every team has a manager entry", () => {
  D.teams.forEach((t) => assert(D.managers[t.manager], t.id));
});

console.log(`\n${n} tests passed`);
