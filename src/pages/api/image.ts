import type { APIRoute } from 'astro';

const isBadImage = (url: string) => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.svg') || 
         lowerUrl.includes('map') || 
         lowerUrl.includes('flag') || 
         lowerUrl.includes('logo') || 
         lowerUrl.includes('icon') ||
         lowerUrl.includes('coat_of_arms') ||
         lowerUrl.includes('seal_of');
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  
  if (!q) {
    return new Response('Missing q', { status: 400 });
  }

  try {
    // 1. Wikimedia REST API (Best quality, actual article lead photo)
    const restRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
    if (restRes.ok) {
      const restData = await restRes.json();
      if (restData.originalimage?.source && !isBadImage(restData.originalimage.source)) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': restData.originalimage.source,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    }
  } catch (e) {
    console.error('Wikimedia REST fetch failed:', e);
  }

  try {
    // 2. DuckDuckGo Instant Answer API (Fallback)
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      if (ddgData.Image && !isBadImage(ddgData.Image)) {
        const ddgUrl = ddgData.Image.startsWith('http') ? ddgData.Image : `https://duckduckgo.com${ddgData.Image}`;
        return new Response(null, {
          status: 302,
          headers: {
            'Location': ddgUrl,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    }
  } catch(e) {
    console.error('DDG image fetch failed:', e);
  }

  // Fallback to picsum if all else fails
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `https://picsum.photos/seed/${encodeURIComponent(q)}/800/800`,
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
