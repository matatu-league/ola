// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // Use class-based dark mode so you can apply the dark overrides with `dark:` variants
  darkMode: 'class',

  // Next.js 13+ (App Router) content paths – adjust if needed
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // ─── COLOURS ──────────────────────────────────────────
      colors: {
        // Brand orange palette (primary-1 → primary-10)
        primary: {
          50:  '#FFF2E6', // primary-1
          100: '#FFDBB8', // primary-2
          200: '#FFC48A', // primary-3
          300: '#FFAD5C', // primary-4
          400: '#FF962E', // primary-5
          500: '#FF6A00', // primary-6 (brand)
          600: '#D15700', // primary-7
          700: '#A34400', // primary-8
          800: '#753100', // primary-9
          900: '#471D00', // primary-10
        },

        success: {
          50:  '#F6FFED',
          100: '#D9F7BE',
          200: '#B7EB8F',
          300: '#95DE64',
          400: '#73D13D',
          500: '#52C41A',
          600: '#389E0D',
          700: '#237804',
          800: '#135200',
          900: '#092B00',
        },

        warning: {
          50:  '#FFFBE6',
          100: '#FFF1B8',
          200: '#FFE58F',
          300: '#FFD666',
          400: '#FFC53D',
          500: '#FAAD14',
          600: '#D48806',
          700: '#AD6800',
          800: '#874D00',
          900: '#613400',
        },

        error: {
          50:  '#FFF1F0',
          100: '#FFCCC7',
          200: '#FFA39E',
          300: '#FF7875',
          400: '#FF4D4F',
          500: '#F5222D',
          600: '#CF1322',
          700: '#A8071A',
          800: '#820014',
          900: '#5C0011',
        },

        info: {
          50:  '#E6F4FF',
          100: '#BAE0FF',
          200: '#91CAFF',
          300: '#69B1FF',
          400: '#4096FF',
          500: '#1677FF',
          600: '#0958D9',
          700: '#003EB3',
          800: '#002C8C',
          900: '#001D66',
        },

        // Neutral grayscale (13 steps → 50–950)
        neutral: {
          50:   '#FFFFFF',   // gray-1
          100:  '#FAFAFA',   // gray-2
          200:  '#F5F5F5',   // gray-3
          300:  '#F0F0F0',   // gray-4
          400:  '#D9D9D9',   // gray-5
          500:  '#BFBFBF',   // gray-6
          600:  '#8C8C8C',   // gray-7
          700:  '#595959',   // gray-8
          800:  '#434343',   // gray-9
          900:  '#262626',   // gray-10
          950:  '#141414',   // gray-12 (skipping 11,13; map as needed)
        },

        // Text colours as semantic tokens
        text: {
          DEFAULT:       'rgba(0, 0, 0, 0.88)',
          secondary:     'rgba(0, 0, 0, 0.65)',
          tertiary:      'rgba(0, 0, 0, 0.45)',
          quaternary:    'rgba(0, 0, 0, 0.25)',
          disabled:      'rgba(0, 0, 0, 0.25)',
          heading:       'rgba(0, 0, 0, 0.88)',
          label:         'rgba(0, 0, 0, 0.65)',
          description:   'rgba(0, 0, 0, 0.45)',
          placeholder:   'rgba(0, 0, 0, 0.25)',
        },

        // Background colours
        bg: {
          base:      '#FFFFFF',
          container: '#FFFFFF',
          elevated:  '#FFFFFF',
          layout:    '#F5F5F5',
          spotlight: 'rgba(0, 0, 0, 0.85)',
          mask:      'rgba(0, 0, 0, 0.45)',
          blur:      'transparent',
        },

        // Border colours
        border: {
          DEFAULT:   '#D9D9D9',
          secondary: '#F0F0F0',
          split:     'rgba(5, 5, 5, 0.06)',
        },

        // Fill colours
        fill: {
          DEFAULT:    'rgba(0, 0, 0, 0.15)',
          secondary:  'rgba(0, 0, 0, 0.06)',
          tertiary:   'rgba(0, 0, 0, 0.04)',
          quaternary: 'rgba(0, 0, 0, 0.02)',
          content:    'rgba(0, 0, 0, 0.06)',
          alter:      'rgba(0, 0, 0, 0.02)',
        },

        // Link colours
        link: {
          DEFAULT: '#FF6A00',
          hover:   '#FF962E',
          active:  '#D15700',
        },
      },

      // ─── TYPOGRAPHY ───────────────────────────────────────
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },

      fontWeight: {
        light: 300,
        normal: 400,
        semibold: 600,  // fontWeightStrong
      },

      fontSize: {
        xs:        ['12px', { lineHeight: '1.66' }],  // fontSizeSM
        sm:        ['14px', { lineHeight: '1.5714' }], // fontSize (base)
        base:      ['14px', { lineHeight: '1.5714' }],
        lg:        ['16px', { lineHeight: '1.5' }],    // fontSizeLG
        xl:        ['20px', { lineHeight: '1.4' }],    // fontSizeXL
        '2xl':     ['24px', { lineHeight: '1.333' }],  // fontSizeHeading3
        '3xl':     ['30px', { lineHeight: '1.2667' }], // fontSizeHeading2
        '4xl':     ['38px', { lineHeight: '1.2105' }], // fontSizeHeading1
        // Named headings for direct use
        'h1':      ['38px', { lineHeight: '1.21', fontWeight: '600' }],
        'h2':      ['30px', { lineHeight: '1.27', fontWeight: '600' }],
        'h3':      ['24px', { lineHeight: '1.33', fontWeight: '600' }],
        'h4':      ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h5':      ['16px', { lineHeight: '1.5', fontWeight: '600' }],
      },

      // ─── SPACING (4px base, px values) ───────────────────
      spacing: {
        // Override the default scale with exact pixel values
        0:   '0px',
        1:   '4px',   // marginXXS / paddingXXS
        2:   '8px',   // marginXS / paddingXS
        3:   '12px',  // marginSM / paddingSM
        4:   '16px',  // margin / padding
        5:   '20px',  // marginMD / paddingMD
        6:   '24px',  // marginLG / paddingLG
        7:   '32px',  // marginXL / paddingXL
        8:   '48px',  // marginXXL
        // Keep some standard larger values if needed
        12:  '48px',
        16:  '64px',
        20:  '80px',
        24:  '96px',
      },

      // ─── SIZING (optional, for width/height) ─────────────
      // You can use the spacing scale for most sizing props.
      // If you need explicit sizes, add them here:
      // width/height: { ... }

      // ─── BORDER RADIUS ───────────────────────────────────
      borderRadius: {
        none: '0px',
        xs:   '2px',
        sm:   '4px',
        DEFAULT: '6px',
        md:   '6px',
        lg:   '8px',
      },

      // ─── BOX SHADOW ──────────────────────────────────────
      boxShadow: {
        DEFAULT: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        secondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        tertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        card: '0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09)',
        'drawer-right': '-6px 0 16px 0 rgba(0,0,0,0.08), -3px 0 6px -4px rgba(0,0,0,0.12), -9px 0 28px 8px rgba(0,0,0,0.05)',
        'drawer-left': '6px 0 16px 0 rgba(0,0,0,0.08), 3px 0 6px -4px rgba(0,0,0,0.12), 9px 0 28px 8px rgba(0,0,0,0.05)',
        'drawer-up': '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
        'drawer-down': '0 -6px 16px 0 rgba(0,0,0,0.08), 0 -3px 6px -4px rgba(0,0,0,0.12), 0 -9px 28px 8px rgba(0,0,0,0.05)',
        'popover-arrow': '2px 2px 5px rgba(0, 0, 0, 0.05)',
      },

      // ─── TRANSITION DURATION ─────────────────────────────
      transitionDuration: {
        fast: '100ms',
        mid:  '200ms',
        slow: '300ms',
      },

      // ─── TRANSITION TIMING FUNCTION (EASING) ─────────────
      transitionTimingFunction: {
        'ease-out-circ':    'cubic-bezier(0.08, 0.82, 0.17, 1)',
        'ease-in-out-circ': 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
        'ease-out':         'cubic-bezier(0.215, 0.61, 0.355, 1)',
        'ease-in-out':      'cubic-bezier(0.645, 0.045, 0.355, 1)',
        'ease-out-back':    'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
        'ease-in-back':     'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
        'ease-in-quint':    'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
        'ease-out-quint':   'cubic-bezier(0.23, 1, 0.32, 1)',
      },

      // ─── Z-INDEX ─────────────────────────────────────────
      zIndex: {
        base:         0,
        affix:       10,
        backtop:     10,
        picker:    1050,
        popconfirm:1060,
        dropdown:  1050,
        tooltip:   1070,
        modal:     1000,
        drawer:    1000,
        notification: 1010,
        message:   1010,
        image:     1080,
      },

      // ─── BREAKPOINTS ─────────────────────────────────────
      screens: {
        xs:  '480px',
        sm:  '576px',
        md:  '768px',
        lg:  '992px',
        xl:  '1200px',
        '2xl': '1600px',
      },
    },
  },

  plugins: [],
};