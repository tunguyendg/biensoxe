import type { APIRoute, GetStaticPaths } from 'astro';
import { data } from '../../lib/data';
import { formatDate } from '../../lib/format';
import { lookup } from '../../lib/lookup';
import { renderOgPng } from '../../lib/og';

export const getStaticPaths = (() => data.codes.map((c) => ({ params: { code: c.code } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const r = lookup(params.code as string);
  if (r.kind === 'unknown') return new Response(null, { status: 404 });
  const png =
    r.kind === 'special'
      ? await renderOgPng({ plate: r.code, title: r.label })
      : await renderOgPng({
          plate: r.code,
          title: r.province.name,
          ...(r.changed ? { subtitle: `Trước ${formatDate(data.meta.dataVersion)}: ${r.former}` } : {}),
        });
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
