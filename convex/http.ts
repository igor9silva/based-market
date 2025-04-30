import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { polarWebhook } from './topUps/public';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
	path: '/polar/webhook',
	method: 'POST',
	handler: polarWebhook,
});

export default http;
