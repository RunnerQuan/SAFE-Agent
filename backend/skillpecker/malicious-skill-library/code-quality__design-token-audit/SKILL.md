---
name: design-token-audit
description: Audit SCSS/CSS for hardcoded values and suggest design tokens
trigger: automatic
---

# Design Token Audit Skill

This skill audits stylesheets for hardcoded values and suggests replacements with design system tokens.

## Purpose

Audit SCSS/CSS files for hardcoded values (colors, spacing, typography) and suggest replacements with Southleft design system tokens.

## Trigger Conditions

- **Automatic**: When `.css` or `.scss` files are edited
- **Manual**: Invoked by `/check-design` command

## Actions

1. **Scan Stylesheets**:
   - Locate SCSS files in `src/assets/css/`
   - Search for hardcoded values:
     - Hex color values (e.g., `#ffffff`, `#000000`)
     - RGB/RGBA color values
     - Pixel spacing values (e.g., `12px`, `24px`, `48px`)
     - Font size values
     - Font family names

2. **Knowledge Query**:
   - Use `mcp_southleft-ds-mcp_search_design_knowledge` to find relevant tokens for:
     - **Color**: Search for color tokens matching or similar to hardcoded hex values
     - **Spacing (Layout)**: Search for spacing tokens matching pixel values
     - **Typography**: Search for font family and size tokens

3. **Comparison & Analysis**:
   - Compare local hardcoded values with available Southleft tokens
   - Identify exact matches or close approximations
   - Note values that don't have token equivalents

4. **Suggest Replacements**:
   - Propose CSS variable replacements using Southleft tokens
   - Provide before/after examples:
     ```scss
     // Before
     color: #1a1a1a;
     margin: 24px;
     
     // After
     color: var(--sl-color-text-primary);
     margin: var(--sl-spacing-lg);
     ```

5. **Interactive States Check**:
   - Check buttons and links for missing hover/focus/active states
   - Propose CSS to add smooth transitions if missing
   - Ensure `:focus-visible` states are implemented for keyboard accessibility

## Implementation Details

- Focus on `src/assets/css/` directory
- Look for common spacing patterns (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- Consider color variations and shades
- Check for typography scale consistency

## Notes

- Not all hardcoded values need to be replaced (some may be intentional)
- Suggest tokens that match the design intent, not just the exact value
- This skill helps maintain design system consistency across the portfolio
- The Southleft design system MCP provides access to the token library
