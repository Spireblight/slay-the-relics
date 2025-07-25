import { createRoot } from "react-dom/client";
import App from "./components/App/App";
import { StrictMode } from "react";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
