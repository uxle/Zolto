/**
 * Zolto Built-in Reusable Components & Patterns — Phase 9
 *
 * Provides 12 standard built-in component patterns implemented using
 * Zolto component AST definitions:
 * - Card, StatCard, FeatureCard, AlertBox, HeroSection, SectionHeader,
 *   EmptyState, InfoPanel, ComparePanel, CallToAction, ProfileCard, DashboardTile
 *
 * SECURITY: every prop is document-author-controlled data, not engine-
 * generated markup, so it's escaped the same way any other user content
 * is escaped elsewhere in the renderer — escapeHtml() for text content,
 * escapeAttr() for anything placed in an href/src/class attribute value.
 * These templates previously interpolated props with no escaping at all,
 * which meant a title, class-driving prop (variant/trend/type), or link
 * (ctaLink/avatar) containing HTML or a javascript: URL would execute
 * as-is in the rendered output.
 */

import { createComponentDefNode, createSlotDefNode } from './ast.js';
import { parsePropDeclaration } from './props.js';
import { escapeHtml, escapeAttr } from '../tokenizer.js';

export function getBuiltinComponents() {
  const builtins = new Map();

  const register = (name, propDecls, slots, bodyHtmlFn) => {
    const props = propDecls.map(parsePropDeclaration);
    const slotNodes = slots.map(s => createSlotDefNode(s));
    const node = createComponentDefNode(name, props, slotNodes, [bodyHtmlFn], {
      author: 'Zolto System',
      version: '9.0.0',
      description: `Built-in ${name} component`,
    });
    builtins.set(name, node);
  };

  // 1. Card
  register('Card', ['title=""', 'subtitle=""', 'variant="default"'], ['default'], ctx => {
    return `<div class="zl-card zl-card-${escapeAttr(ctx.variant || 'default')}">` +
           (ctx.title ? `<h3 class="zl-card-title">${escapeHtml(ctx.title)}</h3>` : '') +
           (ctx.subtitle ? `<p class="zl-card-subtitle">${escapeHtml(ctx.subtitle)}</p>` : '') +
           `<div class="zl-card-body">{slot:default}</div></div>`;
  });

  // 2. StatCard
  register('StatCard', ['title=""', 'value=""', 'change=""', 'trend="neutral"'], [], ctx => {
    return `<div class="zl-stat-card zl-trend-${escapeAttr(ctx.trend)}">` +
           `<div class="zl-stat-title">${escapeHtml(ctx.title)}</div>` +
           `<div class="zl-stat-value">${escapeHtml(ctx.value)}</div>` +
           (ctx.change ? `<div class="zl-stat-change">${escapeHtml(ctx.change)}</div>` : '') +
           `</div>`;
  });

  // 3. FeatureCard
  register('FeatureCard', ['title=""', 'icon="★"', 'description=""'], ['default'], ctx => {
    return `<div class="zl-feature-card">` +
           `<div class="zl-feature-icon">${escapeHtml(ctx.icon)}</div>` +
           `<h4 class="zl-feature-title">${escapeHtml(ctx.title)}</h4>` +
           `<p class="zl-feature-desc">${ctx.description ? escapeHtml(ctx.description) : '{slot:default}'}</p></div>`;
  });

  // 4. AlertBox
  register('AlertBox', ['type="info"', 'title=""'], ['default'], ctx => {
    return `<div class="zl-alert-box zl-alert-${escapeAttr(ctx.type)}">` +
           (ctx.title ? `<strong class="zl-alert-title">${escapeHtml(ctx.title)}</strong>` : '') +
           `<div class="zl-alert-content">{slot:default}</div></div>`;
  });

  // 5. HeroSection
  register('HeroSection', ['title=""', 'subtitle=""', 'ctaText=""', 'ctaLink="#"'], ['default'], ctx => {
    return `<section class="zl-hero-section">` +
           `<h1 class="zl-hero-title">${escapeHtml(ctx.title)}</h1>` +
           (ctx.subtitle ? `<p class="zl-hero-subtitle">${escapeHtml(ctx.subtitle)}</p>` : '') +
           `<div class="zl-hero-content">{slot:default}</div>` +
           (ctx.ctaText ? `<a href="${escapeAttr(ctx.ctaLink)}" class="zl-hero-cta">${escapeHtml(ctx.ctaText)}</a>` : '') +
           `</section>`;
  });

  // 6. SectionHeader
  register('SectionHeader', ['title=""', 'badge=""'], [], ctx => {
    return `<div class="zl-section-header">` +
           (ctx.badge ? `<span class="zl-section-badge">${escapeHtml(ctx.badge)}</span>` : '') +
           `<h2 class="zl-section-title">${escapeHtml(ctx.title)}</h2></div>`;
  });

  // 7. EmptyState
  register('EmptyState', ['title="No Data"', 'message="Nothing to display"'], ['default'], ctx => {
    return `<div class="zl-empty-state">` +
           `<h4 class="zl-empty-title">${escapeHtml(ctx.title)}</h4>` +
           `<p class="zl-empty-msg">${escapeHtml(ctx.message)}</p>` +
           `<div class="zl-empty-actions">{slot:default}</div></div>`;
  });

  // 8. InfoPanel
  register('InfoPanel', ['title="Information"'], ['default'], ctx => {
    return `<div class="zl-info-panel">` +
           `<h4 class="zl-info-panel-title">${escapeHtml(ctx.title)}</h4>` +
           `<div class="zl-info-panel-body">{slot:default}</div></div>`;
  });

  // 9. ComparePanel
  register('ComparePanel', ['leftTitle="Before"', 'rightTitle="After"'], ['left', 'right'], ctx => {
    return `<div class="zl-compare-panel">` +
           `<div class="zl-compare-side"><div class="zl-compare-head">${escapeHtml(ctx.leftTitle)}</div>{slot:left}</div>` +
           `<div class="zl-compare-side"><div class="zl-compare-head">${escapeHtml(ctx.rightTitle)}</div>{slot:right}</div></div>`;
  });

  // 10. CallToAction
  register('CallToAction', ['title=""', 'buttonText="Get Started"'], ['default'], ctx => {
    return `<div class="zl-cta-block">` +
           `<h3 class="zl-cta-title">${escapeHtml(ctx.title)}</h3>` +
           `<div class="zl-cta-body">{slot:default}</div>` +
           `<button class="zl-cta-btn">${escapeHtml(ctx.buttonText)}</button></div>`;
  });

  // 11. ProfileCard
  register('ProfileCard', ['name=""', 'role=""', 'avatar=""'], ['default'], ctx => {
    return `<div class="zl-profile-card">` +
           (ctx.avatar ? `<img src="${escapeAttr(ctx.avatar)}" class="zl-profile-avatar" alt="${escapeAttr(ctx.name)}" />` : '') +
           `<h4 class="zl-profile-name">${escapeHtml(ctx.name)}</h4>` +
           `<span class="zl-profile-role">${escapeHtml(ctx.role)}</span>` +
           `<div class="zl-profile-bio">{slot:default}</div></div>`;
  });

  // 12. DashboardTile
  register('DashboardTile', ['label=""', 'value=""'], ['default'], ctx => {
    return `<div class="zl-dashboard-tile">` +
           `<div class="zl-tile-label">${escapeHtml(ctx.label)}</div>` +
           `<div class="zl-tile-value">${escapeHtml(ctx.value)}</div>` +
           `<div class="zl-tile-body">{slot:default}</div></div>`;
  });

  return builtins;
}
