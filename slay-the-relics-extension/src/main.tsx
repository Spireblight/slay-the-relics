import { createRoot } from 'react-dom/client';
import App from "./components/App/App";

const domNode = document.getElementById('root');
const root = createRoot(domNode!);
root.render(<App />);
