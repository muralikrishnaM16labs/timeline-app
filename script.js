// ── WALLPAPERS ──
const WALLPAPERS = {
  ios:       'linear-gradient(135deg,#1a3a6b 0%,#2d5a9e 20%,#7b6fa0 45%,#c4826a 70%,#e8956d 100%)',
  gradient1: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',
  gradient2: 'linear-gradient(160deg,#0d1b2a,#1b2838,#0a1628)',
  gradient3: 'linear-gradient(160deg,#0a1a0a,#0d2b1a,#0a2010)',
  gradient4: 'linear-gradient(160deg,#1a0a0a,#2b0d0d,#200a0a)',
  gradient5: '#000000',
  gradient6: 'linear-gradient(160deg,#0a1628,#0d2b4a,#0a2040)',
  gradient7: 'linear-gradient(160deg,#2b1a0a,#3d1f0d,#1a0a00)',
};

const WP_STORAGE_KEY = 'mindtrack-custom-wallpaper';

// Roughly 2MB of characters. localStorage's ~5MB budget is measured in UTF-16
// code units, so staying under this leaves comfortable headroom.
const WP_MAX_CHARS = 2000000;

// ── LAYOUT CONFIG ──
/*
 * Every position and size on the lock screen is a PERCENTAGE of the screen,
 * never a fixed pixel count.
 *
 * This replaced a lookup table of pixel measurements per iPhone model. That
 * table could only ever be right for the models listed in it: a phone that was
 * not there — a new model, an iPad, Display Zoom turned on — fell back to
 * guesswork, and every correction had to be re-typed once per row. Percentages
 * need no table at all. The same numbers hold their proportions on a 320-point
 * SE and a 440-point 16 Pro Max.
 *
 *   axis 'h'   percentage of the viewport HEIGHT — vertical positions
 *   axis 'w'   percentage of the viewport WIDTH  — type sizes, side insets
 *
 * Sizes key off width rather than height deliberately: width is what decides
 * whether the clock still fits on one line.
 *
 * Most defaults are the real iOS lock screen measured on a 390x844 iPhone
 * 12/13/14 and converted. Clock Size and Glyph Size instead come from a real
 * iOS 26 lock screen screenshot, which is a good deal bolder than the older
 * layout was.
 *
 * Clock Size is capped at 36%. Width scales with the screen on both sides, so
 * the ceiling is the same percentage on every phone: past roughly 37% a
 * five-character time (10:00 through 12:59) runs wider than the space between
 * the side insets. Since a quarter of the day shows five characters, going
 * over would break the prop mid-performance rather than at setup.
 *
 * TO ADD A TUNABLE, ADD ONE LINE HERE. The settings slider, the CSS variable,
 * the live readout, saving and restoring are all generated from this list.
 */
const LAYOUT_CONFIG = [
  // ── Clock ──
  { key: 'clockGap',      css: '--clock-gap',         label: 'Top Gap',         group: 'Clock',      axis: 'h',     pct:  5.57, max: 40 },
  { key: 'clockSide',     css: '--clock-side',        label: 'Side Inset',      group: 'Clock',      axis: 'w',     pct:  6.67, max: 30 },
  { key: 'dateSize',      css: '--date-size',         label: 'Date Size',       group: 'Clock',      axis: 'w',     pct:  4.36, max: 10 },
  { key: 'dateGap',       css: '--date-gap',          label: 'Date → Clock',    group: 'Clock',      axis: 'h',     pct:  0.36, max:  6 },
  { key: 'timeSize',      css: '--time-size',         label: 'Clock Size',      group: 'Clock',      axis: 'w',     pct: 32,    max: 36 },
  { key: 'clockWeight',   css: '--clock-weight',      label: 'Clock Weight',    group: 'Clock',      axis: 'raw',   pct: 600,   min: 100, max: 900, step: 50 },
  { key: 'clockTracking', css: '--clock-tracking',    label: 'Tracking',        group: 'Clock',      axis: 'em',    pct: -3.33, min: -8,  max: 3 },
  { key: 'clockOpacity',  css: '--clock-opacity',     label: 'Clock Opacity',   group: 'Clock',      axis: 'ratio', pct: 100,   min: 10,  max: 100, step: 1 },
  // Glass Clock Style only. Fill is the body alpha; Edge is the rim, in the
  // clock's own em so it stays proportional as the clock is resized.
  { key: 'glassFill',     css: '--clock-glass-fill',  label: 'Glass Fill',      group: 'Clock',      axis: 'ratio', pct:  38,   min:  5,  max: 100, step: 1 },
  { key: 'glassEdge',     css: '--clock-glass-edge',  label: 'Glass Edge',      group: 'Clock',      axis: 'em',    pct:   0.6, min:  0,  max:   3 },
  // ── Buttons ──
  { key: 'bottomGap',     css: '--bottom-gap',        label: 'Bottom Gap',      group: 'Buttons',    axis: 'h',     pct:  2.61, max: 25 },
  { key: 'btnSize',       css: '--btn-size',          label: 'Button Size',     group: 'Buttons',    axis: 'w',     pct: 13.33, max: 30 },
  { key: 'btnSide',       css: '--btn-side',          label: 'Side Inset',      group: 'Buttons',    axis: 'w',     pct: 10.26, max: 35 },
  { key: 'glyphScale',    css: '--glyph-scale',       label: 'Glyph Size',      group: 'Buttons',    axis: 'ratio', pct:  82,   min: 30,  max: 170, step: 1 },
  // ── Status Bar ──
  { key: 'statusH',       css: '--status-h',          label: 'Height',          group: 'Status Bar', axis: 'h',     pct:  5.57, max: 15 },
  { key: 'statusLeft',    css: '--status-left',       label: 'Left Inset',      group: 'Status Bar', axis: 'w',     pct:  8.72, max: 25 },
  { key: 'statusRight',   css: '--status-right',      label: 'Right Inset',     group: 'Status Bar', axis: 'w',     pct:  5.13, max: 25 },
  { key: 'statusIcons',   css: '--status-icon-scale', label: 'Icon Size',       group: 'Status Bar', axis: 'ratio', pct: 100,   min: 40,  max: 180, step: 1 },
  // ── Home Bar ──
  // Apple's indicator is 134 x 5 points sitting 8 above the bottom edge, which
  // is what these percentages are on the 390x844 reference.
  { key: 'homeW',         css: '--home-w',            label: 'Width',           group: 'Home Bar',   axis: 'w',     pct: 34.36, max: 80 },
  { key: 'homeH',         css: '--home-h',            label: 'Thickness',       group: 'Home Bar',   axis: 'h',     pct:  0.59, max:  3 },
  { key: 'homeGap',       css: '--home-gap',          label: 'Bottom Gap',      group: 'Home Bar',   axis: 'h',     pct:  0.95, max:  8 },
  { key: 'homeOpacity',   css: '--home-opacity',      label: 'Opacity',         group: 'Home Bar',   axis: 'ratio', pct: 100,   min: 10,  max: 100, step: 1 },
];

/* Live values, seeded from the defaults above and overwritten by loadSettings. */
const layoutPct = {};
LAYOUT_CONFIG.forEach((c) => { layoutPct[c.key] = c.pct; });

/*
 * The basis is the VIEWPORT, not screen.width/height. With browser toolbars
 * showing, the screen is taller than the area we actually get to paint, and
 * measuring against it would push the buttons off the bottom edge.
 */
function layoutBasis(axis) {
  const w = window.innerWidth  || screen.width;
  const h = window.innerHeight || screen.height;
  return axis === 'w' ? w : h;
}

/*
 * Turns one config entry's stored number into the string CSS wants, plus the
 * label shown beside its slider.
 *
 *   w / h   a percentage of the viewport, resolved to px
 *   raw     the number itself, unitless (font-weight)
 *   ratio   a percentage expressed as 0-1 (opacity, scale factors)
 *   em      a percentage expressed in the element's OWN em, so it tracks that
 *           element's font-size without any recalculation here
 */
function resolveValue(c) {
  const pct = layoutPct[c.key];
  if (c.axis === 'raw')   return { css: String(Math.round(pct)), out: String(Math.round(pct)) };
  if (c.axis === 'ratio') return { css: String(pct / 100), out: pct.toFixed(0) + '%' };
  if (c.axis === 'em')    return { css: (pct / 100).toFixed(4) + 'em', out: pct.toFixed(2) + '%' };
  const px = layoutBasis(c.axis) * pct / 100;
  return { css: px.toFixed(2) + 'px', out: pct.toFixed(2) + '%', px: Math.round(px) };
}

/* One row: label, live readout, slider. */
function buildLayoutRow(c) {
  const row = document.createElement('div');
  row.className = 'secret-row layout-row';

  const head = document.createElement('div');
  head.className = 'layout-head';

  const label = document.createElement('label');
  label.textContent = c.label;

  const out = document.createElement('span');
  out.className = 'pct-out';
  out.id = 'out-' + c.key;

  head.appendChild(label);
  head.appendChild(out);

  const slider = document.createElement('input');
  slider.type  = 'range';
  slider.id    = 'pct-' + c.key;
  slider.min   = String(c.min === undefined ? 0 : c.min);
  slider.max   = String(c.max);
  slider.step  = String(c.step === undefined ? 0.01 : c.step);
  slider.value = String(layoutPct[c.key]);

  // 'input', not 'change', so the clock moves under the finger as the slider
  // is dragged — placing it by eye is the whole point of a slider here.
  slider.addEventListener('input', () => {
    layoutPct[c.key] = parseFloat(slider.value) || 0;
    applyLayout();
  });
  // Writing to storage on every drag frame would be wasteful; once the finger
  // lifts is enough.
  slider.addEventListener('change', saveSettings);

  row.appendChild(head);
  row.appendChild(slider);
  return row;
}

/*
 * Builds the sliders, grouped into collapsed <details> sections.
 *
 * Sixteen sliders laid out flat is an unusable scroll on a phone. Collapsed,
 * the Layout section opens four rows tall and you expand only the group you
 * are working on. The grouping comes from the config's own `group` field, so
 * adding a tunable still means adding exactly one line.
 */
function buildLayoutControls() {
  const host = document.getElementById('layout-rows');
  if (!host || host.childElementCount) return;

  const groups = [];
  LAYOUT_CONFIG.forEach((c) => {
    let g = groups.find((x) => x.name === c.group);
    if (!g) { g = { name: c.group, items: [] }; groups.push(g); }
    g.items.push(c);
  });

  groups.forEach((g) => {
    const details = document.createElement('details');
    details.className = 'layout-group';

    const summary = document.createElement('summary');
    summary.textContent = g.name;
    details.appendChild(summary);

    g.items.forEach((c) => details.appendChild(buildLayoutRow(c)));
    host.appendChild(details);
  });
}

/* Pushes layoutPct back into the sliders after a restore or a reset. */
function syncLayoutControls() {
  LAYOUT_CONFIG.forEach((c) => {
    const slider = document.getElementById('pct-' + c.key);
    if (slider) slider.value = String(layoutPct[c.key]);
  });
}

/*
 * The single place stored numbers become CSS. Re-runs on resize and rotation,
 * so the proportions survive the phone being turned.
 */
function applyLayout() {
  const root = document.documentElement.style;

  LAYOUT_CONFIG.forEach((c) => {
    const v = resolveValue(c);
    root.setProperty(c.css, v.css);

    // Show the setting and, where there is one, what it currently resolves to
    // — so a figure can be read off one phone and typed into another.
    const out = document.getElementById('out-' + c.key);
    if (out) {
      out.textContent = v.out + (v.px === undefined ? '' : ' ');
      if (v.px !== undefined) {
        const px_ = document.createElement('span');
        px_.className = 'px';
        px_.textContent = '(' + v.px + 'px)';
        out.appendChild(px_);
      }
    }
  });

  const align = document.getElementById('clock-align');
  if (align) root.setProperty('--clock-align', align.value);

  const info = document.getElementById('layout-info');
  if (info) {
    info.textContent =
      'viewport ' + Math.round(layoutBasis('w')) + '\u00d7' + Math.round(layoutBasis('h')) +
      '   device ' + screen.width + '\u00d7' + screen.height;
  }
}

function resetLayout() {
  LAYOUT_CONFIG.forEach((c) => { layoutPct[c.key] = c.pct; });
  syncLayoutControls();
  applyLayout();
  saveSettings();
}

// ── SAFE-AREA CANVAS COLOUR ──
/*
 * The black band along the bottom of an iPhone.
 *
 * iOS never lets page content reach the strip behind the home indicator — not
 * even a position:fixed element sized to 100lvh. It fills that strip from the
 * ROOT element's background, and crucially only from its background COLOUR:
 * a background IMAGE is clipped to the viewport box and stops at its edge.
 *
 * Mirroring the wallpaper image onto <html> therefore never reached the strip,
 * and the root's #000 floor showed through instead — the black band. The fix
 * is to give the root the wallpaper's BOTTOM EDGE colour, so the strip reads
 * as a continuation of the wallpaper rather than a cut-off.
 *
 * The colour has to follow the visible screen, not just the wallpaper: the
 * passcode screen is solid black and settings is #0a0a0a, so painting the
 * strip orange under either of those would look just as wrong as the band.
 */
let wallpaperImage      = 'none';
let wallpaperEdgeColor  = '#000';
let currentScreen       = 'screen-pin';

/* The last colour stop of a gradient string is what meets the bottom edge. */
function gradientEndColor(gradient) {
  const stops = gradient.match(/#[0-9a-f]{3,8}\b/gi);
  return stops && stops.length ? stops[stops.length - 1] : '#000';
}

/*
 * Same idea for a custom photo, but the colour has to be read out of the
 * pixels. Drawing the bottom 4% of the image into a 1x1 canvas averages that
 * strip down to a single value for free.
 */
function sampleImageEdgeColor(url) {
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width  = 1;
      canvas.height = 1;
      const ctx  = canvas.getContext('2d');
      const band = Math.max(1, Math.round(img.naturalHeight * 0.04));
      ctx.drawImage(
        img,
        0, img.naturalHeight - band, img.naturalWidth, band,
        0, 0, 1, 1
      );
      const px = ctx.getImageData(0, 0, 1, 1).data;
      wallpaperEdgeColor = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
      syncCanvasColor();
      applyTorchLit();
    } catch (err) {
      // A tainted canvas can't be read. Our wallpapers are data: URLs so this
      // shouldn't happen, but a failure here must only cost the edge colour.
    }
  };
  img.src = url;
}

/*
 * Repaints the root for whichever screen is showing. theme-color goes with it
 * so Safari's own chrome (browser tab bar, and the strip in some iOS builds)
 * is tinted to match rather than staying black.
 */
function syncCanvasColor() {
  const root   = document.documentElement;
  const onHome = currentScreen === 'screen-home';

  let color = '#000';                              // passcode screen
  if (currentScreen === 'screen-secret') color = '#0a0a0a';
  else if (onHome)                       color = wallpaperEdgeColor;

  root.style.backgroundColor = color;
  // Only the home screen shows the wallpaper, so the root only carries the
  // image there — otherwise it could bleed into the strip on iOS builds that
  // do stretch the root image.
  root.style.backgroundImage = onHome ? wallpaperImage : 'none';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

// ── WALLPAPER PAINTING ──
/*
 * Paints the wallpaper onto #wallpaper and records what the root needs, then
 * hands the root over to syncCanvasColor (see above).
 *
 * This used to be duplicated in three places (applyWallpaper, the startup
 * restore block, and the gallery handler), which is how they drifted apart.
 */
function setWallpaperBackground(value, isImage) {
  const el   = document.getElementById('wallpaper');
  const root = document.documentElement;

  // Three shapes arrive here: a photo URL, a gradient string, or a bare colour
  // (WALLPAPERS.gradient5 is '#000000'). A colour must go to background-color —
  // assigning it to background-image is invalid and gets dropped silently.
  let image = 'none';
  let color = '#000';
  if (isImage)                         image = 'url(' + value + ')';
  else if (value.includes('gradient')) { image = value; color = gradientEndColor(value); }
  else                                 color = value;

  // Clear the shorthand first so a previous gradient can't linger underneath.
  el.style.background         = '';
  el.style.backgroundColor    = color;
  el.style.backgroundImage    = image;
  el.style.backgroundSize     = 'cover';
  el.style.backgroundPosition = 'center';
  el.style.backgroundRepeat   = 'no-repeat';

  root.style.background         = '';
  root.style.backgroundSize     = 'cover';
  root.style.backgroundPosition = 'center';
  root.style.backgroundRepeat   = 'no-repeat';

  wallpaperImage     = image;
  wallpaperEdgeColor = color;
  syncCanvasColor();
  // Wallpaper mode derives the lit tint from wallpaperEdgeColor, so it has to
  // be recomputed on every repaint, not only when the setting changes.
  applyTorchLit();

  // A photo's edge colour arrives once the image has decoded; until then the
  // strip stays black, which is what it was doing anyway.
  if (isImage) sampleImageEdgeColor(value);
}

// ── SCREEN MANAGER ──
function showScreen(id) {
  document.getElementById('screen-pin').style.display    = 'none';
  document.getElementById('screen-home').style.display   = 'none';
  document.getElementById('screen-secret').style.display = 'none';
  document.getElementById(id).style.display = 'flex';
  currentScreen = id;
  // The strip behind the home indicator is painted per screen, so it has to
  // change with every screen change.
  syncCanvasColor();
}

// ── STATE ──
let clockInterval        = null;
let offsetClockInterval  = null;
let targetHour           = 9;
let targetMin            = 41;
let targetAmpm           = 'AM';
let targetShowing        = false;
let pinPressTimer        = null;
let isPinLongPress       = false;
let activeOffsetMinutes  = 0;
// Held so a pending countback can be cancelled — opening settings or locking
// back to the passcode used to leave it running in the background.
let rollbackTimer        = null;
// The countback animation itself, so it can be stopped part-way. Without this
// it ran on invisibly behind the settings panel and spent the trick unseen.
let rollAnimTimer        = null;

// ── SAVE SETTINGS ──
function saveSettings() {
  const settings = {
    wallpaper:  document.getElementById('wallpaper-select').value,
    clockColor: document.getElementById('clock-color').value,
    glassMode:  document.getElementById('glass-mode').value,
    clockStyle: document.getElementById('clock-style').value,
    dateFormat: document.getElementById('date-format').value,
    torchLit:   document.getElementById('torch-lit').value,
    torchGlyph: document.getElementById('torch-glyph-mode').value,
    // One object holding every percentage, so adding a tunable needs no change
    // here at all.
    layout:     Object.assign({}, layoutPct),
    clockAlign: document.getElementById('clock-align').value,
    statusTime:  document.getElementById('statusbar-time').value,
    statusIcons: document.getElementById('statusbar-icons').value,
    homeBar:     document.getElementById('home-indicator-toggle').value,
    battery:     document.getElementById('battery-level-select').value,
    direction:  document.getElementById('tap-direction').value,
    unit:       document.getElementById('tap-unit').value,
    speed:      document.getElementById('anim-speed').value,
    trigger:    document.getElementById('trigger-type').value,
  };
  try {
    localStorage.setItem('mindtrack-settings', JSON.stringify(settings));
  } catch (err) {
    // Quota is shared with the wallpaper photo, so this can genuinely fail.
    // Losing a setting must not take the running app down with it.
  }
}

// ── LOAD SETTINGS ──
function loadSettings() {
  const saved = localStorage.getItem('mindtrack-settings');
  if (!saved) return;
  // Corrupt storage used to throw here and abort the whole DOMContentLoaded
  // handler, leaving a dead screen. Fall back to defaults instead.
  let s;
  try {
    s = JSON.parse(saved);
  } catch (err) {
    return;
  }
  if (s.wallpaper)  document.getElementById('wallpaper-select').value = s.wallpaper;
  if (s.clockColor) document.getElementById('clock-color').value      = s.clockColor;
  if (s.glassMode)  document.getElementById('glass-mode').value       = s.glassMode;
  if (s.clockStyle) document.getElementById('clock-style').value      = s.clockStyle;
  if (s.dateFormat) document.getElementById('date-format').value      = s.dateFormat;
  if (s.torchLit)   document.getElementById('torch-lit').value        = s.torchLit;
  if (s.torchGlyph) document.getElementById('torch-glyph-mode').value = s.torchGlyph;
  // Only keys still listed in LAYOUT_CONFIG are taken, so a value saved by an
  // older build for a tunable that no longer exists is ignored rather than
  // resurrecting a dead CSS variable. A 0 is a legitimate setting, so this
  // tests the parse and not the truthiness.
  if (s.layout) {
    LAYOUT_CONFIG.forEach((c) => {
      const v = parseFloat(s.layout[c.key]);
      if (!isNaN(v)) layoutPct[c.key] = v;
    });
  }
  if (s.clockAlign)  document.getElementById('clock-align').value          = s.clockAlign;
  if (s.statusTime)  document.getElementById('statusbar-time').value       = s.statusTime;
  if (s.statusIcons) document.getElementById('statusbar-icons').value      = s.statusIcons;
  if (s.homeBar)     document.getElementById('home-indicator-toggle').value = s.homeBar;
  if (s.battery)     document.getElementById('battery-level-select').value = s.battery;
  if (s.direction)  document.getElementById('tap-direction').value    = s.direction;
  if (s.unit)       document.getElementById('tap-unit').value         = s.unit;
  if (s.speed)      document.getElementById('anim-speed').value       = s.speed;
  if (s.trigger)    document.getElementById('trigger-type').value     = s.trigger;
}

// ── APPLY SETTINGS ──
function applyWallpaper() {
  const sel        = document.getElementById('wallpaper-select').value;
  const galleryRow = document.getElementById('gallery-row');

  if (sel === 'custom') {
    galleryRow.style.display = 'flex';
    const savedCustomWp = localStorage.getItem(WP_STORAGE_KEY);
    if (savedCustomWp) setWallpaperBackground(savedCustomWp, true);
  } else {
    galleryRow.style.display = 'none';
    // Fall back to the default if a stale saved setting names a wallpaper that
    // no longer exists, rather than passing undefined down.
    setWallpaperBackground(WALLPAPERS[sel] || WALLPAPERS.ios, false);
  }
}

// ── CUSTOM PHOTO STORAGE ──
/*
 * A straight-from-the-camera iPhone photo is several MB once base64-encoded,
 * which blows the localStorage quota. The old code stored it raw and let the
 * resulting QuotaExceededError escape unhandled — so the wallpaper applied for
 * the session and then silently reverted on the next launch.
 *
 * Downscaling to screen resolution and re-encoding as JPEG brings a typical
 * photo down to a few hundred KB.
 */
function prepareWallpaper(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload  = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode that image'));
      img.onload  = () => {
        // Cap the long edge at the device's own pixel height — anything beyond
        // that is invisible on screen but costs storage we do not have.
        const dpr     = window.devicePixelRatio || 2;
        const target  = Math.min(2400, Math.max(screen.width, screen.height) * dpr);
        const longest = Math.max(img.width, img.height);
        const scale   = Math.min(1, target / longest);

        const canvas  = document.createElement('canvas');
        canvas.width  = Math.max(1, Math.round(img.width  * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        // Step quality down until it fits. Normally succeeds on the first try.
        for (const q of [0.85, 0.7, 0.55, 0.4]) {
          const url = canvas.toDataURL('image/jpeg', q);
          if (url.length <= WP_MAX_CHARS) return resolve(url);
        }
        reject(new Error('Photo too large even after compression'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function storeCustomWallpaper(dataUrl) {
  try {
    localStorage.setItem(WP_STORAGE_KEY, dataUrl);
    return { ok: true, kb: Math.round(dataUrl.length / 1024) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/*
 * iOS 26.2 added a Liquid Glass control under Settings > Display & Brightness
 * with exactly these two modes. They look materially different, so the prop
 * has to be set to match the phone it runs on — otherwise the buttons read
 * subtly wrong sitting beside a real lock screen.
 */
function applyGlassMode() {
  const tinted = document.getElementById('glass-mode').value === 'tinted';
  document.documentElement.classList.toggle('glass-tinted', tinted);
}

/* Apple's systemBlue in dark contexts — the stock iOS accent. */
const SYSTEM_BLUE = { r: 10, g: 132, b: 255 };

/* Translucent rather than opaque: on a glass control nothing should be solid,
   or that part stops belonging to the material. */
const TORCH_GLYPH_DARK = 'rgba(28, 28, 30, 0.78)';

/*
 * Reads a colour that arrives either as a hex string from a gradient stop or
 * as rgb() from the photo sampler. Returns null when it cannot parse, so
 * callers fall back rather than emitting an invalid value that CSS would drop.
 */
function parseColor(color) {
  const hex = String(color).match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b].some(isNaN) ? null : { r, g, b };
  }
  const m = String(color).match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}

/*
 * The whole lit-torch appearance: disc tint, backdrop brightness, glow and
 * glyph, resolved together.
 *
 * Disc and glyph cannot be decided independently — a dark glyph is right on a
 * white disc and unreadable on a blue one — which is why Auto exists and why
 * this is one function rather than two.
 *
 * The glass mode matters too: Tinted passes less backdrop through, so there is
 * less light to amplify. It needs a heavier fill and a much lower brightness,
 * or Clear's settings would blow it out to flat colour.
 */
function applyTorchLit() {
  const litSel = document.getElementById('torch-lit');
  const glyphSel = document.getElementById('torch-glyph-mode');
  if (!litSel || !glyphSel) return;

  const lit = litSel.value;
  const tinted = document.documentElement.classList.contains('glass-tinted');
  const root = document.documentElement.style;

  let rgb = SYSTEM_BLUE;
  let brightness = tinted ? 1.05 : 1.35;

  if (lit === 'white') {
    rgb = { r: 255, g: 255, b: 255 };
    brightness = tinted ? 1.6 : 2.8;
  } else if (lit === 'wallpaper') {
    rgb = parseColor(wallpaperEdgeColor) || SYSTEM_BLUE;
    brightness = tinted ? 1.2 : 1.7;
  }

  const alpha = tinted ? 0.78 : 0.55;
  const rgbStr = rgb.r + ', ' + rgb.g + ', ' + rgb.b;
  root.setProperty('--torch-lit-tint', 'rgba(' + rgbStr + ', ' + alpha + ')');
  root.setProperty('--torch-lit-brightness', String(brightness));
  root.setProperty('--torch-lit-glow', 'rgba(' + rgbStr + ', 0.45)');

  // Auto contrasts against the disc: only a white disc wants a dark glyph.
  let glyph;
  if (glyphSel.value === 'white')     glyph = '#ffffff';
  else if (glyphSel.value === 'dark') glyph = TORCH_GLYPH_DARK;
  else                                glyph = lit === 'white' ? TORCH_GLYPH_DARK : '#ffffff';
  root.setProperty('--torch-on-glyph', glyph);
}

/*
 * Clock colour, for both styles.
 *
 * Glass needs the colour as raw channels so CSS can build rgba() stops from it
 * at several alphas; solid just paints it. In glass the element's own colour
 * must go transparent, or it would paint over the clipped gradient.
 */
function applyClockColor() {
  const color = document.getElementById('clock-color').value;
  const el    = document.getElementById('clock-time');
  const styleSel = document.getElementById('clock-style');
  const glass = !styleSel || styleSel.value === 'glass';
  const c = parseColor(color) || { r: 255, g: 255, b: 255 };

  el.classList.toggle('clock-glass', glass);
  document.documentElement.style.setProperty('--clock-rgb', c.r + ', ' + c.g + ', ' + c.b);
  el.style.color = glass ? 'transparent' : color;
}

function applyStatusTime() {
  const show = document.getElementById('statusbar-time').value === 'show';
  document.getElementById('status-time').classList.toggle('hidden', !show);
}

function applyStatusIcons() {
  const show = document.getElementById('statusbar-icons').value === 'show';
  document.getElementById('status-right').classList.toggle('hidden', !show);
}

/*
 * Draws the battery fill. navigator.getBattery() does not exist in Safari, so
 * the level is a setting rather than the real charge.
 */
/*
 * The home indicator is off unless explicitly switched on, matching the status
 * bar halves — on a stock iPhone the real one is already there.
 */
function applyHomeIndicator() {
  const show = document.getElementById('home-indicator-toggle').value === 'show';
  document.getElementById('home-indicator').classList.toggle('hidden', !show);
}

function applyBatteryLevel() {
  const pct  = parseInt(document.getElementById('battery-level-select').value, 10) || 100;
  const rect = document.getElementById('battery-level');
  const FULL = 20.6;  // width of the fill at 100%, in the SVG's viewBox units
  rect.setAttribute('width', Math.max(1, (FULL * pct) / 100).toFixed(1));
  // iOS turns the fill red below 20%.
  rect.setAttribute('fill', pct <= 20 ? '#ff3b30' : '#ffffff');
}

function applyAllSettings() {
  applyLayout();
  applyGlassMode();
  applyWallpaper();
  applyTorchLit();
  applyClockColor();
  applyStatusTime();
  applyStatusIcons();
  applyHomeIndicator();
  applyBatteryLevel();
}

// ── LOCK SCREEN BUTTONS ──
/*
 * The camera is real — a file input with capture="environment" opens the rear
 * camera on iOS.
 *
 * The torch is appearance only. Driving the LED needs the MediaStreamTrack
 * `torch` constraint, which WebKit does not implement — and every iOS browser
 * is WebKit, so no browser on the device can reach the hardware. Rather than
 * fake it by whiting out the display, the button simply adopts the lit look
 * iOS gives it: white circle, dark glyph. Nothing ever covers the lock screen.
 */
function setTorch(on) {
  document.getElementById('torch-btn').classList.toggle('torch-on', on);
}

/*
 * Wires an element so a long hold runs one action and a short tap another.
 * The click that follows a completed hold is swallowed, so holding the torch
 * does not also toggle it on the way out.
 *
 * onHold may return false to decline — the press is then treated as an
 * ordinary tap and onTap still runs. That is what lets holding the camera do
 * nothing special while the torch is off, yet still open the camera.
 */
function attachLongPress(el, holdMs, onHold, onTap) {
  let timer = null;
  let held  = false;

  const start = () => {
    held  = false;
    timer = setTimeout(() => { held = onHold() !== false; }, holdMs);
  };
  const cancel = () => clearTimeout(timer);

  el.addEventListener('mousedown', start);
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchcancel', cancel);

  el.addEventListener('click', () => {
    if (held) { held = false; return; }
    onTap();
  });
}

function initLockScreenButtons() {
  const torch    = document.getElementById('torch-btn');
  const camera   = document.getElementById('camera-btn');
  const camInput = document.getElementById('camera-input');

  /*
   * The home screen arms the settings long-press on touchstart and fires the
   * countback on touchend. Neither should happen just because one of these
   * buttons was pressed — a spectator poking the torch must not start the
   * roll, and must not land in the secret settings panel.
   */
  ['mousedown', 'mouseup', 'touchstart', 'touchend', 'click'].forEach((type) => {
    [torch, camera].forEach((btn) => {
      btn.addEventListener(type, (e) => e.stopPropagation());
    });
  });

  /*
   * Hidden performer controls on the bottom buttons:
   *   hold the torch                 -> lock back to the passcode screen
   *   torch ON, then hold the camera -> open settings
   *
   * Settings needs the torch lit first, so it takes a deliberate two-step
   * combination. With the torch off the camera behaves completely normally,
   * however long it is held — nothing a spectator does can reach settings.
   *
   * Deliberately NOT cancelled on touchmove. That is what broke the old
   * long-press-anywhere: a finger resting on glass drifts constantly, so the
   * hold was cancelled before it ever completed.
   */
  attachLongPress(torch, 900, lockToPasscode,
    () => setTorch(!torch.classList.contains('torch-on')));

  attachLongPress(camera, 900,
    () => {
      if (!torch.classList.contains('torch-on')) return false;  // ordinary tap
      setTorch(false);   // leave no trace of the combination behind
      openSettings();
      return true;
    },
    () => {
      flashButton(camera);
      camInput.click();
    });
  camInput.addEventListener('change', (e) => {
    // The photo itself is not wanted — opening the camera is the whole point.
    e.target.value = '';
  });
}

// ── PASSCODE ENTRY ──
/*
 * One digit unlocks. The tapped digit sets the time offset, and the key still
 * flashes and fills a dot first so the press is visibly registered before the
 * screen changes — raise PIN_LENGTH if a longer entry is ever wanted.
 */
const PIN_LENGTH = 1;
let pinEntry = [];

function flashPinButton(btn) {
  // Held slightly longer than a CSS :active would survive, so the press is
  // still visible as the screen changes underneath it.
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 130);
}

/*
 * Visible confirmation that a button's handler actually ran. Matters for the
 * camera: iOS refuses media capture over plain http:// silently, so without
 * this there is no way to tell "the code never fired" from "iOS blocked it".
 */
function flashButton(btn) {
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 180);
}

function updatePinDots() {
  document.querySelectorAll('.pin-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < pinEntry.length);
  });
}

function clearPinEntry() {
  pinEntry = [];
  updatePinDots();
}

function offsetFromDigit(num) {
  const direction = document.getElementById('tap-direction').value;
  const unit      = document.getElementById('tap-unit').value;
  const minutes   = unit === 'hours' ? num * 60 : num;
  return direction === 'backward' ? -minutes : minutes;
}

/*
 * Long-pressing the torch locks back to the passcode screen, ready for the
 * next performance. Any countback still pending is cancelled — otherwise it
 * would fire a few seconds later while the passcode screen is showing.
 */
function lockToPasscode() {
  clearTimeout(rollbackTimer);
  rollbackTimer = null;
  stopRollAnimation();
  stopRealClock();
  stopOffsetClock();
  targetShowing = false;
  setTorch(false);
  clearPinEntry();
  showScreen('screen-pin');
  setPinDim(false);
  setTimeout(() => setPinDim(true), 1000);
}

const DAYS_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS_FULL = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];

/*
 * The unlock path and the running clock each carried their own copy of these
 * tables and their own formatting, which is exactly how two renderings of the
 * same date drift apart. One function now, and the setting applies to both.
 *
 * iOS 26 abbreviates on the lock screen — "Tue Apr 1" — which is why short is
 * the default; full is there for older iOS.
 */
function formatDate(now) {
  const sel = document.getElementById('date-format');
  if (!sel || sel.value === 'short') {
    return DAYS_SHORT[now.getDay()] + ' ' + MONTHS_SHORT[now.getMonth()] + ' ' + now.getDate();
  }
  return DAYS_FULL[now.getDay()] + ', ' + MONTHS_FULL[now.getMonth()] + ' ' + now.getDate();
}

function unlockToLockScreen() {
  stopRealClock();

  const now = new Date();
  document.getElementById('clock-date').textContent = formatDate(now);

  targetShowing = true;
  applyAllSettings();
  setPinDim(false);
  showScreen('screen-home');
  startOffsetClock(activeOffsetMinutes);
  clearPinEntry();
}

function handlePinDigit(num, btn) {
  if (pinEntry.length >= PIN_LENGTH) return;

  flashPinButton(btn);
  pinEntry.push(num);
  updatePinDots();

  // Only the first digit carries the secret.
  if (pinEntry.length === 1) {
    activeOffsetMinutes = offsetFromDigit(num);

    if (document.getElementById('trigger-type').value === 'tap-vibrate') {
      // No-op on iOS: Safari does not implement the Vibration API.
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }

    const direction = document.getElementById('tap-direction').value;
    const unit      = document.getElementById('tap-unit').value;
    document.getElementById('status-text').textContent =
      '✦ IST ' + (direction === 'forward' ? '+' : '-') + num + ' ' + unit;
  }

  if (pinEntry.length === PIN_LENGTH) {
    // Brief beat so the sixth dot is seen filling, as iOS does before unlocking.
    setTimeout(unlockToLockScreen, 260);
  }
}

// ── PIN DIM ──
/*
 * Fades only the keypad, never the black backdrop. Fading #screen-pin itself
 * made the whole element translucent, so the "screen off" state showed
 * whatever was behind it (previously 85% orange body).
 */
function setPinDim(dimmed) {
  document.getElementById('pin-content').style.opacity = dimmed ? '0.15' : '1';
}

/*
 * Cancels any pending countback on the way in. Previously the 3s timer kept
 * running behind the settings panel, so the roll happened unseen and the trick
 * was spent before it was ever shown.
 */
function openSettings() {
  clearTimeout(rollbackTimer);
  rollbackTimer = null;
  stopRollAnimation();
  showScreen('screen-secret');
}

// ── HELPERS ──
/*
 * The single choke point for every clock path — the real clock, the offset
 * clock and the roll-back animation all land here. Writing the status-bar
 * time in the same place is what keeps it locked to the big clock through the
 * offset and the whole countback without any extra bookkeeping.
 */
function setDisplay(h, m) {
  const text = h + ':' + String(m).padStart(2, '0');
  document.getElementById('clock-time').textContent  = text;
  document.getElementById('status-time').textContent = text;
}

function toTotal(h, m, ampm) {
  let total = (h % 12) * 60 + m;
  if (ampm === 'PM') total += 12 * 60;
  return total;
}

function fromTotal(total) {
  total = ((total % (12 * 60)) + 12 * 60) % (12 * 60);
  const ap = total >= 12 * 60 ? 'PM' : 'AM';
  const t  = total % (12 * 60);
  const h  = Math.floor(t / 60) || 12;
  const m  = t % 60;
  return { h, m, ap };
}

// ── REAL CLOCK ──
function startRealClockSaved() {
  updateRealClock();
  clockInterval = setInterval(updateRealClock, 1000);
}

function stopRealClock() {
  clearInterval(clockInterval);
  clearInterval(offsetClockInterval);
  clockInterval       = null;
  offsetClockInterval = null;
}

/*
 * Halts a countback that is part-way through. Every route that leaves the lock
 * screen must call this, or the roll keeps stepping on an invisible screen and
 * lands on the real time without anyone having seen it.
 */
function stopRollAnimation() {
  clearInterval(rollAnimTimer);
  rollAnimTimer = null;
}

function updateRealClock() {
  const now = new Date();
  let   h   = now.getHours();
  const m   = now.getMinutes();
  h = h % 12 || 12;
  setDisplay(h, m);
  document.getElementById('clock-date').textContent = formatDate(now);
}

// ── OFFSET CLOCK ──
function startOffsetClock(offsetMinutes) {
  clearInterval(offsetClockInterval);
  clearInterval(clockInterval);
  clockInterval = null;

  function tickOffset() {
    const now       = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow    = new Date(now.getTime() + istOffset);
    let totalMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
    totalMinutes += offsetMinutes;
    if (totalMinutes >= 24 * 60) totalMinutes -= 24 * 60;
    if (totalMinutes < 0)        totalMinutes += 24 * 60;
    let h  = Math.floor(totalMinutes / 60);
    let m  = totalMinutes % 60;
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    targetHour = h;
    targetMin  = m;
    targetAmpm = ap;
    setDisplay(h, m);
  }

  tickOffset();
  offsetClockInterval = setInterval(tickOffset, 1000);
}

function stopOffsetClock() {
  clearInterval(offsetClockInterval);
  offsetClockInterval = null;
}

// ── ROLL BACK ANIMATION ──
function rollBackToIST() {
  stopOffsetClock();

  const now       = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow    = new Date(now.getTime() + istOffset);
  let realH  = istNow.getUTCHours();
  let realM  = istNow.getUTCMinutes();
  let realAp = realH >= 12 ? 'PM' : 'AM';
  realH = realH % 12 || 12;

  const curTotal = toTotal(targetHour, targetMin, targetAmpm);
  const endTotal = toTotal(realH, realM, realAp);

  const speedSetting = document.getElementById('anim-speed').value;
  const stepDelay    = speedSetting === 'slow' ? 1500
                     : speedSetting === 'fast' ? 400
                     : 1000;

  /*
   * Forward: the offset clock started AHEAD of the real time, so the countback
   * walks down to meet it (1:30 -> 1:25).
   * Backward: it started BEHIND, so the countback walks up (1:20 -> 1:25).
   */
  const direction = document.getElementById('tap-direction').value;
  let diff          = 0;
  let rollDirection = 1;

  if (direction === 'forward') {
    diff = curTotal - endTotal;
    if (diff < 0) diff += 12 * 60;
    rollDirection = -1;
  } else {
    diff = endTotal - curTotal;
    if (diff < 0) diff += 12 * 60;
    rollDirection = 1;
  }

  if (diff === 0) {
    startRealClockSaved();
    return;
  }

  let step      = 0;
  const clockEl = document.getElementById('clock-time');

  clearInterval(rollAnimTimer);
  rollAnimTimer = setInterval(() => {
    step++;
    if (step >= diff) {
      clearInterval(rollAnimTimer);
      rollAnimTimer = null;
      setDisplay(realH, realM);
      setTimeout(() => {
        activeOffsetMinutes = 0;
        startRealClockSaved();
      }, 600);
      return;
    }
    let newTotal = curTotal + (step * rollDirection);
    if (newTotal >= 12 * 60) newTotal -= 12 * 60;
    if (newTotal < 0)        newTotal += 12 * 60;
    const { h, m } = fromTotal(newTotal);
    setDisplay(h, m);
    // A class, not inline opacity: the Clock Opacity setting has to survive
    // the countback, and an inline write would replace it rather than dim it.
    clockEl.classList.add('roll-dim');
    setTimeout(() => {
      clockEl.classList.remove('roll-dim');
    }, stepDelay / 2);
  }, stepDelay);
}

// ── APP START ──
document.addEventListener('DOMContentLoaded', () => {

  showScreen('screen-pin');
  setPinDim(false);

  setTimeout(() => setPinDim(true), 1000);

  // Built first so loadSettings has sliders to populate, synced after so the
  // restored percentages actually show on them.
  buildLayoutControls();
  loadSettings();
  syncLayoutControls();
  // applyWallpaper() already restores a saved custom photo, so the separate
  // restore block that used to live here was redundant duplication.
  applyAllSettings();
  initLockScreenButtons();

  // Auto follows the device, so a rotation or a resized window has to re-run
  // the match instead of keeping the figures it started with.
  window.addEventListener('resize', applyLayout);
  window.addEventListener('orientationchange', applyLayout);

  // Safari can evict localStorage for infrequently-used sites. This is a prop
  // that has to survive between performances, so ask for durable storage.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  // ── PIN BUTTONS ──
  document.querySelectorAll('.pin-btn[data-num]').forEach(btn => {
    btn.addEventListener('click', () => {
      handlePinDigit(parseInt(btn.getAttribute('data-num'), 10), btn);
    });
  });

  document.getElementById('pin-clear')
    .addEventListener('click', clearPinEntry);

  // ── LONG PRESS PIN → SETTINGS ──
  document.getElementById('screen-pin')
    .addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('pin-btn')) return;
      isPinLongPress = false;
      pinPressTimer  = setTimeout(() => {
        isPinLongPress = true;
        openSettings();
      }, 1500);
    });
  document.getElementById('screen-pin')
    .addEventListener('mouseup', () => {
      if (!isPinLongPress) clearTimeout(pinPressTimer);
    });
  document.getElementById('screen-pin')
    .addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('pin-btn')) return;
      isPinLongPress = false;
      pinPressTimer  = setTimeout(() => {
        isPinLongPress = true;
        openSettings();
      }, 1500);
    }, { passive: true });
  document.getElementById('screen-pin')
    .addEventListener('touchend', () => {
      if (!isPinLongPress) clearTimeout(pinPressTimer);
    });

  /*
   * TAP THE LOCK SCREEN → COUNTBACK
   *
   * Long-press-anywhere used to open settings from here, and it barely worked:
   * any touchmove cancelled it, and a finger resting on glass always drifts a
   * little, so the 1.5s almost never completed. Settings moved to a long press
   * on the CAMERA button, which is deliberate, reliable, and can't be reached
   * by a spectator idly holding the phone.
   *
   * touchend and mouseup can both fire for one touch; the second call is a
   * no-op because targetShowing is already false.
   */
  const scheduleCountback = () => {
    if (!targetShowing) return;
    targetShowing = false;
    rollbackTimer = setTimeout(() => {
      rollbackTimer = null;
      rollBackToIST();
    }, 3000);
  };
  document.getElementById('screen-home')
    .addEventListener('mouseup', scheduleCountback);
  document.getElementById('screen-home')
    .addEventListener('touchend', scheduleCountback);

  // ── CLOSE SETTINGS ──
  document.getElementById('close-secret-btn')
    .addEventListener('click', () => {
      applyAllSettings();
      saveSettings();
      if (targetShowing || clockInterval) {
        showScreen('screen-home');
      } else {
        // Start the entry fresh rather than resuming a half-typed passcode.
        clearPinEntry();
        showScreen('screen-pin');
        setPinDim(true);
      }
    });

  // ── LIVE SETTINGS CHANGE + SAVE ──
  document.getElementById('wallpaper-select')
    .addEventListener('change', () => { applyWallpaper(); saveSettings(); });
  document.getElementById('clock-color')
    .addEventListener('change', () => { applyClockColor(); saveSettings(); });
  document.getElementById('clock-style')
    .addEventListener('change', () => { applyClockColor(); saveSettings(); });
  // Redraw immediately rather than waiting for the next tick of the clock.
  document.getElementById('date-format')
    .addEventListener('change', () => {
      document.getElementById('clock-date').textContent = formatDate(new Date());
      saveSettings();
    });
  document.getElementById('glass-mode')
    .addEventListener('change', () => { applyGlassMode(); applyTorchLit(); saveSettings(); });
  document.getElementById('torch-lit')
    .addEventListener('change', () => { applyTorchLit(); saveSettings(); });
  document.getElementById('torch-glyph-mode')
    .addEventListener('change', () => { applyTorchLit(); saveSettings(); });
  // The percentage sliders wire themselves up inside buildLayoutControls().
  document.getElementById('clock-align')
    .addEventListener('change', () => { applyLayout(); saveSettings(); });
  document.getElementById('reset-layout-btn')
    .addEventListener('click', resetLayout);
  document.getElementById('statusbar-time')
    .addEventListener('change', () => { applyStatusTime(); saveSettings(); });
  document.getElementById('statusbar-icons')
    .addEventListener('change', () => { applyStatusIcons(); saveSettings(); });
  document.getElementById('home-indicator-toggle')
    .addEventListener('change', () => { applyHomeIndicator(); saveSettings(); });
  document.getElementById('battery-level-select')
    .addEventListener('change', () => { applyBatteryLevel(); saveSettings(); });
  document.getElementById('tap-direction')
    .addEventListener('change', saveSettings);
  document.getElementById('tap-unit')
    .addEventListener('change', saveSettings);
  document.getElementById('anim-speed')
    .addEventListener('change', saveSettings);
  document.getElementById('trigger-type')
    .addEventListener('change', saveSettings);

  // ── GALLERY PICKER ──
  document.getElementById('gallery-btn')
    .addEventListener('click', () => {
      document.getElementById('gallery-input').click();
    });
  document.getElementById('gallery-input')
    .addEventListener('change', (e) => {
      const file = e.target.files[0];
      // Reset so re-picking the same file fires 'change' again.
      e.target.value = '';
      if (!file) return;

      const status = document.getElementById('status-text');
      status.textContent = 'Processing photo…';

      prepareWallpaper(file)
        .then((dataUrl) => {
          setWallpaperBackground(dataUrl, true);
          const res = storeCustomWallpaper(dataUrl);
          // Report the outcome instead of failing silently, so a save problem
          // is visible now rather than discovered mid-performance.
          status.textContent = res.ok
            ? '✦ Wallpaper saved (' + res.kb + ' KB)'
            : '⚠ Applied but NOT saved: ' + (res.error.name || 'storage error');
        })
        .catch((err) => {
          status.textContent = '⚠ ' + err.message;
        });
    });

});
