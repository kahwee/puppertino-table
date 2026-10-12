import { createRoot } from 'react-dom/client';
import { Demo } from './demo.js';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing demo root element');
createRoot(root).render(<Demo />);
