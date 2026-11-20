/**
 * Resolves className strings to expected CSS properties
 * Supports Tailwind CSS classes
 */

export interface ResolvedStyle {
  [property: string]: string;
}

function resolveSpacingToken(value: string): string | null {
  if (value === 'px') return '1px';
  const arbitrary = value.match(/^\[(.+)\]$/);
  if (arbitrary?.[1]) return arbitrary[1];
  if (/^\d+(?:\.\d+)?$/.test(value)) return `${Number(value) * 0.25}rem`;
  return null;
}

/**
 * Parse Tailwind classes and resolve to CSS properties
 * This is a simplified implementation - full implementation would use tailwindcss directly
 */
export function resolveTailwindClasses(classNames: string): ResolvedStyle {
  const classes = classNames.split(/\s+/).filter(Boolean);
  const styles: ResolvedStyle = {};

  for (const cls of classes) {
    // Position
    if (cls === 'fixed') styles.position = 'fixed';
    if (cls === 'absolute') styles.position = 'absolute';
    if (cls === 'relative') styles.position = 'relative';
    if (cls === 'sticky') styles.position = 'sticky';

    // Display
    if (cls === 'block') styles.display = 'block';
    if (cls === 'inline-block') styles.display = 'inline-block';
    if (cls === 'inline') styles.display = 'inline';
    if (cls === 'flex') styles.display = 'flex';
    if (cls === 'inline-flex') styles.display = 'inline-flex';
    if (cls === 'grid') styles.display = 'grid';
    if (cls === 'hidden') styles.display = 'none';

    // Width
    if (cls === 'w-full') styles.width = '100%';
    if (cls.startsWith('w-')) {
      const value = cls.slice(2);
      if (value === 'screen') styles.width = '100vw';
      else if (value === 'auto') styles.width = 'auto';
      else if (value === 'fit') styles.width = 'fit-content';
      else if (/^\d+$/.test(value)) styles.width = `${Number(value) * 0.25}rem`;
    }

    // Height
    if (cls === 'h-full') styles.height = '100%';
    if (cls === 'h-screen') styles.height = '100vh';
    if (cls.startsWith('h-') && /^\d+$/.test(cls.slice(2))) {
      styles.height = `${Number(cls.slice(2)) * 0.25}rem`;
    }

    // Margins
    if (cls.startsWith('m-') || cls.startsWith('mx-') || cls.startsWith('my-') ||
        cls.startsWith('mt-') || cls.startsWith('mr-') || cls.startsWith('mb-') || cls.startsWith('ml-')) {
      const match = cls.match(/^m([xytrbl]?)-(.+)$/);
      if (match) {
        const [, dir, value] = match;
        const resolved = value === 'auto' ? 'auto' : resolveSpacingToken(value);
        if (resolved) {
          if (!dir) styles.margin = resolved;
          else if (dir === 'x') {
            styles.marginLeft = resolved;
            styles.marginRight = resolved;
          } else if (dir === 'y') {
            styles.marginTop = resolved;
            styles.marginBottom = resolved;
          } else if (dir === 't') styles.marginTop = resolved;
          else if (dir === 'r') styles.marginRight = resolved;
          else if (dir === 'b') styles.marginBottom = resolved;
          else if (dir === 'l') styles.marginLeft = resolved;
        }
      }
    }

    // Padding
    if (cls.startsWith('p-') || cls.startsWith('px-') || cls.startsWith('py-') ||
        cls.startsWith('pt-') || cls.startsWith('pr-') || cls.startsWith('pb-') || cls.startsWith('pl-')) {
      const match = cls.match(/^p([xytrbl]?)-(.+)$/);
      if (match) {
        const [, dir, value] = match;
        const resolved = resolveSpacingToken(value);
        if (resolved) {
          if (!dir) styles.padding = resolved;
          else if (dir === 'x') {
            styles.paddingLeft = resolved;
            styles.paddingRight = resolved;
          } else if (dir === 'y') {
            styles.paddingTop = resolved;
            styles.paddingBottom = resolved;
          } else if (dir === 't') styles.paddingTop = resolved;
          else if (dir === 'r') styles.paddingRight = resolved;
          else if (dir === 'b') styles.paddingBottom = resolved;
          else if (dir === 'l') styles.paddingLeft = resolved;
        }
      }
    }

    // Borders
    if (cls === 'border') styles.borderWidth = '1px';
    if (cls.startsWith('border-')) {
      const value = cls.slice(7);
      if (/^\d+$/.test(value)) styles.borderWidth = `${value}px`;
    }

    // Z-index
    if (cls.startsWith('z-')) {
      styles.zIndex = cls.slice(2);
    }

    // Left/Right/Top/Bottom
    if (cls === 'left-0') styles.left = '0px';
    if (cls === 'right-0') styles.right = '0px';
    if (cls === 'top-0') styles.top = '0px';
    if (cls === 'bottom-0') styles.bottom = '0px';

    // Overflow
    if (cls === 'overflow-hidden') styles.overflow = 'hidden';
    if (cls === 'overflow-y-auto') styles.overflowY = 'auto';
    if (cls === 'overflow-x-hidden') styles.overflowX = 'hidden';

    // Min/Max width
    if (cls === 'min-w-0') styles.minWidth = '0px';
    if (cls === 'max-w-full') styles.maxWidth = '100%';

    // Background
    if (cls === 'bg-white') styles.backgroundColor = 'rgb(255, 255, 255)';
    if (cls.startsWith('bg-gray-')) {
      const shade = cls.slice(8);
      styles.backgroundColor = `var(--tw-bg-opacity, rgb(${grayScale(shade)}))`;
    }
  }

  return styles;
}

function grayScale(shade: string): string {
  const scales: Record<string, string> = {
    '50': '249, 250, 251',
    '100': '243, 244, 246',
    '200': '229, 231, 235',
    '300': '209, 213, 219',
    '500': '107, 114, 128',
    '900': '17, 24, 39',
  };
  return scales[shade] || '0, 0, 0';
}
