export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return new Response(
      JSON.stringify({ error: 'BACKEND_URL is not configured' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const url = new URL(request.url);
  const target = `${backendUrl.replace(/\/$/, '')}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', url.host);

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    // @ts-expect-error -- duplex is required for streaming request bodies in edge runtime
    init.duplex = 'half';
  }

  try {
    const response = await fetch(target, init);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('transfer-encoding');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'Backend unavailable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
