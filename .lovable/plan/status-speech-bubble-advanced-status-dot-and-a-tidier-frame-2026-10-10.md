# Status speech bubble, advanced status dot, and a tidier frame/decoration grid

## What you get

### 1. Status speech bubble (Discord-style)
- Your status line no longer sits as plain text under your name. It floats as a speech bubble at the edge of your avatar.
- A tail always points at the centre of the avatar and flips automatically with the chosen position.
- The bubble gently floats up and down, lifts slightly when you hover over it, and stays still for people who turn off animations.
- On small screens it moves inwards so it's never cut off.

### 2. Status dot (statusbolletje)
- **Colour** (as today): Online, Away, Do not disturb, Offline, Hidden.
- **Colour + icon**: a subtle, semi-transparent icon on the dot. Online gets a check, Away a moon, Do not disturb a minus, Offline an empty ring.
- **Custom emoji**: the coloured dot disappears and one emoji from your keyboard takes its place, in exactly the same spot.

### 3. Settings split into content and look
- **Links & components tab (content):** the status dot choice and the status line (max 60 characters).
- **Design & styling tab (look):**
  - Status dot design: an "Add icon" switch and a "Use custom emoji" switch with a field that accepts exactly one emoji.
  - Bubble design:
    - Position compass: a 3×3 grid (top left / top / top right, left / right, bottom left / bottom / bottom right; the centre is the avatar).
    - Style buttons with a live preview: Obsidian, Cartoon (bold border), Glass, Neon, Colourful.
    - Your own bubble background colour and font, separate from the page theme. Text contrast is adjusted automatically so it stays readable.

### 4. Avatar frame and decoration grid
- The filter row gets a "Popular" pill, which is on by default when you open Design & styling.
- Popular shows only 8 hand-picked items, with your favourites first. Everything else stays hidden.
- "All", a category pill (Gaming, Minimal, …) or the "Favourites" pill each show only their own items, no longer stacked on top of each other.
- Typing in the search box always searches all 150+ items, whatever pill is selected.
- This applies to both the avatar frame and the avatar decoration sections.

## Notes
- Existing profiles keep working: no position means top right, no style means Obsidian, and the dot stays plain colour.
- Saving needs the Neon database, like all profile changes. I'll check the look with the live preview and an automated screenshot test.

## Technical
- Storage stays in the flat `display_prefs` JSON (architecture rule), no new columns: `statusBubblePosition`, `statusBubbleStyle`, `statusBubbleBg`, `statusBubbleFont`, `presenceIndicator` ('color' | 'color_with_icon' | 'emoji'); the existing `presenceEmoji` and `statusLine` are reused. All of them are validated in `normalizeDisplayPrefs` (`src/lib/profile-display.ts`): allowed positions/styles/fonts only, hex colour only, emoji checked with `Intl.Segmenter` (one grapheme, emoji pictograph).
- New `src/components/profile/StatusBubble.tsx`: position → CSS classes; the tail is a `::after` rotated square with per-position offsets defined in `src/styles.css` (`.status-bubble[data-pos=…]`), plus a `@keyframes status-float` animation and a `prefers-reduced-motion` guard.
- `AvatarFrameWrapper.tsx`: indicator rendering for colour / icon (inline SVG set in `src/lib/presence-icons.tsx`) / emoji.
- `ProfileView.tsx`: wrap the avatar in `relative`, render the bubble there, and remove the old status line under the name.
- `ProfileThemePicker.tsx` (design) and `ProfileEditor.tsx` (Links tab): move the inputs, add the compass and style picker components (`StatusBubbleSettings.tsx`).
- `DecorGrid.tsx`: a `popular` filter as the default, exclusive per-filter lists, and search that ignores the active filter. Both pickers already use this grid.
- Tests: normalising rejects unknown positions, styles and colours, and multiple emoji; the grid filter logic for popular (max 8), all, category and global search.
