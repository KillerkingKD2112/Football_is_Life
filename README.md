# Football is Life

A football analytics site: predict matches, and read teams, players and managers through xG, passing, shots, saves and tackles.

Open `index.html` in a browser. There is no build step and no server.

## What it does

- **Match**: pick a home and away team. You get expected goals for each side, the likeliest scores, win/draw/loss odds, over 2.5 goals, both teams to score, and notes on how the two playing styles meet. The pitch shows each team's defensive line, how far its press reaches, and how much of its play goes wide.
- **Teams**: sortable table of team stats. Select a team for its style profile (possession, pressing, directness, width, defensive line) and plain-language feedback.
- **Players**: per-90 stats turned into percentile ratings against players in the same position, with feedback on strengths, weak spots, and whether finishing is running above or below xG.
- **Managers**: playing philosophy, formation and tendencies for each side's manager.

## How predictions work

Each side's expected goals = its attacking xG × the opponent's xG conceded (both relative to the league average) × league average, with a small home advantage. Goals for each side are modelled as Poisson, and the score grid gives every outcome above. The model lives in `js/engine.js` and has no dependency on the page.

## Sample data

Numbers in `js/data.js` are placeholders so the site works out of the box. The page says so on every screen. Do not treat the predictions as real until you replace them.

### Plugging in real data

Keep the same shape as `js/data.js` (`teams`, `managers`, `players`) and the site updates. Per-90 team stats from a provider such as FBref, Understat or Opta fit directly. Team style inputs are `possession`, `ppda`, `directness`, `width` and `line`; check the comments at the top of `data.js` for what each means.

## Tests

```
node tests/engine.test.js
```

## Structure

```
index.html        page
css/styles.css    styling
js/data.js        sample data
js/engine.js      predictions, style profiles, player ratings
js/app.js         interface
tests/            engine tests
```

## Ideas for next

- Real data feed and a refresh script
- League table simulation from match predictions
- Player comparison view and team-to-player links
- Head-to-head history
