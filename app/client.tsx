import * as Sentry from '@sentry/react';
import { StartClient } from '@tanstack/start';
import { hydrateRoot } from 'react-dom/client';
import './lib/bigint-serialization';
import { createRouter } from './router';

Sentry.init({
	dsn: 'https://d1e3e5a175d04d9a494032aa785969d7@o4508540750331904.ingest.us.sentry.io/4509384313077760',
	integrations: [
		Sentry.browserTracingIntegration(), //
		Sentry.replayIntegration(),
	],
	tracesSampleRate: 1.0, // Capture 100% of the transactions
	// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
	tracePropagationTargets: [
		'localhost',
		/^https:\/\/based\.market/,
		/^https:\/\/dazzling-hornet-128\.convex\.cloud/,
		/^https:\/\/veracious-ferret-552\.convex\.cloud/,
	],
	// Session Replay
	replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);

// Add a default export that can be imported by other files
export default {};
