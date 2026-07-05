"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Loader2, Check, Eye, EyeOff,
  ExternalLink, Save, X,
} from 'lucide-react';

// ── Store Pages ───────────────────────────────────────────────────────────────
// Vendor-authored custom pages (About us, FAQ, Shipping policy, Returns, …).
// Managed here, served publicly on the store's own domain at /page/<slug> —
// so templates and footers can link to real, vendor-controlled content.

const SUGGESTED = [
  { title: 'About Us',        hint: 'Your story, mission and what makes the store special.' },
  { title: 'FAQ',             hint: 'Answers to the questions buyers ask the most.' },
  { title: 'Shipping Policy', hint: 'Delivery zones, timelines and fees.' },
  { title: 'Returns & Refunds', hint: 'How exchanges, returns and refunds work.' },
  { title: 'Contact',         hint: 'How and when buyers can reach you.' },
];

const slugify = (s) =>
  String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

function PageEditor({ page, onSaved, onCancel }) {
  const [title, setTitle]         = useState(page?.title || '');
  const [content, setContent]     = useState(page?.content || '');
  const [published, setPublished] = useState(page?.published !== false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const isNew = !page?.slug;
  const slug  = page?.slug || slugify(title);

  const save = async () => {
    if (!title.trim()) { setError('Give the page a title.'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/stores/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, published }),
      });
      const json = await res.json();
      if (json.success) onSaved(json.pages);
      else setError(json.message || 'Could not save the page.');
    } catch {
      setError('Could not save the page — check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-blue-600 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title (e.g. About Us)"
            className="w-full text-lg font-bold text-black outline-none border-b border-gray-200 focus:border-blue-600 pb-1 bg-transparent"
            autoFocus={isNew}
          />
          <p className="text-xs text-gray-400 mt-1.5 font-mono">/page/{slug || '…'}</p>
        </div>
        <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-black transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder="Write the page content here. Blank lines start a new paragraph."
        className="w-full bg-gray-50 border border-gray-200 p-3 text-sm text-black leading-relaxed outline-none focus:border-blue-600 resize-y"
      />

      {error && <p className="text-sm text-red-500 font-semibold mt-2">{error}</p>}

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-blue-600"
          />
          Published (visible to buyers)
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save page
        </button>
      </div>
    </div>
  );
}

export default function StorePagesPage() {
  const [pages, setPages]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing]     = useState(null);   // page object being edited, or 'new'
  const [message, setMessage]     = useState('');

  useEffect(() => {
    fetch('/api/stores/pages')
      .then((r) => r.json())
      .then((json) => { if (json.success) setPages(json.pages || []); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const flash = (text) => { setMessage(text); setTimeout(() => setMessage(''), 3000); };

  const onSaved = (nextPages) => {
    setPages(nextPages || []);
    setEditing(null);
    flash('Page saved.');
  };

  const togglePublished = async (page) => {
    const res  = await fetch('/api/stores/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...page, published: !page.published }),
    });
    const json = await res.json();
    if (json.success) setPages(json.pages || []);
  };

  const remove = async (page) => {
    if (!confirm(`Delete the page "${page.title}"?`)) return;
    const res  = await fetch(`/api/stores/pages?slug=${encodeURIComponent(page.slug)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) { setPages(json.pages || []); flash('Page deleted.'); }
  };

  const startSuggested = (title) => {
    const existing = pages.find((p) => p.slug === slugify(title));
    setEditing(existing || { title, slug: '', content: '', published: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[860px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-black tracking-tight flex items-center gap-2">
            <FileText size={19} /> Pages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create custom pages for your store — About, FAQ, policies. Published pages are live at{' '}
            <span className="font-mono text-gray-600">yourstore/page/&lt;slug&gt;</span>.
          </p>
        </div>
        <button
          onClick={() => setEditing({ title: '', slug: '', content: '', published: true })}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 transition-colors shrink-0"
        >
          <Plus size={15} /> New page
        </button>
      </div>

      {message && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-2.5">
          <Check size={15} /> {message}
        </div>
      )}

      {editing && (
        <div className="mb-6">
          <PageEditor page={editing === 'new' ? null : editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
        </div>
      )}

      {pages.length === 0 && !editing ? (
        <div className="border border-dashed border-gray-300 bg-gray-50 p-8">
          <p className="text-sm font-bold text-black mb-1">No pages yet</p>
          <p className="text-sm text-gray-500 mb-5">Start with one of these — buyers look for them:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s.title}
                onClick={() => startSuggested(s.title)}
                title={s.hint}
                className="inline-flex items-center gap-1.5 border border-gray-300 bg-white hover:border-blue-600 hover:text-blue-600 text-sm font-semibold text-gray-700 px-3 py-1.5 transition-colors"
              >
                <Plus size={13} /> {s.title}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div key={page.slug} className="flex items-center gap-3 border border-gray-200 bg-white px-4 py-3 hover:border-gray-400 transition-colors">
              <button onClick={() => setEditing(page)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-black truncate">{page.title}</p>
                <p className="text-xs text-gray-400 font-mono truncate">/page/{page.slug}</p>
              </button>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0 ${page.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {page.published ? 'Live' : 'Draft'}
              </span>
              <a
                href={`/page/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                title="View page"
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
              >
                <ExternalLink size={15} />
              </a>
              <button
                onClick={() => togglePublished(page)}
                title={page.published ? 'Unpublish' : 'Publish'}
                className="p-1.5 text-gray-400 hover:text-black transition-colors shrink-0"
              >
                {page.published ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                onClick={() => remove(page)}
                title="Delete"
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
