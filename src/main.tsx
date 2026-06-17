import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: StrictMode is intentionally omitted. Its double mount/unmount interrupts
// motion's enter animations under React 19, leaving elements stuck at their
// initial (hidden) state. The app has no StrictMode-only correctness concerns.
createRoot(document.getElementById("root")!).render(<App />);
