declare const process: any;

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { BountyDetailSkeleton } from '../components/BountyDetailSkeleton';
import { PageSkeleton } from '../components/PageSkeleton';

describe('Accessibility: Reduced Motion Suite (WCAG 2.2 SC 2.3.3)', () => {
  it('provides a global reduced-motion stylesheet with universal and component overrides', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const cssPath = path.resolve(process.cwd(), 'src/styles/reduced-motion.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const content = fs.readFileSync(cssPath, 'utf-8');
    expect(content).toContain('@media (prefers-reduced-motion: reduce)');
    expect(content).toContain('animation-duration: 0.01ms !important');
    expect(content).toContain('scroll-behavior: auto !important');
    expect(content).toContain('.toast');
    expect(content).toContain('.tx-history-drawer');
    expect(content).toContain('.bounty-card__skeleton-line');
  });

  it('imports reduced-motion.css in theme.css for global application', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const themePath = path.resolve(process.cwd(), 'src/styles/theme.css');
    const content = fs.readFileSync(themePath, 'utf-8');
    expect(content).toContain("@import './reduced-motion.css';");
  });

  it('disables slideIn animation in Toaster.css under prefers-reduced-motion', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const toasterPath = path.resolve(process.cwd(), 'src/components/Toaster.css');
    const content = fs.readFileSync(toasterPath, 'utf-8');
    expect(content).toContain('@media (prefers-reduced-motion: reduce)');
    expect(content).toMatch(/\.toast\s*\{[^}]*animation:\s*none;[^}]*transform:\s*none;/);
  });

  it('disables slideInRight animation in TxHistoryDrawer.css under prefers-reduced-motion', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const drawerPath = path.resolve(process.cwd(), 'src/components/TxHistoryDrawer.css');
    const content = fs.readFileSync(drawerPath, 'utf-8');
    expect(content).toContain('@media (prefers-reduced-motion: reduce)');
    expect(content).toMatch(/\.tx-history-drawer\s*\{[^}]*animation:\s*none;[^}]*transform:\s*none;/);
  });

  it('renders BountyDetailSkeleton with inline reduced-motion support and accessibility attributes', () => {
    const markup = renderToStaticMarkup(React.createElement(BountyDetailSkeleton));
    expect(markup).toContain('@media (prefers-reduced-motion: reduce)');
    expect(markup).toContain('animation: none');
    expect(markup).toContain('opacity: 0.75');
    expect(markup).toContain('aria-busy="true"');
  });

  it('renders PageSkeleton with inline reduced-motion support and accessibility attributes', () => {
    const markup = renderToStaticMarkup(React.createElement(PageSkeleton));
    expect(markup).toContain('@media (prefers-reduced-motion: reduce)');
    expect(markup).toContain('animation: none');
    expect(markup).toContain('opacity: 0.75');
    expect(markup).toContain('aria-busy="true"');
  });
});
