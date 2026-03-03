import { createRoot } from "react-dom/client";
import { App } from "./app/App";

import "@fontsource/pt-sans/400.css";
import "@fontsource/pt-sans/700.css";

createRoot(document.getElementById("root")!).render(<App />);
