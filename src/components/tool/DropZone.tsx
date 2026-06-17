import { useId, useRef, useState } from "react";
import { loadImageFromFile } from "../../lib/image";
import { cn } from "../../lib/cn";
import { StepHeader } from "./StepHeader";

export function DropZone({
  step,
  title,
  sub,
  hintTitle,
  hintSub,
  image,
  onImage,
  onError,
  icon,
}: {
  step: number;
  title: string;
  sub: string;
  hintTitle: string;
  hintSub: string;
  image: HTMLImageElement | null;
  onImage: (img: HTMLImageElement) => void;
  onError: (msg: string) => void;
  icon: "source" | "reference";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const id = useId();

  const handle = async (file?: File | null) => {
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      onImage(img);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not load that image.");
    }
  };

  return (
    <div className="panel p-5">
      <StepHeader step={step} title={title} sub={sub} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files[0]);
        }}
        aria-label={hintTitle}
        className={cn(
          "group relative grid aspect-video w-full place-items-center overflow-hidden rounded-[8px] border border-dashed text-center transition-[border-color,transform] duration-200",
          drag
            ? "border-accent bg-accent/10"
            : "border-hairline-2 bg-bg-2 hover:-translate-y-px hover:border-accent",
        )}
      >
        {image ? (
          <>
            <img
              src={image.src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-left text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              Click to replace
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2.5 px-5 text-muted">
            <DropIcon variant={icon} />
            <b className="text-[15px] font-semibold text-text">{hintTitle}</b>
            <small className="text-[12px] text-faint">{hintSub}</small>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}

function DropIcon({ variant }: { variant: "source" | "reference" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-accent/90"
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      {variant === "source" ? (
        <>
          <circle cx="8.5" cy="8.5" r="1.6" />
          <path d="M21 15l-5-5L5 21" />
        </>
      ) : (
        <>
          <circle cx="8.5" cy="8" r="1.4" />
          <path d="M3 16l4-4 3 3 4-5 7 7" />
        </>
      )}
    </svg>
  );
}
