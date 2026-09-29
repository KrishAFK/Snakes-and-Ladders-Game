# Snakes and Ladders (Web Version)

A browser port of the Java console game `BoardGameFinal.java`. The game rules and board tables are unchanged. The web version adds a drawn board, animated tokens, an animated dice and a win screen. It uses plain HTML, CSS and JavaScript with no build step and no dependencies.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: board container, player cards, dice card, game log, rules, win overlay |
| `style.css` | Theming (CSS variables), layout, board grid, tokens, dice, buttons, animations |
| `script.js` | Game logic, board and SVG drawing, token animation, UI flow |

## Running

Save the three files in one folder and open `index.html` in a modern browser. No server is needed. The only external request is the Fredoka font from Google Fonts. If it fails to load, the page falls back to `Trebuchet MS` or the default sans-serif font.

## Game rules (ported from Java)

- Two players, **Krish** and **Kunjan**, take alternating turns. Both start at position 0.
- A roll is `1 + floor(random() * 6)`, which matches `random.nextInt(6) + 1`.
- Snakes are at 14, 28, 43, 51, 63, 68, 77, 83, 90 and 99. Ladders are at 2, 8, 16, 27, 41, 45, 65 and 73.
- The first player to land exactly on 100 wins. A roll that would go past 100 is undone, and the player stays put.

### Logic mapping

The Java `player.turn()` method became `turn(p, dice)` in `script.js`. The order of operations is the same:

1. `position += dice`
2. If `snakes[position]` is non-zero, move to it.
3. If `ladders[position]` is non-zero, move to it. This is checked after the snake, as in Java.
4. If `position > 100`, subtract `dice`.
5. If `position === 100`, the player wins.

Both lookup tables are arrays of length 105 filled with 0, like the Java `int[105]` arrays. Index = start square, value = destination square.

### Differences from the Java version

| Java | Web version |
|---|---|
| "Press Enter to roll" using `Scanner` | **Roll dice** button |
| `snakes[105]` throws `ArrayIndexOutOfBoundsException` for a roll of 6 from square 99 | The lookup returns 0 in JS, so the roll is undone as an overshoot |
| Prints the turn, roll, snake/ladder and position messages | The dice area shows the roll and the log shows positions only |
| Game ends with a printed "Congrats" line | A win overlay with a **Play again** button appears |

The web `turn()` also returns extra data that the Java version doesn't have: `{ won, land, path }`. `land` is the square reached by the dice roll, and `path` lists any snake or ladder used, so the UI can animate each stage.

## Board and coordinates

- The board is a 10×10 CSS grid, drawn top to bottom from row 9 to row 0 so that square 1 is at the bottom-left.
- Numbering zig-zags: even rows run left to right and odd rows run right to left.
- Tiles use a plain two-colour checkerboard based on `(row + col) % 2`. There is no per-tile tinting.
- `xy(n)` converts a square number to the centre of its tile in an SVG-style 0–100 coordinate space:

  ```js
  row = floor((n-1) / 10);  col = (n-1) % 10;  if (row is odd) col = 9 - col;
  x = (col + 0.5) * 10;     y = (9 - row + 0.5) * 10;
  ```

- The same 0–100 values are used as percentages for token `left` and `top`, so tokens line up with the SVG overlay at any board size.
- The board keeps a square shape with `aspect-ratio: 1`. It scales with the viewport, up to a 560px container.

## Graphics

The SVG overlay (`<svg viewBox="0 0 100 100">`) sits on top of the grid and is generated in JavaScript from the `snakes` and `ladders` arrays. It ignores pointer events.

### Ladders

- Two parallel rails are offset ±1.5 units from the line between start and end squares.
- Rungs are placed every 3.4 units along the ladder.
- Each ladder is drawn in layers: dark outline, rungs, wood-coloured rails, then highlights and small bolts on the rungs.

### Snakes

- Each snake body is 41 sampled points (`N = 40`) along the line from head square to tail square.
- A sine wave is added perpendicular to that line, with amplitude `min(4, 0.16 × length)`.
- The number of half-waves is `max(2, round(length / 13))`, and an envelope of `sqrt(sin(πt))` keeps the head and tail on their tile centres.
- Points are clamped to 3–97, so no snake leaves the board.
- The body is drawn as short line segments that taper from about 2.9 to 0.9 wide. On top of that come a lighter belly stripe and dark spots on every third segment.
- The head is an ellipse rotated to face away from the body, with eyes, pupils and a forked tongue.
- Each snake gets a colour from a fixed list of hues.

## Tokens and animation

- Tokens are absolutely positioned circles centred with `transform: translate(-50%, -50%)`. Player 2's token is offset by +1.6 units and player 1's by −1.6 so they don't hide each other on the same tile.
- At position 0 tokens wait just outside the bottom-left corner of the board.
- A turn runs as one `async` function with these stages:
  1. The dice spins for 700 ms, cycling random faces.
  2. The token steps onto the landing square using a CSS transition on `left` and `top`. It then holds for 1100 ms.
  3. For each snake or ladder: wait 500 ms, then slide along the route, then wait 600 ms.
  4. The log gets the position line and the turn passes, or the win overlay appears.
- `slide()` uses `requestAnimationFrame` and turns the CSS transition off during the move. It interpolates along the route (the sampled points for a snake, or the two end points for a ladder) with an ease-in-out curve. Ladder climbs take 2800 ms and snake slides take 3200 ms.
- A `busy` flag and the disabled button stop overlapping turns.

## Theming and accessibility

- Colours are CSS custom properties on `:root`. A dark palette is the default and a light palette applies under `prefers-color-scheme: light`. Setting `data-theme="light"` or `"dark"` on `<html>` overrides the system setting.
- If `prefers-reduced-motion` is on, the JavaScript delays are scaled to 20% and the CSS transitions and keyframe animations are switched off.
- The dice and log use `aria-live="polite"`, and buttons have a visible `:focus-visible` outline.
- The layout is responsive, wrapping from side-by-side to stacked on narrow screens, and uses `env(safe-area-inset-*)` padding for phones with notches.

## Customising

- **Player names or token colours:** edit the `players` array in `script.js`, the two player cards in `index.html`, and `--p1` and `--p2` in `style.css`. Names in the cards are hard-coded in the HTML.
- **Snake and ladder positions:** edit the `snakes[...]` and `ladders[...]` assignments in `script.js`. The board draws from these automatically, but the rules text in `index.html` is written by hand and needs updating.
- **Animation speed:** change the durations in the click handler (`sleep(...)` calls and the 2800/3200 slide times).
- **Board colours:** change `--c1` and `--c2` in `style.css`.

## Known limitations

- Fixed at two players in one shared browser (pass-and-play). There is no AI opponent and no networking.
- Game state lives only in memory, so refreshing the page restarts the game.
- Dice rolls use `Math.random()`, which is fine for a game but not cryptographically secure.
- Snake routes don't avoid crossing ladders or other snakes, so drawings can overlap.
