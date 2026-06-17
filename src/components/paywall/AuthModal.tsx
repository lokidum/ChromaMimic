import { useState } from "react";
import { Modal } from "./Modal";
import { Logo } from "../Logo";

export function AuthModal({
  open,
  onClose,
  onSubmit,
  reason = "Create a free account to download your LUT.",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  reason?: string;
}) {
  const [email, setEmail] = useState("");
  const valid = /.+@.+\..+/.test(email);

  return (
    <Modal open={open} onClose={onClose} labelledBy="auth-title">
      <div className="p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-display text-[15px] font-semibold tracking-tight">ChromaMimic</span>
        </div>
        <h2 id="auth-title" className="text-[22px]">
          Create your free account
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{reason}</p>
        <p className="mt-1 text-[12.5px] text-faint">
          3 free downloads every month. Your frames never leave your browser.
        </p>

        <button
          type="button"
          onClick={() => onSubmit("creator@gmail.com")}
          className="btn btn-ghost mt-6 w-full"
        >
          <GoogleGlyph />
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-[12px] text-faint">
          <span className="h-px flex-1 bg-hairline" />
          or
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSubmit(email);
          }}
        >
          <input
            type="email"
            autoFocus
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-select w-full !pr-3"
          />
          <button type="submit" className="btn btn-primary mt-3 w-full" disabled={!valid}>
            Continue
          </button>
        </form>

        <p className="mt-4 text-center text-[11.5px] text-faint">
          By continuing you agree to the{" "}
          <a href="/terms" className="underline hover:text-muted">Terms</a> and{" "}
          <a href="/privacy" className="underline hover:text-muted">Privacy Policy</a>.
        </p>
      </div>
    </Modal>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
