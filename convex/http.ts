import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { coinbaseWebhook } from './payments/public';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
	path: '/coinbase/webhook',
	method: 'POST',
	handler: coinbaseWebhook,
});

export default http;
