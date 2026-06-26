"use client";

// app/help/page.jsx
// Ola.ug — Help Center
// Self-contained page body. TopNav / footer are assumed to come from your
// root layout; if not, drop <TopNav showSearch={false} /> at the top.

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, Package, RotateCcw, CreditCard, ShieldCheck, Store,
  AlertCircle, ChevronDown, ChevronRight, MessageCircle, Phone,
  Mail, Clock, HelpCircle, Smartphone, Truck, X,
} from 'lucide-react';

/* ── Data ──────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { icon: Package,     title: 'Orders & Delivery', desc: 'Track, change or cancel an order and learn about delivery times.', count: 14, href: '/help/orders' },
  { icon: RotateCcw,   title: 'Returns & Refunds', desc: 'Return an item, request a refund and check refund status.',        count: 11, href: '/help/returns' },
  { icon: CreditCard,  title: 'Payments & Pricing', desc: 'Mobile Money, cards, cash on delivery and pricing questions.',     count: 9,  href: '/help/payments' },
  { icon: ShieldCheck, title: 'Account & Security', desc: 'Sign in, update your details and keep your account safe.',         count: 8,  href: '/help/account' },
  { icon: Store,       title: 'Selling on Ola',     desc: 'Open a store, list products and manage your seller dashboard.',    count: 16, href: '/help/selling' },
  { icon: AlertCircle, title: 'Product Issues',     desc: 'Report a wrong, damaged or counterfeit item.',                     count: 7,  href: '/help/products' },
];

const POPULAR = [
  { label: 'How do I track my order?',                 href: '/help/orders/track' },
  { label: 'How long does delivery take in Uganda?',   href: '/help/orders/delivery-times' },
  { label: 'How do I pay with MTN MoMo or Airtel Money?', href: '/help/payments/mobile-money' },
  { label: 'How do I return an item?',                 href: '/help/returns/how-to-return' },
  { label: 'When will I get my refund?',               href: '/help/returns/refund-status' },
  { label: 'How do I open a store on Ola.ug?',         href: '/help/selling/open-store' },
];

const FAQ_GROUPS = [
  {
    category: 'Orders & Delivery',
    items: [
      { q: 'How do I track my order?',
        a: 'Go to My Orders from the account menu and tap the order you want to follow. You will see the current status — confirmed, packed, shipped or delivered — along with the latest tracking update. We also send you SMS and in-app notifications at each step.' },
      { q: 'How long does delivery take?',
        a: 'Delivery within Kampala typically takes 1–2 business days. Other towns across Uganda take 2–5 business days depending on the courier and the seller’s location. Estimated delivery dates are shown on the product page and at checkout before you pay.' },
      { q: 'Can I change or cancel my order?',
        a: 'You can cancel a free of charge while the order status is still "Confirmed" — open the order and tap Cancel Order. Once the seller has packed or shipped it, cancellation is no longer possible and you will need to use the returns process after delivery.' },
      { q: 'My order is late. What should I do?',
        a: 'First check the tracking on the order page for the latest update. If the order has passed its estimated delivery date by more than 2 business days, contact the seller through Messages, or reach our support team and we will follow up with the courier on your behalf.' },
    ],
  },
  {
    category: 'Payments & Pricing',
    items: [
      { q: 'What payment methods can I use?',
        a: 'Ola.ug accepts MTN Mobile Money, Airtel Money, Visa and Mastercard, and Cash on Delivery in selected areas. The methods available to you are shown at checkout based on your delivery location.' },
      { q: 'How do I pay with Mobile Money?',
        a: 'Choose MTN MoMo or Airtel Money at checkout and enter your registered phone number. You will receive a prompt on your phone — enter your Mobile Money PIN to approve the payment. Once approved, your order is confirmed instantly.' },
      { q: 'Is it safe to pay on Ola.ug?',
        a: 'Yes. Payments are processed through encrypted, PCI-compliant providers and your card or Mobile Money details are never shared with sellers. For added protection, your payment is held under Buyer Protection until you confirm the item has arrived as described.' },
      { q: 'Why was I charged a delivery fee?',
        a: 'Delivery fees depend on the seller’s location, your delivery address and the size of the order. The exact fee is always shown at checkout before you pay. Some sellers offer free delivery above a minimum order value.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'What is your return policy?',
        a: 'Most items can be returned within 7 days of delivery if they are unused, in their original packaging and not in the non-returnable list (such as perishables, innerwear and personalised items). The return window is shown on each product page.' },
      { q: 'How do I return an item?',
        a: 'Open the order in My Orders, tap Return Item, choose a reason and submit. You will get return instructions and a drop-off or pickup option. Once the seller receives and inspects the item, your refund is processed.' },
      { q: 'When will I get my refund?',
        a: 'After the returned item is received and approved, refunds are issued within 3–7 business days. Mobile Money refunds usually arrive faster than card refunds, which depend on your bank’s processing time.' },
    ],
  },
  {
    category: 'Account & Security',
    items: [
      { q: 'How do I create or sign in to my account?',
        a: 'Tap the account icon and sign in with Google or TikTok. The first time you sign in, you will be asked to add a phone number to secure your account and receive order updates.' },
      { q: 'I didn’t receive my verification or order SMS.',
        a: 'Make sure the phone number on your profile is correct and that you have network coverage. SMS can take a few minutes to arrive. If it still doesn’t come through, update your number under Account settings and try again.' },
      { q: 'How do I keep my account safe?',
        a: 'Never share your sign-in codes or Mobile Money PIN with anyone, including people claiming to be from Ola.ug — we will never ask for them. Only pay through the app, and report any suspicious messages to our support team.' },
    ],
  },
  {
    category: 'Selling on Ola',
    items: [
      { q: 'How do I open a store?',
        a: 'Tap "Sell on Ola.ug", add your phone number and switch your account to Seller. You will be guided through store onboarding where you set your store name, add your details and list your first products.' },
      { q: 'How and when do I get paid?',
        a: 'Buyer payments are held until the order is delivered and the protection window closes. Cleared funds are then paid out to your registered Mobile Money or bank account on your store’s payout schedule, which you can view in your Seller Dashboard.' },
      { q: 'What fees does Ola.ug charge sellers?',
        a: 'Listing is free. Ola.ug charges a commission on each completed sale, deducted automatically at payout. The current commission rate for your category is shown in your Seller Dashboard before you list.' },
    ],
  },
];

const CONTACTS = [
  { icon: MessageCircle, title: 'Live Chat',  desc: 'Chat with a support agent in real time.',   meta: 'Avg. reply under 5 min', action: 'Start chat',   href: '/help/chat',                accent: '#FE2C55' },
  { icon: Smartphone,    title: 'WhatsApp',   desc: 'Message us on WhatsApp for quick help.',     meta: '+256 700 000 000',       action: 'Open WhatsApp', href: 'https://wa.me/256700000000', accent: '#25D366' },
  { icon: Phone,         title: 'Call us',    desc: 'Speak to our team, Mon–Sat 8am–8pm EAT.',   meta: '+256 700 000 000',       action: 'Call now',      href: 'tel:+256700000000',          accent: '#2563EB' },
  { icon: Mail,          title: 'Email',      desc: 'Send us a detailed message any time.',      meta: 'support@ola.ug',         action: 'Send email',    href: 'mailto:support@ola.ug',      accent: '#7C3AED' },
];

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function HelpCenterPage() {
  const [query, setQuery]   = useState('');
  const [openKey, setOpenKey] = useState(null);

  const q = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!q) return FAQ_GROUPS;
    return FAQ_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(
          it => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [q]);

  const totalMatches = filteredGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap');
        .help-display { font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
        @keyframes faqOpen { from { opacity:0; transform:translateY(-4px);} to { opacity:1; transform:translateY(0);} }
        .faq-answer { animation:faqOpen 0.18s ease forwards; }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF0F3] to-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#FE2C55] bg-white border border-[#FFD6DE] rounded-full px-3 py-1 mb-5">
            <HelpCircle size={13} /> Help Center
          </span>
          <h1 className="help-display text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            How can we help you?
          </h1>
          <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-xl mx-auto mb-8">
            Search our help articles or browse the topics below. Most questions about orders,
            payments and returns are answered here.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center bg-white border-2 border-[#FE2C55] rounded-xl shadow-sm h-12 sm:h-14 px-4">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search e.g. “track my order”, “refund”, “Mobile Money”…"
                className="flex-1 px-3 text-[14px] outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Quick suggestions */}
            {!q && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-[12px] text-gray-400">Popular:</span>
                {['Track order', 'Refunds', 'Mobile Money', 'Delivery time', 'Open a store'].map(t => (
                  <button
                    key={t}
                    onClick={() => setQuery(t)}
                    className="text-[12px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 hover:border-[#FE2C55] hover:text-[#FE2C55] transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4">

        {/* ── Browse by category (hidden while searching) ─────────────────── */}
        {!q && (
          <section className="py-14">
            <h2 className="help-display text-xl sm:text-2xl font-bold text-gray-900 mb-1">Browse by topic</h2>
            <p className="text-gray-500 text-[14px] mb-8">Pick a category to find step-by-step guides.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map(({ icon: Icon, title, desc, count, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="group block bg-white border border-gray-200 rounded-2xl p-5 hover:border-[#FE2C55] hover:shadow-[0_8px_24px_rgba(254,44,85,0.08)] transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#FFF0F3] flex items-center justify-center mb-4 group-hover:bg-[#FE2C55] transition-colors">
                    <Icon size={20} className="text-[#FE2C55] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center justify-between">
                    {title}
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#FE2C55] group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-3">{desc}</p>
                  <span className="text-[12px] font-medium text-gray-400">{count} articles</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Popular articles (hidden while searching) ───────────────────── */}
        {!q && (
          <section className="pb-14">
            <h2 className="help-display text-xl sm:text-2xl font-bold text-gray-900 mb-6">Popular articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              {POPULAR.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 py-3 border-b border-gray-100 text-[14px] text-gray-700 hover:text-[#FE2C55] transition-colors group"
                >
                  <Truck size={16} className="text-gray-300 group-hover:text-[#FE2C55] transition-colors shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-[#FE2C55] transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ accordion ───────────────────────────────────────────────── */}
        <section className="pb-16">
          <h2 className="help-display text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {q ? 'Search results' : 'Frequently asked questions'}
          </h2>
          <p className="text-gray-500 text-[14px] mb-8">
            {q
              ? `${totalMatches} result${totalMatches === 1 ? '' : 's'} for “${query.trim()}”`
              : 'Quick answers to the questions we hear most often.'}
          </p>

          {totalMatches === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Search size={22} className="text-gray-300" />
              </div>
              <p className="text-[15px] font-semibold text-gray-800 mb-1">No matching articles</p>
              <p className="text-[13px] text-gray-500 mb-5">Try different keywords, or reach out to our team below.</p>
              <button
                onClick={() => setQuery('')}
                className="text-[13px] font-semibold text-[#FE2C55] hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredGroups.map(group => (
                <div key={group.category}>
                  <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-400 mb-3">
                    {group.category}
                  </h3>
                  <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                    {group.items.map((item, i) => {
                      const key = `${group.category}-${i}`;
                      const isOpen = openKey === key;
                      return (
                        <div key={key}>
                          <button
                            onClick={() => setOpenKey(isOpen ? null : key)}
                            className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-[#FFF8FA] transition-colors"
                          >
                            <span className={`text-[14px] font-medium ${isOpen ? 'text-[#FE2C55]' : 'text-gray-800'}`}>
                              {item.q}
                            </span>
                            <ChevronDown
                              size={18}
                              className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FE2C55]' : 'text-gray-400'}`}
                            />
                          </button>
                          {isOpen && (
                            <div className="faq-answer px-5 pb-5 -mt-1">
                              <p className="text-[13.5px] text-gray-600 leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Still need help / contact ───────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="help-display text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Still need help?
            </h2>
            <p className="text-gray-500 text-[14px] max-w-md mx-auto">
              Our support team is here for you. Choose the option that works best.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACTS.map(({ icon: Icon, title, desc, meta, action, href, accent }) => (
              <a
                key={title}
                href={href}
                className="group flex flex-col bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}14` }}
                >
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-3 flex-1">{desc}</p>
                <span className="text-[12px] font-medium text-gray-400 mb-4">{meta}</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold group-hover:gap-2.5 transition-all"
                  style={{ color: accent }}
                >
                  {action} <ChevronRight size={15} />
                </span>
              </a>
            ))}
          </div>

          {/* Hours strip */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-gray-500">
            <Clock size={15} className="text-gray-400" />
            Support hours: Monday–Saturday, 8:00am–8:00pm EAT
          </div>
        </div>
      </section>
    </div>
  );
}