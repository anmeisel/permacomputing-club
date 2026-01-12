# Entangled Documentation

This directory contains literate programming documentation for the Permacomputing Club website.

## What's Here

-   **GETTING-STARTED.md** - Complete guide to using Entangled in this project
-   **build-system.md** - Literate documentation of the static site generator (`build.ts`)
-   **file-utilities.md** - Documentation of filesystem utilities (`utils/file.ts`)

## Quick Start

```bash
# Watch mode (auto-sync docs to code)
entangled watch

# Or tangle once
entangled tangle

# Or update docs from code
entangled stitch
```

## Recommended Workflow

For this project, we recommend **Option A** for non-coders from GETTING-STARTED.md:

1. Keep your source code or project files as the source of truth
2. Use these markdown files for explanatory documentation
3. Don't worry about auto-syncing with Entangled
4. Think of these as "expanded comments" that explain architecture

This way you get the benefits of literate programming (clear explanations) without the complexity of keeping files in perfect sync.

## What to Document Next

Priority files for literate documentation:

1. **build.ts** - Build system ✅
2. **utils/file.ts** - File utilities ✅
3. **scripts/template.ts** - Template rendering system
4. **scripts/arena.ts** - Are.na API integration
5. **index.ts** - Main entry point and orchestration
6. **utils/index.ts** - Markdown and utility functions

## Documentation Style Guide

When creating new literate documentation:

-   **Start with WHY**: Explain the purpose before diving into code
-   **Use narrative structure**: Tell a story about how the code works
-   **Break code into logical chunks**: Use `<<descriptive-names>>`
-   **Include diagrams or examples** where helpful

## Example Code Block Syntax

```markdown
# My Feature

This explains what the feature does...

\`\`\` {.typescript file=my-feature.ts}
<<imports>>
<<main-logic>>
\`\`\`

Now I'll define each chunk:

\`\`\` {.typescript #imports}
import fs from "fs";
\`\`\`

\`\`\` {.typescript #main-logic}
export function myFeature() {
// implementation
}
\`\`\`
```

## Resources

-   [Entangled Documentation](https://entangled.github.io/)
-   [Literate Programming (Wikipedia)](https://en.wikipedia.org/wiki/Literate_programming)
-   [Permacomputing Principles](https://permacomputing.net/Principles/)
