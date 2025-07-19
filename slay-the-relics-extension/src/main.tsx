import { createRoot } from "react-dom/client";
import App from "./components/App/App";

const domNode = document.getElementById("root");
const root = createRoot(domNode!);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
root.render(<App />);
