import { useRef } from "react";
import { Camera, X } from "lucide-react";

export type PhotoDropzoneProps = {
  value: string[];                         // data URLs
  onChange: (next: string[]) => void;
  max?: number;
};

export function PhotoDropzone({ value, onChange, max = 8 }: PhotoDropzoneProps) {
  const ref = useRef<HTMLInputElement | null>(null);

  const handle = (files: FileList | null) => {
    if (!files) return;
    const slots = max - value.length;
    const accepted = Array.from(files).slice(0, slots);
    Promise.all(
      accepted.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(String(r.result));
            r.onerror = () => rej(r.error);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => onChange([...value, ...urls]));
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={value.length >= max}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/40 p-5 text-center transition-colors hover:border-[var(--accent-500)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Camera className="h-5 w-5 text-[var(--ink-500)]" />
        <p className="text-[12.5px] font-semibold">Add delivery photos</p>
        <p className="text-[11px] text-[var(--ink-500)]">
          {value.length}/{max} attached · tap to capture or pick from library
        </p>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
      </button>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((src, i) => (
            <div key={i} className="group relative">
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                className="h-16 w-16 rounded-md border border-[var(--ink-200)] object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--red-500)] p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}