import { NextResponse } from 'next/server';
import { load } from 'cheerio';

type Question = {
  id: string;
  title: string;
  type: string;
  options?: string[];
};

function extractQuestionsFromHtml(html: string): Question[] {
  const $ = load(html);
  const questions: Question[] = [];
  const seen = new Set<string>();

  // Heuristics: elements with class/id containing 'question', legends, headings, labels
  const selectors = '[class*="question"], [id*="question"], legend, label, h1, h2, h3, h4, [role*="heading"]';
  $(selectors).each((_: any, el: any) => {
    const $el = $(el);
    const title = $el.text().replace(/\s+/g, ' ').trim();
    if (!title) return;
    if (seen.has(title)) return;
    seen.add(title);

    // options: inputs or list items inside the same parent or container
    const options: string[] = [];
    $el.find('input[type="radio"], input[type="checkbox"]').each((__: any, inp: any) => {
      const $inp = $(inp as any);
      // try associated label
      let txt = '';
      const id = $inp.attr('id');
      if (id) txt = $(`label[for="${id}"]`).text().trim();
      if (!txt) txt = $inp.parent().text().trim();
      if (txt) options.push(txt.replace(/\s+/g, ' '));
    });
    // also capture nearby li or .option elements
    $el.find('li, .option, .choice, [role="listitem"]').each((__: any, o: any) => {
      const t = $(o as any).text().replace(/\s+/g, ' ').trim();
      if (t) options.push(t);
    });

    const q: Question = { id: $el.attr('id') || String(questions.length + 1), title, type: options.length ? 'choice' : 'text' };
    if (options.length) q.options = Array.from(new Set(options));
    questions.push(q);
  });

  // fallback: if nothing, try labels
  if (questions.length === 0) {
    $('label').each((_: any, l: any) => {
      const t = $(l as any).text().replace(/\s+/g, ' ').trim();
      if (!t || seen.has(t)) return;
      seen.add(t);
      questions.push({ id: String(questions.length + 1), title: t, type: 'unknown' });
    });
  }

  return questions;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, rawHtml } = body || {};

    let html = rawHtml || '';
    if (url) {
      const res = await fetch(String(url), { headers: { 'User-Agent': 'next-ms-form-parser/1.0 (+https://example)' } });
      if (!res.ok) return NextResponse.json({ ok: false, error: 'Failed to fetch URL', status: res.status }, { status: 502 });
      html = await res.text();
    }

    if (!html) return NextResponse.json({ ok: false, error: 'No url or rawHtml provided' }, { status: 400 });

    const questions = extractQuestionsFromHtml(html);

    return NextResponse.json({ ok: true, source: url || null, questions });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
