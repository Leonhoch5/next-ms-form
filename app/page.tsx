"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState('');
  const [rawHtml, setRawHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body: any = {};
      if (url) body.url = url;
      if (!url && rawHtml) body.rawHtml = rawHtml;

      const res = await fetch('/api/parse-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to parse');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-3xl p-8">
        <div className="mb-6 flex items-center gap-4">
          <Image src="/next.svg" alt="logo" width={80} height={20} />
          <h1 className="text-2xl font-semibold">Microsoft Forms → JSON</h1>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Public Microsoft Forms URL (optional)</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://forms.office.com/Pages/ResponsePage.aspx?..."
              className="mt-1 block w-full rounded border px-3 py-2"
            />
            <p className="mt-1 text-xs text-zinc-500">If the form is public, paste its URL. Otherwise paste the form's HTML below.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Or paste raw form HTML</label>
            <textarea
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              placeholder="Paste the page HTML here (or leave empty to fetch the URL above)"
              rows={8}
              className="mt-1 block w-full rounded border px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Parsing…' : 'Convert to JSON'}
            </button>
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => { setUrl(''); setRawHtml(''); setResult(null); setError(null); }}
            >
              Reset
            </button>
          </div>
        </form>

        <div>
          {error && <div className="mb-4 rounded bg-red-50 p-3 text-red-700">Error: {error}</div>}
          {result && (
            <div>
              <h2 className="mb-2 text-lg font-medium">Parsed JSON</h2>
              <pre className="max-h-[60vh] overflow-auto rounded border p-4 bg-white text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          {!result && !error && (
            <div className="text-sm text-zinc-600">Paste a Microsoft Forms URL or the page HTML and click “Convert to JSON”.</div>
          )}
        </div>
      </main>
    </div>
  );
}
