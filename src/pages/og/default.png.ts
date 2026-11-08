import type { APIRoute } from 'astro';
import { renderOgPng } from '../../lib/og';

export const GET: APIRoute = async () =>
  new Response((await renderOgPng({ plate: '83', title: 'Biển số xe là tỉnh nào?', subtitle: 'Tra cứu sau sáp nhập 01/07/2025' })) as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
