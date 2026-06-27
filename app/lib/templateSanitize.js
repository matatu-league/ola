/**
 * ============================================================================
 * FILE: app/lib/templateSanitize.js
 * ----------------------------------------------------------------------------
 * The AI store-builder generates a full React component as source text, which
 * is rendered inside an <iframe> via Babel standalone in a <script type="text/
 * babel"> block. That script is a *classic script*, not a module, and the
 * generated code is wrapped (e.g. inside a try/...) — so any top-level `import`
 * declaration throws:
 *
 *   SyntaxError: import declarations may only appear at top level of a module
 *
 * Babel's UMD React/lucide globals are already provided by the host page, so we
 * strip every import before injection. lucide-react named imports are rewired
 * to the in-page fallback proxy so icon components still resolve. `export`
 * keywords are dropped too, since the wrapper references `App` directly.
 * ============================================================================
 */

/**
 * Make AI-generated component source safe to drop into a non-module
 * `<script type="text/babel">` block.
 *
 * @param {string} code               Raw generated source.
 * @param {string} [lucideTarget]     Expression lucide-react imports map to.
 * @returns {string}                  Import/export-free source.
 */
export function sanitizeTemplateCode(code, lucideTarget = 'window.lucideFallback || {}') {
  if (!code) return '';

  return code
    // lucide-react named imports → in-page fallback proxy (keep the names).
    // Handles single- and multi-line import lists.
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]\s*;?/g,
      (_m, names) => `const { ${names.trim()} } = ${lucideTarget};`,
    )
    // Strip every remaining `import ... from '...'` (default, named, namespace,
    // mixed, multi-line). [^;'"]*? keeps it from crossing statement/quote
    // boundaries while still spanning newlines.
    .replace(/import\s+[^;'"]*?\s+from\s*['"][^'"]+['"]\s*;?/g, '')
    // Side-effect imports: `import 'some-css';`
    .replace(/import\s*['"][^'"]+['"]\s*;?/g, '')
    // Drop export keywords — the host wrapper renders <App/> directly.
    .replace(/export\s+default\s+/g, '')
    .replace(/^[ \t]*export\s+/gm, '');
}
