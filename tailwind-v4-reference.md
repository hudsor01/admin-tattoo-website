# Tailwind CSS v4 Utility Reference

This reference guide contains key information about Tailwind CSS v4 utilities, extracted from the official documentation.

## Table of Contents
- [Flexbox Utilities](#flexbox-utilities)
- [Grid Utilities](#grid-utilities)
- [Spacing Utilities](#spacing-utilities)
- [Sizing Utilities](#sizing-utilities)
- [Typography Utilities](#typography-utilities)

## Flexbox Utilities

### flex-basis
Controls the initial size of flex items.

**v4 Syntax:**
- `basis-<number>` - Uses spacing scale: `flex-basis: calc(var(--spacing) * <number>)`
- `basis-<fraction>` - Percentage: `flex-basis: calc(<fraction> * 100%)`
- `basis-full` - 100%
- `basis-auto` - auto
- Container scale: `basis-3xs` through `basis-7xl`
- Custom: `basis-[<value>]` or `basis-(<custom-property>)`

**Key v4 Features:**
- New container scale utilities (3xs through 7xl)
- CSS variable syntax with parentheses: `basis-(--my-basis)`
- Supports arbitrary values with square brackets

### flex-direction
Controls the direction of flex items.

**v4 Syntax:**
- `flex-row` - Default horizontal direction
- `flex-row-reverse` - Reversed horizontal
- `flex-col` - Vertical direction
- `flex-col-reverse` - Reversed vertical

**No significant changes from v3**

### flex-wrap
Controls how flex items wrap.

**v4 Syntax:**
- `flex-nowrap` - Prevent wrapping
- `flex-wrap` - Allow wrapping
- `flex-wrap-reverse` - Wrap in reverse

**No significant changes from v3**

### flex
Controls how flex items grow and shrink.

**v4 Syntax:**
- `flex-<number>` - Sets flex shorthand: `flex: <number>`
- `flex-<fraction>` - Percentage: `flex: calc(<fraction> * 100%)`
- `flex-auto` - `flex: 1 1 auto`
- `flex-initial` - `flex: 0 1 auto`
- `flex-none` - `flex: none`
- Custom: `flex-[<value>]` or `flex-(<custom-property>)`

**Key v4 Features:**
- New fraction-based flex values
- CSS variable syntax support

### flex-grow
Controls how flex items grow.

**v4 Syntax:**
- `grow` - `flex-grow: 1`
- `grow-<number>` - Sets grow factor
- `grow-0` - Prevents growing
- Custom: `grow-[<value>]` or `grow-(<custom-property>)`

**Key v4 Change:** 
- Simplified class name from `flex-grow-*` to `grow-*`

### flex-shrink
Controls how flex items shrink.

**v4 Syntax:**
- `shrink` - `flex-shrink: 1`
- `shrink-<number>` - Sets shrink factor
- `shrink-0` - Prevents shrinking
- Custom: `shrink-[<value>]` or `shrink-(<custom-property>)`

**Key v4 Change:**
- Simplified class name from `flex-shrink-*` to `shrink-*`

## Grid Utilities

### grid-template-columns
Specifies columns in a grid layout.

**v4 Syntax:**
- `grid-cols-<number>` - Equal columns: `repeat(<number>, minmax(0, 1fr))`
- `grid-cols-none` - No grid template
- `grid-cols-subgrid` - Subgrid support
- Custom: `grid-cols-[<value>]` or `grid-cols-(<custom-property>)`

**Key v4 Features:**
- Native subgrid support with `grid-cols-subgrid`
- CSS variable syntax

### grid-column
Controls sizing and placement across grid columns.

**v4 Syntax:**
- `col-span-<number>` - Span columns
- `col-span-full` - Span all columns (`1 / -1`)
- `col-start-<number>`, `col-end-<number>` - Start/end positions
- Negative values: `-col-start-<number>`
- Custom: `col-[<value>]`, `col-span-[<value>]`, etc.

**Key v4 Features:**
- Negative grid line support
- More flexible arbitrary value syntax

### grid-template-rows
Specifies rows in a grid layout.

**v4 Syntax:**
- `grid-rows-<number>` - Equal rows
- `grid-rows-none` - No grid template
- `grid-rows-subgrid` - Subgrid support
- Custom: `grid-rows-[<value>]` or `grid-rows-(<custom-property>)`

**Key v4 Features:**
- Native subgrid support

### grid-row
Controls sizing and placement across grid rows.

**v4 Syntax:**
- `row-span-<number>` - Span rows
- `row-span-full` - Span all rows
- `row-start-<number>`, `row-end-<number>` - Start/end positions
- Negative values: `-row-start-<number>`
- Custom: `row-[<value>]`, etc.

### grid-auto-flow
Controls auto-placement algorithm.

**v4 Syntax:**
- `grid-flow-row` - Row-wise placement
- `grid-flow-col` - Column-wise placement
- `grid-flow-dense` - Dense packing
- `grid-flow-row-dense`, `grid-flow-col-dense` - Combined

**No significant changes from v3**

## Spacing Utilities

### padding
Controls element padding.

**v4 Syntax:**
- `p-<number>` - All sides: `calc(var(--spacing) * <number>)`
- `px-<number>`, `py-<number>` - Horizontal/vertical
- `pt-<number>`, `pr-<number>`, `pb-<number>`, `pl-<number>` - Individual sides
- `ps-<number>`, `pe-<number>` - Logical properties (start/end)
- `p-px` - 1px padding
- Custom: `p-[<value>]` or `p-(<custom-property>)`

**Key v4 Features:**
- Logical properties with `ps-*` and `pe-*` (padding-inline-start/end)
- Uses CSS logical properties by default for `px-*` and `py-*`

### margin
Controls element margins and spacing between children.

**v4 Syntax:**
- `m-<number>` - All sides
- `mx-<number>`, `my-<number>` - Horizontal/vertical
- `mt-<number>`, `mr-<number>`, `mb-<number>`, `ml-<number>` - Individual sides
- `ms-<number>`, `me-<number>` - Logical properties
- Negative values: `-m-<number>`, etc.
- `m-auto` - Auto margins
- `space-x-<number>`, `space-y-<number>` - Space between children
- `space-x-reverse`, `space-y-reverse` - Reverse spacing

**Key v4 Features:**
- Logical properties with `ms-*` and `me-*`
- Improved space utilities implementation

### gap
Controls gutters in grid and flexbox.

**v4 Syntax:**
- `gap-<number>` - Both axes: `calc(var(--spacing) * <value>)`
- `gap-x-<number>` - Column gap
- `gap-y-<number>` - Row gap
- Custom: `gap-[<value>]` or `gap-(<custom-property>)`

**Key v4 Features:**
- Works with both Grid and Flexbox (v3 had some limitations)
- Consistent spacing scale usage

## Sizing Utilities

### width
Controls element width.

**v4 Syntax:**
- `w-<number>` - Spacing scale: `calc(var(--spacing) * <number>)`
- `w-<fraction>` - Percentage: `calc(<fraction> * 100%)`
- Container scale: `w-3xs` through `w-7xl`
- `w-full` - 100%
- `w-screen` - 100vw
- Viewport units: `w-dvw`, `w-lvw`, `w-svw` (dynamic/large/small)
- Content-based: `w-min`, `w-max`, `w-fit`
- `size-<number>` - Sets both width and height
- Custom: `w-[<value>]` or `w-(<custom-property>)`

**Key v4 Features:**
- New viewport units (dvw, lvw, svw)
- Container scale utilities
- Combined `size-*` utilities for width + height

### height
Controls element height.

**v4 Syntax:**
- `h-<number>` - Spacing scale
- `h-<fraction>` - Percentage
- `h-full` - 100%
- `h-screen` - 100vh
- Viewport units: `h-dvh`, `h-lvh`, `h-svh`
- Content-based: `h-min`, `h-max`, `h-fit`
- `h-lh` - Line height unit
- Custom: `h-[<value>]` or `h-(<custom-property>)`

**Key v4 Features:**
- Dynamic viewport units for mobile-friendly layouts
- Line height unit support (`h-lh`)

### min-width
Controls minimum width.

**v4 Syntax:**
- `min-w-<number>` - Spacing scale
- `min-w-<fraction>` - Percentage
- Container scale: `min-w-3xs` through `min-w-7xl`
- `min-w-full` - 100%
- Content-based: `min-w-min`, `min-w-max`, `min-w-fit`
- Custom: `min-w-[<value>]` or `min-w-(<custom-property>)`

### max-width
Controls maximum width.

**v4 Syntax:**
- `max-w-<number>` - Spacing scale
- `max-w-<fraction>` - Percentage
- Container scale: `max-w-3xs` through `max-w-7xl`
- `max-w-none` - No max width
- `max-w-full` - 100%
- `container` - Responsive container utility
- Custom: `max-w-[<value>]` or `max-w-(<custom-property>)`

**Key v4 Features:**
- `container` utility now part of max-width utilities
- Container doesn't auto-center (use with `mx-auto`)

### min-height & max-height
Similar patterns to width utilities, with viewport units and content-based sizing.

## Typography Utilities

### font-family
Controls font family.

**v4 Syntax:**
- `font-sans` - Sans-serif stack
- `font-serif` - Serif stack
- `font-mono` - Monospace stack
- Custom: `font-[<value>]` or `font-(family-name:<custom-property>)`

**Key v4 Features:**
- Support for font-feature-settings and font-variation-settings via theme
- Better @font-face integration

### font-size
Controls font size and optionally line height.

**v4 Syntax:**
- `text-xs` through `text-9xl` - Predefined sizes
- `text-<size>/<line-height>` - Size with line height (e.g., `text-sm/6`)
- Custom: `text-[<value>]` or `text-(length:<custom-property>)`

**Key v4 Features:**
- Combined font-size/line-height syntax
- Each size has default line height, letter spacing, and font weight options

### font-weight
Controls font weight.

**v4 Syntax:**
- `font-thin` (100) through `font-black` (900)
- Custom: `font-[<value>]` or `font-(<custom-property>)`

**No significant changes from v3**

### letter-spacing
Controls letter spacing (tracking).

**v4 Syntax:**
- `tracking-tighter` through `tracking-widest`
- Negative values with dash prefix
- Custom: `tracking-[<value>]` or `tracking-(<custom-property>)`

**Key v4 Features:**
- Em-based default values for better scaling

### line-height
Controls line height (leading).

**v4 Syntax:**
- Combined with font-size: `text-<size>/<number>`
- Independent: `leading-<number>` or `leading-none`
- Custom: `leading-[<value>]` or `leading-(<custom-property>)`

**Key v4 Features:**
- Preference for combined font-size/line-height syntax
- Spacing scale integration for `leading-<number>`

## Key v4 Changes Summary

1. **CSS Variable Syntax**: New `utility-(<custom-property>)` syntax for all utilities
2. **Logical Properties**: Built-in support for RTL with `ps-*`, `pe-*`, `ms-*`, `me-*`
3. **Container Scale**: New responsive size scale (3xs through 7xl) for width utilities
4. **Viewport Units**: Dynamic (dvw/dvh), large (lvw/lvh), and small (svw/svh) viewport units
5. **Simplified Names**: Some utilities shortened (e.g., `flex-grow` → `grow`)
6. **Subgrid Support**: Native CSS subgrid with `grid-cols-subgrid` and `grid-rows-subgrid`
7. **Combined Utilities**: `size-*` for width+height, `text-size/line-height` syntax
8. **Theme Integration**: Better CSS custom property integration throughout

## Migration Tips

- Most v3 utilities work in v4 with minimal changes
- Main updates are new features rather than breaking changes
- Consider adopting logical properties for better RTL support
- Take advantage of new viewport units for mobile-responsive designs
- Use the new CSS variable syntax for dynamic theming