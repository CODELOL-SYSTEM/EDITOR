const $ = s => document.querySelector(s);
const c = new fabric.Canvas('cv', { preserveObjectStacking: true, backgroundColor: '#ffffff' });
const SIZES = { 'Instagram carré (1080×1080)': [1080, 1080], 'Story (1080×1920)': [1080, 1920], 'YouTube (1280×720)': [1280, 720], 'Affiche A4 (794×1123)': [794, 1123], 'Couverture Facebook (820×312)': [820, 312] };
const FONTS = ['Arial', 'Georgia', 'Impact', 'Courier New', 'Verdana', 'Times New Roman', 'Poppins', 'Montserrat', 'Roboto', 'Raleway', 'Oswald', 'Anton', 'Bebas Neue', 'Playfair Display', 'Abril Fatface', 'Cinzel', 'Lobster', 'Pacifico', 'Dancing Script', 'Satisfy', 'Caveat', 'Permanent Marker', 'Bangers', 'Righteous', 'Orbitron', 'Press Start 2P'];
const FI = ['br', 'ct', 'sa', 'bl', 'hu', 'wm', 'sp'];
const GRADS = [['#5b2be0', '#00b5ad'], ['#ff7a59', '#ffd166'], ['#0f2027', '#2c5364'], ['#f093fb', '#f5576c'], ['#a8e063', '#56ab2f'], ['#141e30', '#243b55']];
let W = 1080, H = 1080, fit = 1, hist = [], hi = -1, busy = false;
const act = () => c.getActiveObject();
Object.assign(fabric.Object.prototype, { cornerSize: 16, touchCornerSize: 44, transparentCorners: false, cornerStyle: 'circle', cornerColor: '#ffffff', cornerStrokeColor: '#5b2be0', borderColor: '#5b2be0', borderScaleFactor: 2, padding: 6 });

$('#size').innerHTML = Object.keys(SIZES).map(k => `<option>${k}</option>`).join('');
$('#font').innerHTML = FONTS.map(f => `<option style="font-family:'${f}'">${f}</option>`).join('');
$('#grad').innerHTML = GRADS.map((g, i) => `<span data-g="${i}" style="background:linear-gradient(135deg,${g[0]},${g[1]})"></span>`).join('');

function resize() {
  const s = $('#stage');
  fit = ZM || Math.min((s.clientWidth - 40) / W, (s.clientHeight - 40) / H);
  c.setZoom(fit);
  c.setDimensions({ width: W * fit, height: H * fit });
  c.renderAll();
}
function save() {
  if (busy) return;
  hist = hist.slice(0, hi + 1);
  hist.push(JSON.stringify(c));
  if (hist.length > 60) hist.shift();
  hi = hist.length - 1;
  autosave();
}
function load(j) {
  busy = true;
  c.loadFromJSON(j, () => { c.renderAll(); busy = false; sync(); fixFonts(); });
}
const undo = () => hi > 0 && load(hist[--hi]);
const redo = () => hi < hist.length - 1 && load(hist[++hi]);

function put(o) {
  o.set({ left: W / 2, top: H / 2, originX: 'center', originY: 'center' });
  c.add(o); c.setActiveObject(o); c.requestRenderAll();
}
function addImage(url) {
  fabric.Image.fromURL(url, img => {
    img.scale(Math.min(1, W * .8 / img.width, H * .8 / img.height));
    put(img);
  });
}
function readFile(f) {
  if (!f || !f.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = () => addImage(r.result);
  r.readAsDataURL(f);
}
function star() {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 90 : 200, a = Math.PI / 5 * i - Math.PI / 2;
    p.push({ x: 200 + r * Math.cos(a), y: 200 + r * Math.sin(a) });
  }
  return new fabric.Polygon(p, { fill: '#ffb703' });
}
const MAKE = {
  text: () => new fabric.IText('Votre texte', { fontSize: 90, fontFamily: 'Arial', fill: '#1b1f33' }),
  rect: () => new fabric.Rect({ width: 400, height: 300, fill: '#5b2be0' }),
  circle: () => new fabric.Circle({ radius: 180, fill: '#00b5ad' }),
  tri: () => new fabric.Triangle({ width: 360, height: 320, fill: '#ff6b6b' }),
  star,
  line: () => new fabric.Line([0, 0, 400, 0], { stroke: '#1b1f33', strokeWidth: 8 }),
  light: (col = '255,225,160') => { const o = new fabric.Circle({ radius: 300, isLight: true, lcol: col, lsoft: .6, globalCompositeOperation: 'screen' }); relight(o); return o; },
  vig: () => new fabric.Rect({ width: W, height: H, fill: new fabric.Gradient({ type: 'radial', coords: { x1: W / 2, y1: H / 2, r1: Math.min(W, H) * .25, x2: W / 2, y2: H / 2, r2: Math.hypot(W, H) / 2 }, colorStops: [{ offset: 0, color: 'rgba(0,0,0,0)' }, { offset: 1, color: 'rgba(0,0,0,.75)' }] }) })
};
document.querySelectorAll('nav [data-a]').forEach(b => b.onclick = () => {
  const a = b.dataset.a;
  if (a === 'img') $('#file').click(); else if (a === 'stk') $('#stk').hidden = !$('#stk').hidden; else if (a === 'tpl') $('#tpl').hidden = !$('#tpl').hidden; else if (a === 'draw') toggleDraw(); else put(MAKE[a]());
});
$('#file').onchange = e => { readFile(e.target.files[0]); e.target.value = ''; };
$('#stage').ondragover = e => e.preventDefault();
$('#stage').ondrop = e => { e.preventDefault(); [...e.dataTransfer.files].forEach(readFile); };
addEventListener('paste', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; const fs = [...(e.clipboardData?.files || [])]; if (fs.length) fs.forEach(readFile); else paste(); });

// Propriétés
function set(p) { const a = act(); if (!a) return; a.set(p); c.requestRenderAll(); }
[['fill', 'fill'], ['stroke', 'stroke'], ['sw', 'strokeWidth', 1], ['op', 'opacity', 1], ['fs', 'fontSize', 1]].forEach(([id, k, n]) => {
  const e = $('#' + id);
  e.oninput = () => set({ [k]: n ? +e.value : e.value });
  e.onchange = save;
});
function toggle(k, on, off) { const a = act(); if (a) { set({ [k]: a[k] === on ? off : on }); save(); } }
$('#bo').onclick = () => toggle('fontWeight', 'bold', 'normal');
$('#it').onclick = () => toggle('fontStyle', 'italic', 'normal');
$('#ul').onclick = () => toggle('underline', true, false);
document.querySelectorAll('[data-al]').forEach(b => b.onclick = () => { set({ textAlign: b.dataset.al }); save(); });
$('#fr').onclick = () => { const a = act(); if (a) { c.bringToFront(a); save(); } };
$('#bk').onclick = () => { const a = act(); if (a) { c.sendToBack(a); save(); } };
$('#fh').onclick = () => { const a = act(); if (a) { set({ flipX: !a.flipX }); save(); } };
const dup = () => { const a = act(); if (a) a.clone(cl => { cl.set({ left: a.left + 30, top: a.top + 30 }); c.add(cl); c.setActiveObject(cl); }); };
const del = () => { c.getActiveObjects().forEach(o => c.remove(o)); c.discardActiveObject(); c.requestRenderAll(); };
$('#dup').onclick = dup; $('#del').onclick = del;

// Filtres photo
function filters() {
  const a = act(); if (!a || a.type !== 'image') return;
  const v = id => +$('#' + id).value, F = fabric.Image.filters, L = [];
  if (v('br')) L.push(new F.Brightness({ brightness: v('br') }));
  if (v('ct')) L.push(new F.Contrast({ contrast: v('ct') }));
  if (v('sa')) L.push(new F.Saturation({ saturation: v('sa') }));
  if (v('bl')) L.push(new F.Blur({ blur: v('bl') }));
  if (v('hu')) L.push(new F.HueRotation({ rotation: v('hu') }));
  if (v('wm')) L.push(new F.Gamma({ gamma: [1 + v('wm') * .3, 1, 1 - v('wm') * .3] }));
  if (v('sp')) { const s = v('sp'); L.push(new F.Convolute({ opaque: true, matrix: [0, -s, 0, -s, 1 + 4 * s, -s, 0, -s, 0] })); }
  a.filters = L; a.applyFilters(); c.requestRenderAll();
}
FI.forEach(id => { $('#' + id).oninput = filters; $('#' + id).onchange = save; });
document.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => {
  const a = act(); if (!a || a.type !== 'image') return;
  FI.forEach(id => $('#' + id).value = 0);
  a.filters = b.dataset.pre ? [new fabric.Image.filters[b.dataset.pre]()] : [];
  a.applyFilters(); c.requestRenderAll(); save();
});

// Fond
$('#bg').oninput = e => c.setBackgroundColor(e.target.value, () => c.renderAll());
$('#bg').onchange = save;
$('#grad').onclick = e => {
  const g = GRADS[e.target.dataset.g]; if (!g) return;
  c.setBackgroundColor(new fabric.Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: W, y2: H }, colorStops: [{ offset: 0, color: g[0] }, { offset: 1, color: g[1] }] }), () => { c.renderAll(); save(); });
};

// Synchronise le panneau avec la sélection
function sync() {
  const a = act();
  $('#panel').dataset.t = a ? (a.isLight ? 'light' : a.type) : 'none';
  if (!a) return topbar();
  if (typeof a.fill === 'string' && a.fill[0] === '#') $('#fill').value = a.fill;
  if (typeof a.stroke === 'string' && a.stroke[0] === '#') $('#stroke').value = a.stroke;
  $('#sw').value = a.strokeWidth || 0;
  $('#sz').value = $('#wd').value = a.getScaledWidth() / W * 100; $('#ht').value = a.getScaledHeight() / H * 100; $('#rot').value = ((a.angle % 360) + 360) % 360;
  const bb = a.getBoundingRect(true, true); $('#nx').value = Math.round(bb.left); $('#ny').value = Math.round(bb.top); $('#nw').value = Math.round(a.getScaledWidth()); $('#nh').value = Math.round(a.getScaledHeight());
  $('#op').value = a.opacity;
  const sh = a.shadow; $('#shb').value = sh ? sh.blur : 0; $('#sho').value = sh ? sh.offsetX : 0; if (sh && /^#/.test(sh.color)) $('#shc').value = sh.color;
  if (a.type === 'i-text') { $('#fs').value = Math.round(a.fontSize); $('#font').value = a.fontFamily; }
  if (a.type === 'image') {
    FI.forEach(id => $('#' + id).value = 0);
    const M = { Brightness: ['br', 'brightness'], Contrast: ['ct', 'contrast'], Saturation: ['sa', 'saturation'], Blur: ['bl', 'blur'], HueRotation: ['hu', 'rotation'] };
    (a.filters || []).forEach(f => { const m = M[f.type]; if (m) $('#' + m[0]).value = f[m[1]]; if (f.type === 'Gamma') $('#wm').value = (f.gamma[0] - 1) / .3; if (f.type === 'Convolute') $('#sp').value = -f.matrix[1]; });
  }
  topbar();
}
c.on({ 'object:added': save, 'object:modified': save, 'object:removed': save, 'selection:created': sync, 'selection:updated': sync, 'selection:cleared': sync });

// Format, export, raccourcis
$('#size').onchange = e => { [W, H] = SIZES[e.target.value]; resize(); save(); };
$('#un').onclick = undo; $('#re').onclick = redo;
$('#exp').onclick = () => {
  c.discardActiveObject(); c.renderAll();
  const f = $('#fmt').value, a = document.createElement('a');
  a.href = c.toDataURL({ format: f, quality: .95, multiplier: 1 / fit });
  a.download = 'creation.' + (f === 'jpeg' ? 'jpg' : 'png');
  a.click();
};
onkeydown = e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || (act() && act().isEditing)) return;
  const k = e.key.toLowerCase(), m = e.ctrlKey || e.metaKey;
  if (k === 'delete' || k === 'backspace') del();
  else if (m && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (m && k === 'y') redo();
  else if (m && k === 'd') { e.preventDefault(); dup(); }
};
onresize = resize;

// Démarrage : reprend le dernier travail enregistré
let saved = null;
try { saved = JSON.parse(localStorage.getItem('crea')); } catch (e) { /* ignore */ }
if (saved) {
  W = saved.W; H = saved.H;
  const k = Object.keys(SIZES).find(k => SIZES[k][0] === W && SIZES[k][1] === H);
  if (k) $('#size').value = k;
  resize(); load(saved.j); hist = [saved.j]; hi = 0;
} else {
  resize();
  const t = MAKE.text(); t.set({ text: 'Bienvenue sur Créa', fontSize: 110 }); put(t);
}

// ---- Polices, ombres, néon ----
function fixFonts() {
  c.getObjects().forEach(o => {
    if (o.type === 'i-text') document.fonts.load(`40px "${o.fontFamily}"`).then(() => { o.initDimensions(); o.setCoords(); c.requestRenderAll(); });
  });
}
$('#font').onchange = e => {
  const v = e.target.value;
  document.fonts.load(`40px "${v}"`).then(() => { const a = act(); if (!a) return; a.set('fontFamily', v); a.initDimensions(); c.requestRenderAll(); save(); });
};
function shadow() {
  const a = act(); if (!a) return;
  const b = +$('#shb').value, o = +$('#sho').value;
  a.set('shadow', b || o ? new fabric.Shadow({ color: $('#shc').value, blur: b, offsetX: o, offsetY: o }) : null);
  c.requestRenderAll();
}
['shc', 'shb', 'sho'].forEach(id => { $('#' + id).oninput = shadow; $('#' + id).onchange = save; });
$('#neon').onclick = () => {
  const a = act(); if (!a) return;
  if (a.type === 'i-text') a.set('fill', '#ffffff');
  $('#shb').value = 45; $('#sho').value = 0; shadow(); save();
};

// ---- Enlever l'arrière-plan ----
const msg = t => $('#msg').textContent = t;
const srcSize = a => { const s = a._originalElement; return [s.naturalWidth || s.width, s.naturalHeight || s.height]; };
function cutout(a, px, py) {
  const [w, h] = srcSize(a), cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(a._originalElement, 0, 0);
  const d = x.getImageData(0, 0, w, h), p = d.data, i0 = (py * w + px) * 4;
  const r = p[i0], g = p[i0 + 1], b = p[i0 + 2], tol = +$('#tol').value * 1.73;
  const near = i => p[i + 3] > 0 && Math.hypot(p[i] - r, p[i + 1] - g, p[i + 2] - b) <= tol;
  if ($('#glob').checked) {
    for (let i = 0; i < p.length; i += 4) if (near(i)) p[i + 3] = 0;
  } else {
    const seen = new Uint8Array(w * h), st = [py * w + px];
    seen[st[0]] = 1;
    while (st.length) {
      const k = st.pop(), i = k * 4;
      if (!near(i)) continue;
      p[i + 3] = 0;
      const X = k % w;
      if (X > 0 && !seen[k - 1]) { seen[k - 1] = 1; st.push(k - 1); }
      if (X < w - 1 && !seen[k + 1]) { seen[k + 1] = 1; st.push(k + 1); }
      if (k >= w && !seen[k - w]) { seen[k - w] = 1; st.push(k - w); }
      if (k < w * (h - 1) && !seen[k + w]) { seen[k + w] = 1; st.push(k + w); }
    }
  }
  x.putImageData(d, 0, 0);
  a.setSrc(cv.toDataURL('image/png'), () => { c.requestRenderAll(); save(); });
}
let pick = false;
$('#pk').onclick = () => {
  const a = act(); if (!a || a.type !== 'image') return msg('Sélectionnez d\u2019abord une photo.');
  pick = true; c.defaultCursor = c.hoverCursor = 'crosshair';
  msg('Cliquez sur la couleur du fond à enlever.');
};
c.on('mouse:down', o => {
  if (!pick) return;
  pick = false; c.defaultCursor = 'default'; c.hoverCursor = 'move';
  const a = act(); if (!a || a.type !== 'image') return;
  const pt = a.toLocalPoint(c.getPointer(o.e), 'center', 'center');
  const px = Math.round(pt.x + a.width / 2), py = Math.round(pt.y + a.height / 2);
  if (px < 0 || py < 0 || px >= a.width || py >= a.height) return msg('Cliquez sur la photo.');
  msg('Découpe en cours…');
  setTimeout(() => { cutout(a, px, py); msg('Fait. Ctrl+Z pour annuler, ou recommencez pour enlever d\u2019autres zones.'); }, 30);
});
$('#ai').onclick = async () => {
  const a = act(); if (!a || a.type !== 'image') return msg('Sélectionnez d\u2019abord une photo.');
  msg('Chargement de l\u2019IA (la première fois, environ 40 Mo)…');
  try {
    const { removeBackground } = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
    const [w, h] = srcSize(a), cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(a._originalElement, 0, 0);
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    const out = await removeBackground(blob, { progress: (k, i, n) => msg('IA : ' + Math.round(i / n * 100) + ' %') });
    const url = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(out); });
    a.setSrc(url, () => { c.requestRenderAll(); save(); msg('Fond enlevé.'); });
  } catch (e) {
    msg('L\u2019IA n\u2019a pas pu se charger (connexion ?). Utilisez la gomme couleur.');
  }
};

// ---- Stickers ----
const EMO = '😀 😂 😍 😎 🥳 😭 🔥 ✨ ⭐ 🌟 💫 ⚡ 💥 🎉 🎈 🎁 ❤️ 💜 💙 💚 🧡 💛 🖤 🤍 👍 👏 🙌 💪 🌈 ☀️ 🌙 ☁️ ❄️ 🌸 🌹 🍀 🦋 🐱 🐶 🦄 🍕 🍔 🎵 🎧 📷 🚀 💎 👑 🏆 ✅ ❌ ➡️ ⬆️ 💬 🎯'.split(' ');
const LIGHTS = [['255,225,160', 'Halo chaud'], ['255,255,255', 'Halo blanc'], ['120,190,255', 'Halo bleu'], ['255,130,200', 'Halo rose']];
$('#stk').innerHTML = '<h5>Lumières</h5>' + LIGHTS.map(l => `<button data-l="${l[0]}" title="${l[1]}" style="background:radial-gradient(circle,rgb(${l[0]}),rgba(${l[0]},0) 70%),#1b1f33"></button>`).join('')
  + '<h5>Stickers</h5>' + EMO.map(e => `<button data-e="${e}">${e}</button>`).join('');
$('#stk').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.s) put(MAKE[b.dataset.s]());
  else if (b.dataset.l) put(MAKE.light(b.dataset.l));
  else put(new fabric.IText(b.dataset.e, { fontSize: 240, fontFamily: 'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif' }));
  $('#stk').hidden = true;
};
c.on('mouse:down', () => { $('#stk').hidden = true; $('#tpl').hidden = true; });

// ---- Taille et forme ----
const dim = fn => e => { const a = act(); if (!a) return; fn(a, +e.target.value); a.setCoords(); c.requestRenderAll(); };
$('#sz').oninput = dim((a, v) => { a.scaleToWidth(v / 100 * W); $('#wd').value = v; $('#ht').value = a.getScaledHeight() / H * 100; });
$('#wd').oninput = dim((a, v) => a.set('scaleX', v / 100 * W / (a.width || 1)));
$('#ht').oninput = dim((a, v) => a.set('scaleY', v / 100 * H / (a.height || 1)));
$('#rot').oninput = dim((a, v) => a.rotate(v));
['sz', 'wd', 'ht', 'rot'].forEach(id => $('#' + id).onchange = save);
const grow = k => () => { const a = act(); if (!a) return; a.set({ scaleX: a.scaleX * k, scaleY: a.scaleY * k }); a.setCoords(); c.requestRenderAll(); save(); sync(); };
$('#plus').onclick = grow(1.15); $('#minus').onclick = grow(1 / 1.15);
c.on({ 'object:scaling': sync, 'object:rotating': sync });

// ---- Nouvelles formes ----
Object.assign(MAKE, {
  heart: () => new fabric.Path('M 100 180 C -60 60 40 -30 100 50 C 160 -30 260 60 100 180 Z', { fill: '#ff4d6d', scaleX: 2, scaleY: 2 }),
  hex: () => new fabric.Polygon([0, 1, 2, 3, 4, 5].map(i => ({ x: 200 + 190 * Math.cos(Math.PI / 3 * i), y: 200 + 190 * Math.sin(Math.PI / 3 * i) })), { fill: '#22d3ee' }),
  arrow: () => new fabric.Path('M 0 60 L 200 60 L 200 0 L 320 100 L 200 200 L 200 140 L 0 140 Z', { fill: '#8b5cf6' }),
  bubble: () => new fabric.Path('M 20 0 H 300 Q 320 0 320 20 V 160 Q 320 180 300 180 H 120 L 60 240 L 70 180 H 20 Q 0 180 0 160 V 20 Q 0 0 20 0 Z', { fill: '#ffffff', stroke: '#1b1f33', strokeWidth: 6, scaleX: 1.5, scaleY: 1.5 }),
  rr: () => new fabric.Rect({ width: 420, height: 300, rx: 50, ry: 50, fill: '#f97316' }),
  ring: () => new fabric.Circle({ radius: 160, fill: 'transparent', stroke: '#8b5cf6', strokeWidth: 30 })
});
$('#stk').insertAdjacentHTML('afterbegin', '<h5>Formes</h5>' + [['heart', '❤'], ['hex', '⬢'], ['arrow', '➤'], ['bubble', '💬'], ['rr', '▢'], ['ring', '◯']].map(s => `<button data-s="${s[0]}">${s[1]}</button>`).join(''));

// ---- Modèles ----
const EF = 'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif';
const T = (s, y, o) => () => new fabric.IText(s, Object.assign({ left: W / 2, top: H * y, originX: 'center', originY: 'center', textAlign: 'center', fontFamily: 'Poppins', fill: '#fff', fontSize: 90 }, o));
const grd = (a, b) => new fabric.Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: W, y2: H }, colorStops: [{ offset: 0, color: a }, { offset: 1, color: b }] });
const TPLS = [
  ['Citation', 1080, 1080, '#1e1b4b', '#7c3aed', [T('“', .2, { fontSize: 320, fontFamily: 'Playfair Display', fill: '#c4b5fd' }), T('Rêve grand,\ncommence petit.', .5, { fontSize: 100, fontFamily: 'Playfair Display' }), T('— Ton nom', .82, { fontSize: 44, fontFamily: 'Raleway', fill: '#ddd6fe' })]],
  ['Promo', 1080, 1080, '#ff512f', '#f09819', [T('SOLDES', .18, { fontSize: 120, fontFamily: 'Bebas Neue' }), T('-50%', .46, { fontSize: 300, fontFamily: 'Anton' }), () => new fabric.Rect({ left: W / 2, top: H * .78, originX: 'center', originY: 'center', width: 560, height: 120, rx: 60, ry: 60, fill: '#fff' }), T('J\'EN PROFITE', .78, { fontSize: 50, fontWeight: 'bold', fill: '#ff512f' })]],
  ['Anniversaire', 1080, 1920, '#f093fb', '#f5576c', [T('🎉', .2, { fontSize: 300, fontFamily: EF }), T('JOYEUX\nANNIVERSAIRE', .47, { fontSize: 130, fontFamily: 'Lobster' }), T('🎈 🎂 🎁', .74, { fontSize: 130, fontFamily: EF })]],
  ['YouTube', 1280, 720, '#0f2027', '#2c5364', [T('TITRE QUI\nFAIT CLIQUER', .5, { fontSize: 150, fontFamily: 'Anton', fill: '#fde047', shadow: new fabric.Shadow({ color: '#000', blur: 20, offsetX: 6, offsetY: 6 }) })]],
  ['Concert', 794, 1123, '#000000', '#3b0764', [T('LIVE', .22, { fontSize: 280, fontFamily: 'Bebas Neue', shadow: new fabric.Shadow({ color: '#22d3ee', blur: 40 }) }), T('SAMEDI • 20H', .5, { fontSize: 60, fontFamily: 'Orbitron' }), T('Salle des fêtes', .6, { fontSize: 40, fontFamily: 'Raleway', fill: '#c4b5fd' })]],
  ['Titre simple', 1080, 1080, '#ffffff', '#e0e7ff', [T('Votre titre', .5, { fontSize: 120, fontFamily: 'Montserrat', fontWeight: 'bold', fill: '#1b1f33' })]]
];
$('#tpl').innerHTML = TPLS.map((t, i) => `<button data-t="${i}" style="background:linear-gradient(135deg,${t[3]},${t[4]})">${t[0]}</button>`).join('');
$('#tpl').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  const [, w, h, c1, c2, items] = TPLS[b.dataset.t];
  busy = true; W = w; H = h; c.clear(); resize();
  c.setBackgroundColor(grd(c1, c2), () => {});
  items.forEach(f => c.add(f()));
  busy = false; c.discardActiveObject(); c.renderAll(); save(); fixFonts(); layers();
  const k = Object.keys(SIZES).find(k => SIZES[k][0] === w && SIZES[k][1] === h); if (k) $('#size').value = k;
  $('#tpl').hidden = true;
};

// ---- Calques ----
const NAMES = { 'i-text': 'Texte', image: 'Photo', rect: 'Rectangle', circle: 'Cercle', triangle: 'Triangle', line: 'Ligne', polygon: 'Forme', path: 'Forme / dessin' };
function layers() {
  const all = c.getObjects();
  $('#lay').innerHTML = all.map((o, i) => `<div class="ly${o === act() ? ' on' : ''}" data-i="${i}"><span>${(NAMES[o.type] || o.type) + (o.type === 'i-text' ? ' : ' + (o.text || '').replace(/\n/g, ' ').slice(0, 14) : '')}</span><b data-k="v">${o.visible === false ? '🚫' : '👁'}</b><b data-k="l">${o.lockMovementX ? '🔒' : '🔓'}</b></div>`).reverse().join('') || '<p style="color:var(--mut)">Aucun élément</p>';
}
$('#lay').onclick = e => {
  const d = e.target.closest('.ly'); if (!d) return;
  const o = c.getObjects()[+d.dataset.i], k = e.target.dataset.k;
  if (k === 'v') { o.visible = o.visible === false; c.discardActiveObject(); }
  else if (k === 'l') { const l = !o.lockMovementX; o.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, hasControls: !l }); }
  else c.setActiveObject(o);
  c.requestRenderAll(); layers(); save();
};
c.on({ 'object:added': layers, 'object:removed': layers, 'object:modified': layers, 'selection:created': layers, 'selection:updated': layers, 'selection:cleared': layers });
layers();

// ---- Alignement ----
document.querySelectorAll('[data-ag]').forEach(b => b.onclick = () => {
  const a = act(); if (!a) return;
  const k = b.dataset.ag, w = a.getScaledWidth(), h = a.getScaledHeight();
  const ox = a.originX === 'center' ? w / 2 : 0, oy = a.originY === 'center' ? h / 2 : 0;
  if (k === 'h') a.set('left', W / 2 - w / 2 + ox);
  if (k === 'v') a.set('top', H / 2 - h / 2 + oy);
  if (k === 'l') a.set('left', ox);
  if (k === 'r') a.set('left', W - w + ox);
  if (k === 't') a.set('top', oy);
  if (k === 'b') a.set('top', H - h + oy);
  a.setCoords(); c.requestRenderAll(); save();
});

// ---- Forme de la photo ----
const MASK = {
  circle: a => new fabric.Circle({ radius: Math.min(a.width, a.height) / 2, originX: 'center', originY: 'center' }),
  round: a => { const r = Math.min(a.width, a.height) * .15; return new fabric.Rect({ width: a.width, height: a.height, rx: r, ry: r, originX: 'center', originY: 'center' }); },
  heart: a => { const p = new fabric.Path('M 100 180 C -60 60 40 -30 100 50 C 160 -30 260 60 100 180 Z', { originX: 'center', originY: 'center' }); p.scale(Math.min(a.width, a.height) / 190); return p; }
};
document.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => {
  const a = act(); if (!a || a.type !== 'image') return;
  a.clipPath = b.dataset.mk ? MASK[b.dataset.mk](a) : null;
  a.dirty = true; c.requestRenderAll(); save();
});

// ---- Styles de texte ----
document.querySelectorAll('[data-ts]').forEach(b => b.onclick = () => {
  const a = act(); if (!a || a.type !== 'i-text') return;
  const k = b.dataset.ts;
  a.set({ stroke: null, strokeWidth: 0, textBackground: '', shadow: null });
  if (k === 'out') a.set({ fill: '#ffffff', stroke: '#1b1f33', strokeWidth: 6, paintFirst: 'stroke' });
  if (k === 'hl') a.set({ fill: '#1b1f33', textBackground: '#fde047' });
  if (k === 'gr') a.set('fill', new fabric.Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: a.width, y2: 0 }, colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: .5, color: '#8b5cf6' }, { offset: 1, color: '#f43f5e' }] }));
  if (k === 'no') a.set('fill', '#1b1f33');
  c.requestRenderAll(); save();
});

// ---- Dessin libre ----
function toggleDraw() {
  c.isDrawingMode = !c.isDrawingMode;
  if (c.isDrawingMode) { c.freeDrawingBrush = new fabric.PencilBrush(c); brush(); c.discardActiveObject(); }
  document.querySelector('[data-a=draw]').classList.toggle('on', c.isDrawingMode);
}
function brush() { if (c.freeDrawingBrush) { c.freeDrawingBrush.color = $('#bc').value; c.freeDrawingBrush.width = +$('#bw').value; } }
$('#bc').oninput = $('#bw').oninput = brush;

// ---- Barre de réglages du haut : lumière, photo, lueur ----
fabric.Object.prototype.toObject = (f => function (p) { return f.call(this, ['isLight', 'lcol', 'lsoft'].concat(p || [])); })(fabric.Object.prototype.toObject);
const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)).join(',');
const hex = (...v) => '#' + v.map(n => (+n).toString(16).padStart(2, '0')).join('');
function relight(a) {
  const r = a.radius, col = a.lcol, s = a.lsoft;
  a.set('fill', new fabric.Gradient({ type: 'radial', coords: { x1: r, y1: r, r1: 0, x2: r, y2: r, r2: r }, colorStops: [{ offset: 0, color: `rgba(${col},1)` }, { offset: (1 - s) * .6, color: `rgba(${col},.9)` }, { offset: 1, color: `rgba(${col},0)` }] }));
  a.dirty = true; c.requestRenderAll();
}
function topbar() {
  const a = act();
  $('#top').dataset.t = !a ? 'none' : a.isLight ? 'light' : a.type;
  if (!a) return;
  if (a.isLight) {
    $('#lc').value = hex(...a.lcol.split(',')); $('#lb').value = a.opacity; $('#ls').value = a.lsoft;
    $('#lz').value = a.getScaledWidth() / W * 100; $('#lm').value = a.globalCompositeOperation;
  }
  ['br', 'ct', 'sa'].forEach(k => $('#t' + k).value = $('#' + k).value);
  const s = a.shadow; $('#tgb').value = s ? s.blur : 0;
  if (s) {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(s.color);
    if (m) { $('#tgc').value = hex(m[1], m[2], m[3]); $('#tga').value = m[4] === undefined ? 1 : m[4]; }
    else if (/^#/.test(s.color)) $('#tgc').value = s.color;
  }
}
const lt = fn => e => { const a = act(); if (!a || !a.isLight) return; fn(a, e.target.value); c.requestRenderAll(); };
$('#lc').oninput = lt((a, v) => { a.lcol = rgb(v); relight(a); });
$('#ls').oninput = lt((a, v) => { a.lsoft = +v; relight(a); });
$('#lb').oninput = lt((a, v) => a.set('opacity', +v));
$('#lz').oninput = lt((a, v) => { a.scaleToWidth(v / 100 * W); a.setCoords(); });
$('#lm').onchange = lt((a, v) => { a.set('globalCompositeOperation', v); save(); });
['lc', 'ls', 'lb', 'lz'].forEach(id => $('#' + id).onchange = save);
['br', 'ct', 'sa'].forEach(k => { $('#t' + k).oninput = e => { $('#' + k).value = e.target.value; filters(); }; $('#t' + k).onchange = save; });
function glow() {
  const a = act(); if (!a) return;
  const b = +$('#tgb').value, al = +$('#tga').value;
  a.set('shadow', b && al ? new fabric.Shadow({ color: `rgba(${rgb($('#tgc').value)},${al})`, blur: b, offsetX: 0, offsetY: 0 }) : null);
  c.requestRenderAll();
}
['tgc', 'tga', 'tgb'].forEach(id => { $('#' + id).oninput = glow; $('#' + id).onchange = save; });
topbar();

// ================= PROJETS, PAGES, EXPORT, ACCUEIL =================
var cp = null, pages = [], cur = 0, ZM = 0, clip = null, tAS, showK;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; $('#toasts').append(t); setTimeout(() => t.remove(), 3200); }

// Thème clair / sombre
try { document.documentElement.dataset.theme = localStorage.getItem('crea-th') || 'light'; } catch (e) { document.documentElement.dataset.theme = 'light'; }
$('#th').onclick = $('#hth').onclick = () => {
  const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('crea-th', t); } catch (e) { /* ignore */ }
};

// Base de données locale (IndexedDB)
const DB = {
  open: () => new Promise((ok, ko) => { const r = indexedDB.open('crea', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }),
  async tx(m, f) { const d = await this.open(); return new Promise((ok, ko) => { const t = d.transaction('p', m), q = f(t.objectStore('p')); t.oncomplete = () => ok(q && q.result); t.onerror = () => ko(t.error); }); },
  put(p) { return this.tx('readwrite', s => s.put(p)); },
  all() { return this.tx('readonly', s => s.getAll()); },
  del(id) { return this.tx('readwrite', s => s.delete(id)); }
};
const snap = () => { pages[cur] = Object.assign(pages[cur] || {}, { j: JSON.stringify(c), W, H }); };
function autosave(now) {
  if (!cp) return;
  $('#st').textContent = 'Enregistrement…';
  clearTimeout(tAS);
  tAS = setTimeout(async () => {
    try {
      snap(); pages[cur].t = c.toDataURL({ format: 'jpeg', quality: .5, multiplier: 160 / c.getWidth() });
      Object.assign(cp, { pages, cur, name: $('#pname').value || 'Sans titre', modified: Date.now(), thumb: pages[0].t });
      await DB.put(cp); $('#st').textContent = 'Enregistré'; renderBar(); if (now) toast('Projet enregistré');
    } catch (e) { $('#st').textContent = 'Erreur de sauvegarde'; }
  }, now ? 0 : 700);
}
$('#pname').oninput = () => autosave();
function sizeSel() {
  const k = Object.keys(SIZES).find(k => SIZES[k][0] === W && SIZES[k][1] === H);
  if (k) return $('#size').value = k;
  const l = `${W} × ${H}`; SIZES[l] = [W, H];
  $('#size').insertAdjacentHTML('beforeend', `<option>${l}</option>`); $('#size').value = l;
}

// Pages
function renderBar() {
  $('#pgs').innerHTML = pages.map((p, i) => `<div class="pg${i === cur ? ' on' : ''}" data-i="${i}" title="Page ${i + 1}">${p.t && /^data:image\//.test(p.t) ? `<img alt="" src="${p.t}">` : ''}<i>${i + 1}</i></div>`).join('');
}
function gotoPage(i, ns) {
  if (!ns) snap();
  cur = i; const p = pages[i]; W = p.W; H = p.H; sizeSel(); ZM = 0; $('#zs').value = '0'; resize();
  busy = true;
  c.loadFromJSON(p.j, () => { c.renderAll(); busy = false; hist = [p.j]; hi = 0; sync(); fixFonts(); layers(); renderBar(); });
}
$('#pgs').onclick = e => { const g = e.target.closest('.pg'); if (g && +g.dataset.i !== cur) { gotoPage(+g.dataset.i); autosave(); } };
$('#pgadd').onclick = () => { snap(); const o = JSON.parse(pages[cur].j); o.objects = []; pages.splice(cur + 1, 0, { j: JSON.stringify(o), W, H }); gotoPage(cur + 1); autosave(); };
$('#pgdup').onclick = () => { snap(); pages.splice(cur + 1, 0, Object.assign({}, pages[cur])); gotoPage(cur + 1); autosave(); };
$('#pgdel').onclick = () => { if (pages.length < 2) return toast('Un projet doit garder au moins une page'); pages.splice(cur, 1); gotoPage(Math.min(cur, pages.length - 1), true); autosave(); };
const mv = d => { const j = cur + d; if (j < 0 || j >= pages.length) return; snap(); [pages[cur], pages[j]] = [pages[j], pages[cur]]; cur = j; renderBar(); autosave(); };
$('#pgl').onclick = () => mv(-1); $('#pgr').onclick = () => mv(1);
$('#zs').onchange = e => { ZM = +e.target.value; resize(); };
$('#gr').onclick = () => $('#stage').classList.toggle('grid');

// Nouveau projet / ouverture
function newDoc(name, w, h, bg, n) {
  W = Math.round(w); H = Math.round(h);
  if (W > 8000 || H > 8000) return toast('Taille maximale : 8000 px');
  busy = true; c.clear(); c.setBackgroundColor(bg, () => {}); ZM = 0; $('#zs').value = '0'; resize(); c.renderAll(); busy = false;
  const empty = JSON.stringify(c);
  pages = Array.from({ length: n }, () => ({ j: empty, W, H })); cur = 0; hist = [empty]; hi = 0;
  cp = { v: 1, id: uid(), name, created: Date.now(), modified: Date.now(), pages, cur: 0 };
  $('#pname').value = name; sizeSel(); $('#home').hidden = true; sync(); layers(); renderBar(); autosave(true);
}
function openProject(p) { cp = p; pages = p.pages; $('#pname').value = p.name; $('#home').hidden = true; gotoPage(Math.min(p.cur || 0, pages.length - 1), true); }
function applyTpl(i) {
  const [, w, h, c1, c2, items] = TPLS[i];
  busy = true; W = w; H = h; c.clear(); resize(); c.setBackgroundColor(grd(c1, c2), () => {});
  items.forEach(f => c.add(f())); busy = false; c.discardActiveObject(); c.renderAll(); sizeSel(); save(); fixFonts(); layers();
}
$('#tpl').onclick = e => { const b = e.target.closest('button'); if (b) { applyTpl(+b.dataset.t); $('#tpl').hidden = true; } };

// Accueil
const FORMATS = [['Publication Instagram', 1080, 1080], ['Story / TikTok', 1080, 1920], ['Miniature YouTube', 1280, 720], ['Bannière YouTube', 2560, 1440], ['Couverture Facebook', 820, 312], ['Bannière LinkedIn', 1584, 396], ['Présentation 16:9', 1920, 1080], ['Affiche A4', 794, 1123], ['Logo', 500, 500], ['Personnalisé…', 0, 0]];
$('#hf').innerHTML = FORMATS.map(f => { const k = 60 / Math.max(f[1], f[2], 1); return `<div class="hc" tabindex="0" data-n="${f[0]}" data-f="${f[1]}x${f[2]}"><div class="th">${f[1] ? `<div style="width:${f[1] * k}px;height:${f[2] * k}px;background:linear-gradient(135deg,var(--t),var(--v));border-radius:4px"></div>` : '＋'}</div><span>${f[0]}</span><small>${f[1] ? f[1] + ' × ' + f[2] + ' px' : 'Taille libre'}</small></div>`; }).join('');
$('#ht').innerHTML = TPLS.map((t, i) => `<div class="hc" tabindex="0" data-t="${i}"><div class="th" style="background:linear-gradient(135deg,${t[3]},${t[4]});color:#fff;font-weight:700">${t[0]}</div><span>${t[0]}</span><small>${t[1]} × ${t[2]} px</small></div>`).join('');
async function recents() {
  let L = []; try { L = (await DB.all()).sort((a, b) => b.modified - a.modified); } catch (e) { toast('Stockage local indisponible'); }
  $('#hr').innerHTML = L.map(p => `<div class="hc" tabindex="0" data-id="${esc(p.id)}"><div class="th" ${/^data:image\//.test(p.thumb || '') ? `style="background-image:url('${p.thumb}')"` : ''}></div><span>${esc(p.name)}</span><small>${new Date(p.modified).toLocaleDateString('fr-FR')} · ${p.pages.length} page${p.pages.length > 1 ? 's' : ''} <button class="b" data-del="${esc(p.id)}" title="Supprimer" aria-label="Supprimer">🗑</button></small></div>`).join('') || '<p style="color:var(--mut)">Aucun projet pour le moment.</p>';
}
function showHome() { if (cp) autosave(true); recents(); $('#hb').hidden = !cp; $('#home').hidden = false; }
$('#logo').onclick = showHome; $('#hb').onclick = () => $('#home').hidden = true;
$('#hs').oninput = e => { const q = e.target.value.toLowerCase(); document.querySelectorAll('#home .hc').forEach(x => x.hidden = !x.textContent.toLowerCase().includes(q)); };
$('#home').onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('hc')) e.target.click(); };
$('#home').onclick = async e => {
  const d = e.target.closest('[data-del]');
  if (d) { if (confirm('Supprimer ce projet définitivement ?')) { await DB.del(d.dataset.del); recents(); toast('Projet supprimé'); } return; }
  const x = e.target.closest('.hc'); if (!x) return;
  if (x.dataset.f !== undefined) { const [w, h] = x.dataset.f.split('x').map(Number); if (!w) $('#newm').hidden = false; else newDoc(x.dataset.n, w, h, '#ffffff', 1); }
  else if (x.dataset.t !== undefined) { const t = TPLS[x.dataset.t]; newDoc(t[0], t[1], t[2], '#ffffff', 1); applyTpl(+x.dataset.t); }
  else if (x.dataset.id) { const p = (await DB.all()).find(q => q.id === x.dataset.id); if (p) openProject(p); }
};
$('#nok').onclick = () => {
  let w = +$('#nw2').value * +$('#nu').value, h = +$('#nh2').value * +$('#nu').value; const o = $('#no').value;
  if (o === 's') h = w; else if (o === 'p' && w > h) [w, h] = [h, w]; else if (o === 'l' && h > w) [w, h] = [h, w];
  if (!(w > 0 && h > 0)) return toast('Dimensions invalides');
  newDoc($('#nn').value || 'Sans titre', w, h, $('#nb').value, Math.max(1, Math.min(30, +$('#npg').value || 1)));
  $('#newm').hidden = true;
};
$('#nno').onclick = () => $('#newm').hidden = true;

// Import (PNG, JPG, WEBP, SVG nettoyé, projet JSON)
function readFile(f) {
  if (!f) return;
  if (f.size > 25e6) return toast('Fichier trop lourd (25 Mo max)');
  const r = new FileReader(), n = f.name.toLowerCase();
  if (n.endsWith('.json')) {
    r.onload = () => { try { const o = JSON.parse(r.result); if (!Array.isArray(o.pages) || !o.pages.every(p => typeof p.j === 'string' && +p.W > 0 && +p.H > 0)) throw 0; openProject({ v: 1, id: uid(), name: String(o.name || 'Importé'), created: Date.now(), modified: Date.now(), pages: o.pages, cur: 0 }); autosave(true); } catch (e) { toast('Projet JSON invalide'); } };
    r.readAsText(f);
  } else if (f.type === 'image/svg+xml' || n.endsWith('.svg')) {
    r.onload = () => {
      const s = String(r.result).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '').replace(/javascript:/gi, '');
      fabric.loadSVGFromString(s, (o, op) => { if (!o.length) return toast('SVG illisible'); const g = fabric.util.groupSVGElements(o, op); g.scale(Math.min(1, W * .6 / g.width, H * .6 / g.height)); put(g); toast('SVG importé'); });
    };
    r.readAsText(f);
  } else if (/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) { r.onload = () => { addImage(r.result); toast('Image importée'); }; r.readAsDataURL(f); }
  else toast('Format non compatible');
}

// Export (PNG, JPG, SVG, PDF, JSON ; page actuelle ou toutes)
function renderPage(p, fmt, sc, q, transp) {
  return new Promise(ok => {
    const s = new fabric.StaticCanvas(null, { width: p.W, height: p.H });
    s.loadFromJSON(p.j, () => { if (transp && fmt === 'png') s.backgroundColor = null; s.renderAll(); ok(fmt === 'svg' ? s.toSVG() : s.toDataURL({ format: fmt, multiplier: sc, quality: q })); s.dispose(); });
  });
}
$('#exp').onclick = () => $('#exm').hidden = false;
$('#xno').onclick = () => $('#exm').hidden = true;
$('#xok').onclick = async () => {
  const f = $('#xf').value, sc = +$('#xs').value, all = $('#xp').value === 'a', tr = $('#xt').checked;
  snap(); const name = ($('#pname').value || 'creation').replace(/[^\w\- ]+/g, '');
  const dl = (href, fn) => { const a = document.createElement('a'); a.href = href; a.download = fn; a.click(); };
  try {
    if (f === 'json') dl(URL.createObjectURL(new Blob([JSON.stringify({ v: 1, name: $('#pname').value, pages })], { type: 'application/json' })), name + '.json');
    else {
      const L = all ? pages : [pages[cur]];
      if (f === 'pdf') {
        if (!window.jspdf) throw Error('PDF indisponible (connexion requise)');
        let d;
        for (let i = 0; i < L.length; i++) {
          const p = L[i], img = await renderPage(p, 'jpeg', sc, .95), o = p.W >= p.H ? 'l' : 'p';
          if (i === 0) d = new window.jspdf.jsPDF({ unit: 'px', format: [p.W, p.H], orientation: o, hotfixes: ['px_scaling'] }); else d.addPage([p.W, p.H], o);
          d.addImage(img, 'JPEG', 0, 0, p.W, p.H);
        }
        d.save(name + '.pdf');
      } else for (let i = 0; i < L.length; i++) {
        const r = await renderPage(L[i], f, sc, .95, tr);
        dl(f === 'svg' ? URL.createObjectURL(new Blob([r], { type: 'image/svg+xml' })) : r, name + (L.length > 1 ? '-' + (i + 1) : '') + '.' + (f === 'jpeg' ? 'jpg' : f));
      }
    }
    toast('Export terminé');
  } catch (e) { toast('Erreur d\u2019export : ' + e.message); }
  $('#exm').hidden = true;
};

// Mode présentation (fondu, flèches, plein écran)
async function present() {
  snap(); toast('Préparation de la présentation…');
  const imgs = await Promise.all(pages.map(p => renderPage(p, 'jpeg', 1, .9)));
  let i = cur; const el = $('#show'), im = el.firstElementChild;
  const go = n => { i = Math.max(0, Math.min(imgs.length - 1, n)); im.style.opacity = 0; setTimeout(() => { im.src = imgs[i]; im.style.opacity = 1; }, 150); };
  showK = e => { if (e.key === 'ArrowRight' || e.key === ' ') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === 'Escape') closeShow(); };
  addEventListener('keydown', showK); el.hidden = false; go(i); el.onclick = e => { if (e.target === im) go(i + 1); };
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
}
function closeShow() { $('#show').hidden = true; removeEventListener('keydown', showK); if (document.fullscreenElement) document.exitFullscreen(); }
$('#sx').onclick = closeShow; $('#pres').onclick = present;
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !$('#show').hidden) closeShow(); });

// Position numérique, groupes, copier / coller, raccourcis
const num = fn => e => { const a = act(); if (!a || e.target.value === '') return; fn(a, +e.target.value); a.setCoords(); c.requestRenderAll(); sync(); };
$('#nx').oninput = num((a, v) => a.set('left', a.left + v - a.getBoundingRect(true, true).left));
$('#ny').oninput = num((a, v) => a.set('top', a.top + v - a.getBoundingRect(true, true).top));
$('#nw').oninput = num((a, v) => $('#lk').checked ? a.scaleToWidth(v) : a.set('scaleX', v / (a.width || 1)));
$('#nh').oninput = num((a, v) => $('#lk').checked ? a.scaleToHeight(v) : a.set('scaleY', v / (a.height || 1)));
['nx', 'ny', 'nw', 'nh'].forEach(id => $('#' + id).onchange = save);
NAMES.group = 'Groupe';
function group() { const a = act(); if (a && a.type === 'activeSelection') { a.toGroup(); c.requestRenderAll(); save(); layers(); } }
function ungroup() { const a = act(); if (a && a.type === 'group') { a.toActiveSelection(); c.requestRenderAll(); save(); layers(); } }
$('#grp').onclick = group; $('#ugr').onclick = ungroup;
const copy = () => { const a = act(); if (a) a.clone(o => { clip = o; toast('Copié'); }); };
const paste = () => { if (clip) clip.clone(o => { c.discardActiveObject(); o.set({ left: o.left + 30, top: o.top + 30, evented: true }); if (o.type === 'activeSelection') { o.canvas = c; o.forEachObject(x => c.add(x)); o.setCoords(); } else c.add(o); c.setActiveObject(o); c.requestRenderAll(); }); };
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || (act() && act().isEditing) || !$('#home').hidden || !$('#show').hidden) return;
  const k = e.key.toLowerCase(), m = e.ctrlKey || e.metaKey, a = act();
  if (m && k === 'c') copy();
  else if (m && k === 'x') { copy(); del(); }
  else if (m && k === 'a') { e.preventDefault(); c.discardActiveObject(); c.setActiveObject(new fabric.ActiveSelection(c.getObjects(), { canvas: c })); c.requestRenderAll(); }
  else if (m && k === 'g') { e.preventDefault(); e.shiftKey ? ungroup() : group(); }
  else if (m && k === 's') { e.preventDefault(); autosave(true); }
  else if (k === 'escape') { c.discardActiveObject(); c.requestRenderAll(); }
  else if (k.startsWith('arrow') && a) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; a.set({ left: a.left + (k === 'arrowright' ? d : k === 'arrowleft' ? -d : 0), top: a.top + (k === 'arrowdown' ? d : k === 'arrowup' ? -d : 0) }); a.setCoords(); c.requestRenderAll(); save(); }
});
c.on('object:moving', sync);

// Barre du haut pour les photos : suppression du fond + filtres
$('#tai').onclick = () => $('#ai').click();
$('#tpk').onclick = () => $('#pk').click();
const FL = { vintage: { sa: -.3, wm: .5, ct: .1, br: -.05 }, warm: { wm: .6, sa: .1 }, cold: { wm: -.6 }, drama: { ct: .35, sa: -.2, br: -.1 }, soft: { bl: .06, br: .1, ct: -.1 }, film: { sa: -.15, ct: .15, wm: .25, hu: .03 } };
$('#tfl').onchange = e => {
  const a = act(), v = e.target.value; e.target.value = '';
  if (!a || a.type !== 'image' || !v) return;
  if (v === 'nb') return document.querySelector('[data-pre=Grayscale]').click();
  FI.forEach(id => $('#' + id).value = 0);
  Object.entries(FL[v] || {}).forEach(([k, x]) => $('#' + k).value = x);
  filters(); save(); topbar();
};

showHome();
