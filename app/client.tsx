import { StartClient } from '@tanstack/start';
import { hydrateRoot } from 'react-dom/client';
import './lib/bigint-serialization';
import { createRouter } from './router';

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);

// Add a default export that can be imported by other files
export default {};
