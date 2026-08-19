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
 * The defaults are the real iOS lock screen measured on a 390x844 iPhone
 * 12/13/14 and converted, so out of the box this renders what it always did.
 *
 * TO ADD A TUNABLE, ADD ONE LINE HERE. The settings slider, the CSS variable,
 * the live readout, saving and restoring are all generated from this list.
 */
const LAYOUT_CONFIG = [
  { key: 'statusH',   css: '--status-h',   label: 'Status Bar Height',  axis: 'h', pct:  5.57, max: 15 },
  { key: 'clockGap',  css: '--clock-gap',  label: 'Clock Top Gap',      axis: 'h', pct:  5.57, max: 40 },
  { key: 'clockSide', css: '--clock-side', label: 'Clock Side Inset',   axis: 'w', pct:  6.67, max: 30 },
  { key: 'dateSize',  css: '--date-size',  label: 'Date Size',          axis: 'w', pct:  4.36, max: 10 },
  { key: 'timeSize',  css: '--time-size',  label: 'Clock Size',         axis: 'w', pct: 23.08, max: 45 },
  { key: 'bottomGap', css: '--bottom-gap', label: 'Buttons Bottom Gap', axis: 'h', pct:  2.61, max: 25 },
  { key: 'btnSize',   css: '--btn-size',   label: 'Button Size',        axis: 'w', pct: 13.33, max: 30 },
  { key: 'btnSide',   css: '--btn-side',   label: 'Buttons Side Inset', axis: 'w', pct: 10.26, max: 35 },
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

/* One slider per entry, so LAYOUT_CONFIG stays the only thing to edit. */
function buildLayoutControls() {
  const host = document.getElementById('layout-rows');
  if (!host || host.childElementCount) return;

  LAYOUT_CONFIG.forEach((c) => {
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
    slider.min   = '0';
    slider.max   = String(c.max);
    slider.step  = '0.01';
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
    host.appendChild(row);
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
 * The single place percentages become pixels. Re-runs on resize and rotation,
 * so the proportions survive the phone being turned.
 */
function applyLayout() {
  const root = document.documentElement.style;

  LAYOUT_CONFIG.forEach((c) => {
    const px = layoutBasis(c.axis) * layoutPct[c.key] / 100;
    root.setProperty(c.css, px.toFixed(2) + 'px');

    // Show the percentage and what it currently resolves to, so a figure can be
    // read off one phone and typed into another.
    const out = document.getElementById('out-' + c.key);
    if (out) {
      out.textContent = layoutPct[c.key].toFixed(2) + '% ';
      const px_ = document.createElement('span');
      px_.className = 'px';
      px_.textContent = '(' + Math.round(px) + 'px)';
      out.appendChild(px_);
    }
  });

  const align = document.getElementById('clock-align');
  if (align) root.setProperty('--clock-align', align.value);

  const info = document.getElementById('layout-info');
  if (info) {
    info.textContent =
      'viewport ' + Math.round(layoutBasis('w')) + '×' + Math.round(layoutBasis('h')) +
      '   device ' + screen.width + '×' + screen.height;
  }
}

/* Back to the measured iOS proportions, discarding any hand-tuning. */
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
    // One object holding every percentage, so adding a tunable needs no change
    // here at all.
    layout:     Object.assign({}, layoutPct),
    clockAlign: document.getElementById('clock-align').value,
    statusTime:  document.getElementById('statusbar-time').value,
    statusIcons: document.getElementById('statusbar-icons').value,
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

function applyClockColor() {
  const color = document.getElementById('clock-color').value;
  document.getElementById('clock-time').style.color = color;
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
  applyWallpaper();
  applyClockColor();
  applyStatusTime();
  applyStatusIcons();
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

function unlockToLockScreen() {
  stopRealClock();

  const now    = new Date();
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  document.getElementById('clock-date').textContent =
    days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();

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
  const days = [
    'Sunday','Monday','Tuesday','Wednesday',
    'Thursday','Friday','Saturday'
  ];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  document.getElementById('clock-date').textContent =
    days[now.getDay()] + ', ' +
    months[now.getMonth()] + ' ' +
    now.getDate();
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
    clockEl.style.opacity = '0.4';
    setTimeout(() => {
      clockEl.style.opacity = '1';
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
  // The percentage sliders wire themselves up inside buildLayoutControls().
  document.getElementById('clock-align')
    .addEventListener('change', () => { applyLayout(); saveSettings(); });
  document.getElementById('reset-layout-btn')
    .addEventListener('click', resetLayout);
  document.getElementById('statusbar-time')
    .addEventListener('change', () => { applyStatusTime(); saveSettings(); });
  document.getElementById('statusbar-icons')
    .addEventListener('change', () => { applyStatusIcons(); saveSettings(); });
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
