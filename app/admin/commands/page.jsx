"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2, Save, Loader2, Check } from 'lucide-react';

const SCOPE_LABEL = {
  global:   'Global (cuts across all)',
  store:    'Products stores (unified)',
  category: 'Category',
  service:  'Service type',
};

function CommandCard({ cmd, onSaved, onDeleted }) {
  const [text, setText]     = useState(cmd.command || '');
  const [label, setLabel]   = useState(cmd.label || '');
  const [active, setActive] = useState(cmd.active !== false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const locked = cmd.target === 'global' || cmd.target === 'store';

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res  = await fetch('/api/admin/commands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: cmd.scope, target: cmd.target, label, command: text, active }),
      });
      const json = await res.json();
      if (json.success) { setSaved(true); onSaved?.(json.command); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm(`Delete command "${cmd.target}"?`)) return;
    const res  = await fetch(`/api/admin/commands?target=${encodeURIComponent(cmd.target)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) onDeleted?.(cmd.target); else alert(json.error || 'Could not delete');
  };

  return (
    <div className="bg-white border border-[#E3E3E4] rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#161823] px-2 py-0.5 rounded">{SCOPE_LABEL[cmd.scope] || cmd.scope}</span>
            <code className="text-[12px] text-[#8A8B91]">{cmd.target}</code>
          </div>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label / description"
            className="mt-2 w-full bg-transparent text-[14px] font-semibold text-[#161823] outline-none border-b border-transparent focus:border-[#E3E3E4]" />
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-[#8A8B91] shrink-0">
          <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="accent-[#161823]" /> Active
        </label>
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
        placeholder="Command / instructions injected into the AI brief for this scope…"
        className="w-full bg-[#F8F9FA] border border-[#E3E3E4] rounded-md p-3 text-[13px] leading-relaxed text-[#161823] outline-none focus:border-[#161823] resize-y" />
      <div className="flex items-center justify-between mt-3">
        <button onClick={del} disabled={locked}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FE2C55] hover:underline disabled:opacity-40 disabled:no-underline"
          title={locked ? 'Default commands cannot be deleted' : 'Delete'}>
          <Trash2 size={13} /> Delete
        </button>
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 bg-[#161823] hover:bg-black text-white text-[13px] font-bold px-4 py-2 rounded-md transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AiCommandsPage() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ scope: 'category', target: '', label: '', command: '' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/commands');
      const json = await res.json();
      if (json.success) setCommands(json.commands || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addCommand = async () => {
    if (!form.target.trim()) return alert('Enter a target (a category slug or service type).');
    setAdding(true);
    try {
      const res  = await fetch('/api/admin/commands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, active: true }),
      });
      const json = await res.json();
      if (json.success) { setForm({ scope: 'category', target: '', label: '', command: '' }); load(); }
      else alert(json.error || 'Could not add');
    } finally { setAdding(false); }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#161823] tracking-tight flex items-center gap-2"><Sparkles size={18} /> AI Storefront Commands</h1>
        <p className="text-[13px] text-[#8A8B91] mt-1 max-w-2xl">
          Editable instructions that steer AI template generation. The <b>global</b> command applies to every storefront; the most-specific match for a store (a <b>category</b> slug, a <b>service type</b>, or the unified <b>store</b> command) is layered on top. Same idea as per-category filters — stored in the DB, no deploy needed.
        </p>
      </div>

      {/* Add new */}
      <div className="bg-white border border-[#E3E3E4] rounded-lg p-5 mb-6">
        <h3 className="text-[14px] font-bold text-[#161823] mb-3">Add a command for an industry / category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            className="bg-[#F8F9FA] border border-[#E3E3E4] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#161823]">
            <option value="category">Category</option>
            <option value="service">Service type</option>
          </select>
          <input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
            placeholder="target (e.g. electronics, salon)"
            className="bg-[#F8F9FA] border border-[#E3E3E4] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#161823]" />
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="label (optional)"
            className="bg-[#F8F9FA] border border-[#E3E3E4] rounded-md px-3 py-2 text-[13px] outline-none focus:border-[#161823]" />
        </div>
        <textarea value={form.command} onChange={e => setForm(f => ({ ...f, command: e.target.value }))} rows={3}
          placeholder="The instructions to inject for this category/service…"
          className="w-full bg-[#F8F9FA] border border-[#E3E3E4] rounded-md p-3 text-[13px] outline-none focus:border-[#161823] resize-y mb-3" />
        <button onClick={addCommand} disabled={adding}
          className="inline-flex items-center gap-1.5 bg-[#FE2C55] hover:bg-[#e6284b] text-white text-[13px] font-bold px-4 py-2 rounded-md transition-colors disabled:opacity-60">
          {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add command
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#8A8B91]" /></div>
      ) : (
        <div className="space-y-4">
          {commands.map(cmd => (
            <CommandCard key={cmd.target} cmd={cmd}
              onSaved={(u) => setCommands(prev => prev.map(c => c.target === u.target ? u : c))}
              onDeleted={(t) => setCommands(prev => prev.filter(c => c.target !== t))} />
          ))}
        </div>
      )}
    </div>
  );
}
