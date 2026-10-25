/* SAMPLE DATA — placeholder numbers for building and testing the site.
   Replace with a real feed (see README, "Plugging in real data").
   Team stats are per-90 averages. Style inputs: possession %, ppda (opponent passes per
   defensive action; lower = more pressing), directness (share of progression via long balls, 0-1),
   width (share of attacks down the flanks, 0-1), line (average defensive line height, 0-100). */
(function (root) {
  const teams = [
    { id: "ARS", name: "Arsenal",       xg: 1.95, xga: 0.92, shots: 15.1, sot: 5.6, passes: 598, possession: 59, ppda: 8.9,  directness: 0.28, width: 0.46, line: 68, tackles: 16.2, saves: 2.4, manager: "arteta" },
    { id: "MCI", name: "Man City",      xg: 2.20, xga: 0.95, shots: 16.8, sot: 6.2, passes: 668, possession: 64, ppda: 8.2,  directness: 0.22, width: 0.40, line: 72, tackles: 14.8, saves: 2.2, manager: "guardiola" },
    { id: "LIV", name: "Liverpool",     xg: 2.05, xga: 1.05, shots: 16.0, sot: 5.9, passes: 572, possession: 57, ppda: 9.4,  directness: 0.34, width: 0.50, line: 70, tackles: 17.1, saves: 2.7, manager: "slot" },
    { id: "NEW", name: "Newcastle",     xg: 1.70, xga: 1.20, shots: 14.2, sot: 5.0, passes: 470, possession: 52, ppda: 10.1, directness: 0.41, width: 0.52, line: 60, tackles: 18.0, saves: 3.1, manager: "howe" },
    { id: "AVL", name: "Aston Villa",   xg: 1.60, xga: 1.30, shots: 13.4, sot: 4.7, passes: 482, possession: 51, ppda: 11.0, directness: 0.37, width: 0.44, line: 58, tackles: 17.4, saves: 3.0, manager: "emery" },
    { id: "BHA", name: "Brighton",      xg: 1.55, xga: 1.40, shots: 13.8, sot: 4.5, passes: 545, possession: 56, ppda: 10.6, directness: 0.30, width: 0.42, line: 63, tackles: 16.0, saves: 3.3, manager: "hurzeler" },
    { id: "BRE", name: "Brentford",     xg: 1.45, xga: 1.50, shots: 12.5, sot: 4.3, passes: 398, possession: 45, ppda: 12.4, directness: 0.52, width: 0.55, line: 52, tackles: 17.9, saves: 3.4, manager: "andrews" },
    { id: "BUR", name: "Burnley",       xg: 0.95, xga: 1.85, shots: 9.8,  sot: 3.0, passes: 350, possession: 41, ppda: 13.8, directness: 0.58, width: 0.48, line: 44, tackles: 18.6, saves: 4.1, manager: "parker" }
  ];

  const managers = {
    arteta:    { name: "Mikel Arteta",     formation: "4-3-3 (builds 3-2-5)", philosophy: "Positional play with aggressive counter-press and set-piece detail.", tendencies: { buildUp: 8, pressing: 8, transitions: 6, setPieces: 9, rotation: 5 } },
    guardiola: { name: "Pep Guardiola",    formation: "3-2-4-1 in possession", philosophy: "Control through the ball; overloads in the half-spaces.",               tendencies: { buildUp: 10, pressing: 8, transitions: 5, setPieces: 6, rotation: 8 } },
    slot:      { name: "Arne Slot",        formation: "4-2-3-1", philosophy: "Structured control with fast vertical switches once the press is beaten.",     tendencies: { buildUp: 7, pressing: 7, transitions: 8, setPieces: 6, rotation: 6 } },
    howe:      { name: "Eddie Howe",       formation: "4-3-3", philosophy: "High intensity, physical duels, quick wide play.",                                tendencies: { buildUp: 5, pressing: 8, transitions: 8, setPieces: 7, rotation: 5 } },
    emery:     { name: "Unai Emery",       formation: "4-4-2 / 4-2-2-2", philosophy: "Compact mid-block, high line, offside trap, direct runners.",              tendencies: { buildUp: 6, pressing: 6, transitions: 8, setPieces: 8, rotation: 4 } },
    hurzeler:  { name: "Fabian Hürzeler",  formation: "4-2-3-1", philosophy: "Short build-up, man-oriented press.",                                          tendencies: { buildUp: 8, pressing: 8, transitions: 6, setPieces: 5, rotation: 7 } },
    andrews:   { name: "Keith Andrews",    formation: "3-5-2", philosophy: "Direct, wide, set-piece heavy with a robust out-of-possession shape.",            tendencies: { buildUp: 4, pressing: 6, transitions: 7, setPieces: 9, rotation: 4 } },
    parker:    { name: "Scott Parker",     formation: "4-4-2", philosophy: "Low block, compact lines, quick outlets.",                                       tendencies: { buildUp: 5, pressing: 4, transitions: 7, setPieces: 6, rotation: 4 } }
  };

  /* Players: per-90 stats. position: FW, MF, DF, GK */
  const players = [
    { id: "p1",  name: "Striker A",  team: "MCI", pos: "FW", mins: 2400, goals: 0.92, xg: 0.78, shots: 3.9, keyPasses: 0.8, passPct: 78, tackles: 0.5, dribbles: 1.2 },
    { id: "p2",  name: "Winger A",   team: "LIV", pos: "FW", mins: 2300, goals: 0.55, xg: 0.52, shots: 3.2, keyPasses: 1.9, passPct: 79, tackles: 1.0, dribbles: 3.4 },
    { id: "p3",  name: "Winger B",   team: "ARS", pos: "FW", mins: 2200, goals: 0.38, xg: 0.40, shots: 2.8, keyPasses: 2.2, passPct: 81, tackles: 1.4, dribbles: 3.0 },
    { id: "p4",  name: "Forward B",  team: "NEW", pos: "FW", mins: 2100, goals: 0.60, xg: 0.62, shots: 3.5, keyPasses: 0.9, passPct: 74, tackles: 0.7, dribbles: 1.0 },
    { id: "p5",  name: "Playmaker A", team: "MCI", pos: "MF", mins: 2500, goals: 0.22, xg: 0.20, shots: 2.1, keyPasses: 2.8, passPct: 90, tackles: 1.6, dribbles: 1.8 },
    { id: "p6",  name: "Midfielder B", team: "ARS", pos: "MF", mins: 2600, goals: 0.15, xg: 0.14, shots: 1.6, keyPasses: 1.9, passPct: 92, tackles: 2.6, dribbles: 0.9 },
    { id: "p7",  name: "Anchor A",   team: "AVL", pos: "MF", mins: 2700, goals: 0.05, xg: 0.04, shots: 0.8, keyPasses: 0.9, passPct: 87, tackles: 3.4, dribbles: 0.5 },
    { id: "p8",  name: "Box-to-box A", team: "LIV", pos: "MF", mins: 2350, goals: 0.18, xg: 0.19, shots: 1.9, keyPasses: 1.4, passPct: 86, tackles: 2.9, dribbles: 1.5 },
    { id: "p9",  name: "Centre-back A", team: "ARS", pos: "DF", mins: 2800, goals: 0.05, xg: 0.06, shots: 0.6, keyPasses: 0.3, passPct: 93, tackles: 1.9, dribbles: 0.2 },
    { id: "p10", name: "Full-back A", team: "LIV", pos: "DF", mins: 2650, goals: 0.06, xg: 0.05, shots: 0.7, keyPasses: 2.1, passPct: 84, tackles: 2.3, dribbles: 1.1 },
    { id: "p11", name: "Goalkeeper A", team: "BRE", pos: "GK", mins: 2880, goals: 0, xg: 0, shots: 0, keyPasses: 0.1, passPct: 78, tackles: 0, dribbles: 0, saves: 3.6, savePct: 74 },
    { id: "p12", name: "Goalkeeper B", team: "MCI", pos: "GK", mins: 2880, goals: 0, xg: 0, shots: 0, keyPasses: 0.2, passPct: 89, tackles: 0, dribbles: 0, saves: 2.2, savePct: 71 }
  ];

  const data = { teams, managers, players };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.FOOTY_DATA = data;
})(typeof self !== "undefined" ? self : this);
