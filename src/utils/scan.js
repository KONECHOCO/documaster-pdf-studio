// Elaborazione delle foto dei documenti, interamente su canvas:
// 1) rilevamento automatico dei 4 angoli del foglio, 2) raddrizzamento prospettico,
// 3) filtri "documento" che eliminano ombre e sfondo grigio (normalizzazione dell'illuminazione).

function grayFrom(data, n) {
  const g = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114;
  return g;
}

function boxBlur(src, w, h, r) {
  // Media su finestra quadrata tramite immagine integrale: costo costante per pixel
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += src[y * w + x];
      integ[(y + 1) * (w + 1) + x + 1] = integ[y * (w + 1) + x + 1] + row;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w, x + r + 1);
      const sum = integ[y1 * (w + 1) + x1] - integ[y0 * (w + 1) + x1] - integ[y1 * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
      out[y * w + x] = sum / ((x1 - x0) * (y1 - y0));
    }
  }
  return out;
}

function otsu(values) {
  const hist = new Array(256).fill(0);
  for (const v of values) hist[Math.max(0, Math.min(255, v | 0))]++;
  const total = values.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function defaultCorners(w, h, inset = 0.04) {
  const dx = w * inset;
  const dy = h * inset;
  return [
    { x: dx, y: dy },
    { x: w - dx, y: dy },
    { x: w - dx, y: h - dy },
    { x: dx, y: h - dy },
  ];
}

/**
 * Trova il foglio nella foto: soglia di Otsu, componente connessa più grande e "squadrata",
 * poi i 4 punti estremi. Restituisce [tl, tr, br, bl] in pixel del canvas, o gli angoli predefiniti.
 */
export function detectDocumentCorners(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const scale = Math.min(1, 360 / Math.max(W, H));
  const w = Math.max(8, Math.round(W * scale));
  const h = Math.max(8, Math.round(H * scale));
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(canvas, 0, 0, w, h);
  const gray = boxBlur(grayFrom(sctx.getImageData(0, 0, w, h).data, w * h), w, h, 2);
  const thr = otsu(gray);

  let best = null;
  for (const brightDoc of [true, false]) {
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = brightDoc ? gray[i] > thr : gray[i] <= thr;
    const seen = new Uint8Array(w * h);
    const stack = new Int32Array(w * h);
    for (let start = 0; start < w * h; start++) {
      if (!mask[start] || seen[start]) continue;
      let sp = 0;
      stack[sp++] = start;
      seen[start] = 1;
      let count = 0;
      let tl = null;
      let tr = null;
      let br = null;
      let bl = null;
      let touches = 0;
      while (sp) {
        const idx = stack[--sp];
        const x = idx % w;
        const y = (idx / w) | 0;
        count++;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touches++;
        if (!tl || x + y < tl.x + tl.y) tl = { x, y };
        if (!br || x + y > br.x + br.y) br = { x, y };
        if (!tr || x - y > tr.x - tr.y) tr = { x, y };
        if (!bl || x - y < bl.x - bl.y) bl = { x, y };
        if (x > 0 && mask[idx - 1] && !seen[idx - 1]) (seen[idx - 1] = 1), (stack[sp++] = idx - 1);
        if (x < w - 1 && mask[idx + 1] && !seen[idx + 1]) (seen[idx + 1] = 1), (stack[sp++] = idx + 1);
        if (y > 0 && mask[idx - w] && !seen[idx - w]) (seen[idx - w] = 1), (stack[sp++] = idx - w);
        if (y < h - 1 && mask[idx + w] && !seen[idx + w]) (seen[idx + w] = 1), (stack[sp++] = idx + w);
      }
      const frac = count / (w * h);
      if (frac < 0.12 || frac > 0.97) continue;
      const quad = [tl, tr, br, bl];
      const qa = polygonArea(quad);
      if (qa < w * h * 0.1) continue;
      // Un foglio riempie quasi tutto il proprio quadrilatero; se tocca molto i bordi è probabilmente lo sfondo
      const score = (count / qa) * frac - (touches / (2 * (w + h))) * 0.5;
      if (!best || score > best.score) best = { score, quad };
    }
  }
  if (!best || best.score < 0.1) return defaultCorners(W, H);
  return best.quad.map((p) => ({ x: (p.x + 0.5) / scale, y: (p.y + 0.5) / scale }));
}

// Omografia che porta il rettangolo di destinazione nel quadrilatero sorgente
function homography(src, dst) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dst[i];
    const { x: u, y: v } = src[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // Eliminazione di Gauss con pivot parziale
  for (let c = 0; c < 8; c++) {
    let piv = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]];
    [b[c], b[piv]] = [b[piv], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  return b.map((v, i) => v / A[i][i]);
}

const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

/** Raddrizza il foglio delimitato da `corners` [tl, tr, br, bl]. */
export function warpPerspective(canvas, corners, maxPx = 2200) {
  const [tl, tr, br, bl] = corners;
  let outW = Math.max(dist(tl, tr), dist(bl, br));
  let outH = Math.max(dist(tl, bl), dist(tr, br));
  const s = Math.min(1, maxPx / Math.max(outW, outH));
  outW = Math.max(10, Math.round(outW * s));
  outH = Math.max(10, Math.round(outH * s));

  const H = homography(corners, [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH },
  ]);
  const srcCtx = canvas.getContext('2d', { willReadFrequently: true });
  const sw = canvas.width;
  const sh = canvas.height;
  const src = srcCtx.getImageData(0, 0, sw, sh).data;
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  const img = octx.createImageData(outW, outH);
  const d = img.data;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const den = H[6] * x + H[7] * y + 1;
      const u = (H[0] * x + H[1] * y + H[2]) / den;
      const v = (H[3] * x + H[4] * y + H[5]) / den;
      const o = (y * outW + x) * 4;
      if (u < 0 || v < 0 || u >= sw - 1 || v >= sh - 1) {
        d[o] = d[o + 1] = d[o + 2] = d[o + 3] = 255;
        continue;
      }
      // Interpolazione bilineare
      const x0 = u | 0;
      const y0 = v | 0;
      const fx = u - x0;
      const fy = v - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sw * 4;
      const i11 = i01 + 4;
      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c] * (1 - fx) + src[i10 + c] * fx;
        const bot = src[i01 + c] * (1 - fx) + src[i11 + c] * fx;
        d[o + c] = top * (1 - fy) + bot * fy;
      }
      d[o + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/**
 * Filtri: 'auto' (documento a colori pulito), 'bw' (bianco e nero nitido), 'gray', 'original'.
 * Lo sfondo viene stimato con una media molto ampia e diviso via: ombre e luce non uniforme spariscono.
 */
export function applyDocumentFilter(sourceCanvas, filter = 'auto') {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0);
  if (filter === 'original') return out;

  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const n = w * h;
  const gray = grayFrom(d, n);

  if (filter === 'gray') {
    for (let i = 0, j = 0; i < n; i++, j += 4) d[j] = d[j + 1] = d[j + 2] = gray[i];
    ctx.putImageData(imgData, 0, 0);
    return out;
  }

  // Stima dello sfondo su un'immagine ridotta (più veloce), poi riportata a piena risoluzione
  const ds = Math.max(1, Math.round(Math.max(w, h) / 500));
  const sw = Math.ceil(w / ds);
  const sh = Math.ceil(h / ds);
  const small = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      // Massimo locale: lo sfondo è la parte più chiara, l'inchiostro non deve "sporcare" la stima
      let m = 0;
      for (let yy = y * ds; yy < Math.min(h, (y + 1) * ds); yy++) {
        for (let xx = x * ds; xx < Math.min(w, (x + 1) * ds); xx++) m = Math.max(m, gray[yy * w + xx]);
      }
      small[y * sw + x] = m;
    }
  }
  const bg = boxBlur(boxBlur(small, sw, sh, Math.max(3, Math.round(sw / 25))), sw, sh, Math.max(3, Math.round(sw / 25)));

  for (let y = 0, i = 0; y < h; y++) {
    const by = Math.min(sh - 1, (y / ds) | 0);
    for (let x = 0; x < w; x++, i++) {
      const b = Math.max(40, bg[by * sw + Math.min(sw - 1, (x / ds) | 0)]);
      const j = i * 4;
      if (filter === 'bw') {
        const norm = Math.min(1, gray[i] / b);
        // Contrasto deciso: carta bianca, testo nero, bordi morbidi
        const v = norm > 0.82 ? 255 : norm < 0.55 ? 0 : ((norm - 0.55) / 0.27) * 255;
        d[j] = d[j + 1] = d[j + 2] = v;
      } else {
        // 'auto': colori conservati, carta resa bianca
        for (let c = 0; c < 3; c++) {
          const norm = Math.min(1, d[j + c] / b);
          d[j + c] = Math.max(0, Math.min(255, ((norm - 0.08) / 0.84) * 255));
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return out;
}

export function rotateCanvas(sourceCanvas, deg) {
  const r = ((deg % 360) + 360) % 360;
  if (!r) return sourceCanvas;
  const swap = r === 90 || r === 270;
  const out = document.createElement('canvas');
  out.width = swap ? sourceCanvas.height : sourceCanvas.width;
  out.height = swap ? sourceCanvas.width : sourceCanvas.height;
  const ctx = out.getContext('2d');
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((r * Math.PI) / 180);
  ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
  return out;
}
