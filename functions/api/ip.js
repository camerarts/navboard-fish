export async function onRequestGet(context) {
  try {
    const request = context.request;
    const cf = request.cf || {};

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip =
      request.headers.get('cf-connecting-ip') ||
      (forwardedFor ? forwardedFor.split(',')[0].trim() : '') ||
      '';

    const city = cf.city || cf.metroCode || '未知城市';
    const country = cf.country || '未知地区';
    const org = cf.asOrganization || cf.asnOrganization || '';

    return new Response(
      JSON.stringify({
        success: Boolean(ip),
        ip,
        city,
        country,
        org,
        isp: org,
        source: 'cloudflare-function',
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
