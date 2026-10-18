// Eclipse Shield site Worker.
// Static pages are served straight from ./dist. Only /api/* reaches this code (run_worker_first).
// POST /api/quote is the quote form handler in functions/api/quote.ts, written for Cloudflare Pages
// Functions before the move to Workers; it only needs the request and env, so it runs here as is.
import { onRequest, onRequestPost } from '../functions/api/quote';

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  LEAD_TO?: string;
  LEAD_FROM?: string;
  EMAIL_DRY_RUN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/quote') {
      return request.method === 'POST' ? onRequestPost({ request, env }) : onRequest();
    }
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
