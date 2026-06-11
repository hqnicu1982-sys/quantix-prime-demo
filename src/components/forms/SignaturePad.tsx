import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, PenLine } from "lucide-react";

export type SignaturePadProps = {
  value?: string;            // current data URL
  onChange: (dataUrl: string | undefined) => void;
  height?: number;
};

export function SignaturePad({ value, onChange, height = 140 }: SignaturePadProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(!!value);

  // Resize canvas to its container width
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    c.width = w * dpr;
    c.height = height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0F2847";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, height);
      img.src = value;
    }
  }, [height, value]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const ctx = ref.current?.getContext("2d");
    const p = pos(e);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = ref.current?.getContext("2d");
    const p = pos(e);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
    setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const url = ref.current?.toDataURL("image/png");
    onChange(url);
  };

  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx?.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-md border border-[var(--ink-200)] bg-[var(--ink-50)]/40">
        <canvas
          ref={ref}
          style={{ height, width: "100%", touchAction: "none" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="block w-full cursor-crosshair rounded-md"
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[12px] text-[var(--ink-500)]">
            <PenLine className="h-3.5 w-3.5" /> Sign here
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--ink-500)]">
        <span>{hasInk ? "Signature captured" : "Draw using mouse or finger"}</span>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
          <Eraser className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>
    </div>
  );
}