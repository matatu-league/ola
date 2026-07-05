// ─── JSON storefront template: parsing + structural validation ───────────────
//
// The AI emits a structured JSON document (see docs/template-json-schema.md):
//   { version, meta, tokens, sections: Node[] }
// where every Node carries its FULL Tailwind `class` string, optional `style`/
// `background`, interactions (`on` → closed action verbs), motion tokens and
// data bindings. This module turns raw model output into a validated doc — the
// reliability win over free-form JSX: bad output fails HERE with readable
// errors (which we can feed back for one retry), never at render time.

export const TEMPLATE_JSON_VERSION = 1;

// Closed vocabularies — keep in sync with the runtime renderer + the prompt.
export const NODE_TYPES = [
  'box', 'text', 'image', 'icon', 'button', 'link', 'input', 'divider', 'spacer',
  'hero', 'section', 'navbar', 'footer', 'banner', 'stats', 'testimonials', 'faq',
  'productGrid', 'productCard', 'serviceMenu', 'serviceCard', 'categoryRail',
  'gallery', 'cartDrawer', 'bookingForm', 'modal',
];

export const ACTION_VERBS = [
  'navigate', 'openDrawer', 'closeDrawer', 'addToCart', 'buyNow', 'checkout',
  'setState', 'toggle', 'setVariant', 'scrollTo', 'openModal', 'closeModal',
  'toast', 'external',
];

export const EVENT_NAMES = ['click', 'submit', 'change', 'mouseenter', 'load', 'inview'];

export const REPEAT_SOURCES = ['products', 'services', 'categories', 'related'];

export const ROUTE_NAMES = ['*', 'home', 'shop', 'product'];

/**
 * Extract the JSON document from raw model output: strips markdown fences and
 * any prose before/after the outermost object literal.
 * @returns {{ doc: object|null, error: string|null }}
 */
export function extractTemplateJson(text) {
  if (!text || typeof text !== 'string') return { doc: null, error: 'Empty response' };
  let s = text.trim();
  // Strip ```json … ``` fences if present.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  // Fall back to the outermost { … } if there is leading/trailing prose.
  if (!s.startsWith('{')) {
    const first = s.indexOf('{');
    const last  = s.lastIndexOf('}');
    if (first === -1 || last <= first) return { doc: null, error: 'No JSON object found in the response' };
    s = s.slice(first, last + 1);
  }
  try {
    return { doc: JSON.parse(s), error: null };
  } catch (e) {
    return { doc: null, error: `Invalid JSON: ${e.message}` };
  }
}

// Walk one node collecting structural errors (path-annotated, capped).
function validateNode(node, path, errors) {
  if (errors.length >= 20) return;
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    errors.push(`${path}: node must be an object`);
    return;
  }
  if (!node.type || typeof node.type !== 'string') {
    errors.push(`${path}: missing "type"`);
  } else if (!NODE_TYPES.includes(node.type)) {
    errors.push(`${path}: unknown type "${node.type}" (allowed: ${NODE_TYPES.join(', ')})`);
  }
  if (node.class != null && typeof node.class !== 'string') {
    errors.push(`${path}.class: must be a Tailwind class STRING`);
  }
  if (node.style != null && (typeof node.style !== 'object' || Array.isArray(node.style))) {
    errors.push(`${path}.style: must be an object of CSS properties`);
  }
  if (node.on != null) {
    if (typeof node.on !== 'object' || Array.isArray(node.on)) {
      errors.push(`${path}.on: must be an object of { event: Action[] }`);
    } else {
      for (const [evt, actions] of Object.entries(node.on)) {
        if (!EVENT_NAMES.includes(evt)) errors.push(`${path}.on: unknown event "${evt}"`);
        if (!Array.isArray(actions)) {
          errors.push(`${path}.on.${evt}: must be an ARRAY of actions`);
        } else {
          actions.forEach((a, i) => {
            if (!a || typeof a !== 'object' || !ACTION_VERBS.includes(a.action)) {
              errors.push(`${path}.on.${evt}[${i}]: unknown action "${a && a.action}" (allowed: ${ACTION_VERBS.join(', ')})`);
            }
          });
        }
      }
    }
  }
  if (node.repeat != null) {
    if (typeof node.repeat !== 'object' || !REPEAT_SOURCES.includes(node.repeat.source)) {
      errors.push(`${path}.repeat.source: must be one of ${REPEAT_SOURCES.join(', ')}`);
    }
  }
  if (node.children != null) {
    if (!Array.isArray(node.children)) {
      errors.push(`${path}.children: must be an array`);
    } else {
      node.children.forEach((c, i) => validateNode(c, `${path}.children[${i}]`, errors));
    }
  }
}

/**
 * Structural validation of a template document.
 * @returns {string[]} readable errors (empty = valid)
 */
export function validateTemplateDoc(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return ['Document must be a JSON object'];
  }
  if (doc.tokens != null && (typeof doc.tokens !== 'object' || Array.isArray(doc.tokens))) {
    errors.push('tokens: must be an object of theme values');
  }
  if (!Array.isArray(doc.sections) || doc.sections.length === 0) {
    errors.push('sections: must be a non-empty array of nodes');
    return errors;
  }
  doc.sections.forEach((s, i) => {
    if (s && s.route != null) {
      const r = String(s.route).replace(/^#\//, '') || 'home';
      const name = r === '' ? 'home' : r.split('/')[0];
      if (!ROUTE_NAMES.includes(name === '' ? 'home' : name)) {
        errors.push(`sections[${i}].route: must be one of ${ROUTE_NAMES.join(', ')}`);
      }
    }
    validateNode(s, `sections[${i}]`, errors);
  });
  return errors;
}

/**
 * One-call helper: extract + validate.
 * @returns {{ doc: object|null, errors: string[] }}
 */
export function parseTemplateJson(text) {
  const { doc, error } = extractTemplateJson(text);
  if (!doc) return { doc: null, errors: [error] };
  const errors = validateTemplateDoc(doc);
  return { doc: errors.length ? null : doc, errors };
}
