// src/components/modals/popovers/ColorPopover.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULTS = [
  "transparent", "#d32f45", "#fae153", "#111111", "#cfcfcf",
  "#4662ff", "#ffaf20", "#19ff98", "#dc5dff", "#d43a54", "#ffffff"
];
const PALETTE_KEY = "app_color_palette";

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

const hexToRgb = (hex) => {
  const h = (hex || "").replace("#", "").trim();
  if (h.length !== 6) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};
const rgbToHex = ({ r, g, b }) => {
  const to2 = (n) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
};
const rgbToHsv = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, v = max;
  if (d !== 0) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }
  return { h, s, v };
};
const hsvToRgb = ({ h, s, v }) => {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = v; g = t; b = p;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};
const hsvToHex = (hsv) => rgbToHex(hsvToRgb(hsv));

const ADV_W = 220;
const ADV_H = 240;
const GAP = 8;
const SAFE = 8;

export default function ColorPopover({ value, onChange, onClose }) {
  const initialHex = useMemo(() => (value ? value : "transparent"), [value]);

  const [palette, setPalette] = useState(() => {
    try {
      const saved = localStorage.getItem(PALETTE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULTS;
  });
  const savePalette = (newPalette) => {
    const finalPalette = Array.from(new Set(newPalette));
    setPalette(finalPalette);
    try { localStorage.setItem(PALETTE_KEY, JSON.stringify(finalPalette)); } catch {}
  };

  const [advOpen, setAdvOpen] = useState(false);
  const [advAnchor, setAdvAnchor] = useState({ top: 0, left: 0 });
  const [hsv, setHsv] = useState(() =>
    rgbToHsv(hexToRgb(initialHex === "transparent" ? "#ffffff" : initialHex))
  );
  const shadeRef = useRef(null);
  const hueRef = useRef(null);
  const shadeWrapRef = useRef(null);
  const hueWrapRef = useRef(null);
  const shadeKnobRef = useRef(null);
  const hueKnobRef = useRef(null);

  useLayoutEffect(() => {
    if (!advOpen) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const setupCanvas = (canvas, heightPx) => {
      if (!canvas) return { w: 0, h: 0, ctx: null };
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(heightPx ?? rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h, ctx };
    };

    const drawShade = () => {
      const { ctx, w, h } = setupCanvas(shadeRef.current, 136);
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const base = ctx.createLinearGradient(0, 0, w, 0);
      base.addColorStop(0, "#ffffff");
      base.addColorStop(1, hsvToHex({ h: hsv.h, s: 1, v: 1 }));
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);

      const blk = ctx.createLinearGradient(0, 0, 0, h);
      blk.addColorStop(0, "rgba(0,0,0,0)");
      blk.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = blk; ctx.fillRect(0, 0, w, h);

      const x = hsv.s * w, y = (1 - hsv.v) * h;
      const k = shadeKnobRef.current;
      if (k) { k.style.left = `${x}px`; k.style.top = `${y}px`; }
    };

    const drawHue = () => {
      const { ctx, w, h } = setupCanvas(hueRef.current, 40);
      if (!ctx) return;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hsvToHex({ h: i / 6, s: 1, v: 1 }));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      const k = hueKnobRef.current;
      if (k) k.style.left = `${hsv.h * w}px`;
    };

    drawShade(); drawHue();

    const ro = new ResizeObserver(() => { drawShade(); drawHue(); });
    if (shadeWrapRef.current) ro.observe(shadeWrapRef.current);
    if (hueWrapRef.current) ro.observe(hueWrapRef.current);
    return () => ro.disconnect();
  }, [advOpen, hsv.h, hsv.s, hsv.v]);

  const drag = (startEvt, move) => {
    move(startEvt);
    const mm = (ev) => move(ev);
    const mu = () => {
      window.removeEventListener("pointermove", mm);
      window.removeEventListener("pointerup", mu);
    };
    window.addEventListener("pointermove", mm);
    window.addEventListener("pointerup", mu, { once: true });
  };
  const onShadePointer = (e) => {
    const rect = shadeRef.current.getBoundingClientRect();
    const nx = clamp((e.clientX - rect.left) / rect.width);
    const ny = clamp((e.clientY - rect.top) / rect.height);
    setHsv((prev) => ({ ...prev, s: nx, v: 1 - ny }));
  };
  const onHuePointer = (e) => {
    const rect = hueRef.current.getBoundingClientRect();
    const nx = clamp((e.clientX - rect.left) / rect.width);
    setHsv((prev) => ({ ...prev, h: nx }));
  };

  const openAdvanced = (evt) => {
    const b = evt.currentTarget.getBoundingClientRect();
    let top = b.bottom + GAP;
    let left = b.left + b.width / 2 - ADV_W / 2;
    if (top + ADV_H + SAFE > window.innerHeight) top = Math.max(SAFE, b.top - GAP - ADV_H);
    if (left < SAFE) left = SAFE;
    if (left + ADV_W + SAFE > window.innerWidth) left = window.innerWidth - ADV_W - SAFE;
    setAdvAnchor({ top, left });
    setAdvOpen(true);
  };

  const selectColor = (c) => {
    onChange?.(c === "transparent" ? "" : c);
    onClose?.();
  };

  const saveCustomColor = () => {
    const hex = hsvToHex(hsv);
    savePalette([...palette, hex]);
    onChange?.(hex);
    setAdvOpen(false);
  };

  return (
    <div className="task-pop color-pop" onMouseDown={(e) => e.stopPropagation()}>
      <div className="grid-colors">
        {palette.map((c, i) => (
          <button
            key={i}
            className={`sw ${((value || "transparent") === c) ? "sel" : ""} ${c === "transparent" ? "none" : ""}`}
            title={c}
            style={c === "transparent" ? {} : { background: c }}
            onClick={() => selectColor(c)}
          />
        ))}
    
        <button className="sw plus" onClick={openAdvanced}>＋</button>
      </div>

    
      {advOpen && createPortal(
        <>
          <div
            className="color-adv-overlay"
            onMouseDown={() => setAdvOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.22)", zIndex: 10004 }}
          />
          <div
            className="color-adv-modal"
            style={{
              position: "fixed",
              top: advAnchor.top,
              left: advAnchor.left,
              width: ADV_W,
              height: ADV_H,
              boxSizing: "border-box",
              padding: 8,
              borderRadius: 12,
              background: "var(--task-card)",
              border: "1px solid var(--task-line)",
              boxShadow: "0 18px 60px rgba(0,0,0,.25)",
              zIndex: 10005
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div ref={shadeWrapRef} style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
              <canvas
                ref={shadeRef}
                style={{ display: "block", width: "100%", height: 136, borderRadius: 10 }}
                onPointerDown={(e) => drag(e, onShadePointer)}
              />
              <span
                ref={shadeKnobRef}
                style={{
                  position: "absolute",
                  width: 18, height: 18,
                  borderRadius: 999, border: "3px solid #0a0a0a",
                  background: "#fff",
                  transform: "translate(-50%,-50%)",
                  pointerEvents: "none"
                }}
              />
            </div>

            <div ref={hueWrapRef} style={{ position: "relative", marginTop: 6, borderRadius: 10, overflow: "hidden" }}>
              <canvas
                ref={hueRef}
                style={{ display: "block", width: "100%", height: 40, borderRadius: 10 }}
                onPointerDown={(e) => drag(e, onHuePointer)}
              />
              <span
                ref={hueKnobRef}
                style={{
                  position: "absolute",
                  top: 20,
                  width: 18, height: 18,
                  borderRadius: 999, border: "3px solid #0a0a0a",
                  background: "#fff",
                  transform: "translate(-50%,-50%)",
                  pointerEvents: "none"
                }}
              />
            </div>

          
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "22px 1fr 64px",
                alignItems: "center",
                gap: 8,
                marginTop: 6
              }}
            >
              <span
                style={{
                  width: 22, height: 22, borderRadius: 999,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,.2)",
                  background: hsvToHex(hsv)
                }}
              />

              <input
                className="txt"
                style={{
                  minWidth: 0,
                  height: 28,
                  fontSize: 13,
                  padding: "6px 8px",
                  border: "1.5px solid #0a0a0a",
                  borderRadius: 10,
                  background: "var(--task-card)"
                }}
                value={hsvToHex(hsv).toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  if (/^#?[0-9a-fA-F]{6}$/.test(val)) {
                    const h = val.startsWith("#") ? val : `#${val}`;
                    setHsv(rgbToHsv(hexToRgb(h)));
                  }
                }}
              />

              <button
                className="primary-btn"
                style={{
                  width: 64,
                  height: 28,
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: 0
                }}
                onClick={saveCustomColor}
              >
                Lưu
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
