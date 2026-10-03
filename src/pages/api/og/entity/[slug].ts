import type { APIRoute } from 'astro';
import { getEntityWithStats } from '../../../../lib/services/entities';

export const GET: APIRoute = async ({ params }) => {
  const entity = await getEntityWithStats(params.slug!);
  if (!entity) return new Response('Not found', { status: 404 });

  const primaryStat = entity.stats[0];
  const statText = primaryStat
    ? `${primaryStat.name}: ${primaryStat.value.toLocaleString()} ${primaryStat.unit}`
    : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0e0f17"/>
      <!-- Accent bar -->
      <rect x="0" y="0" width="1200" height="6" fill="oklch(72% 0.22 145)"/>
      <!-- Brand name -->
      <text x="80" y="80" font-family="monospace" font-size="28" fill="#9ba3a6">ComPair</text>
      <!-- Emoji -->
      <text x="80" y="260" font-family="serif" font-size="180">${entity.emoji}</text>
      <!-- Entity name -->
      <text x="320" y="200" font-family="sans-serif" font-weight="900" font-size="88" fill="#f4f4f5">
        ${entity.name}
      </text>
      <!-- Stat -->
      <text x="322" y="270" font-family="monospace" font-size="36" fill="oklch(72% 0.22 145)">
        ${statText}
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }
  });
};
