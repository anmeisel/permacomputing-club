# Getting Started with Entangled

This guide helps you start using Entangled for literate programming in the Permacomputing Club project.

## What is Entangled?

Entangled enables **literate programming** - writing code within narrative documentation. You can:

-   Explain your code's purpose and design decisions in prose
-   Break complex code into understandable chunks
-   Keep documentation and code synchronized
-   Generate actual source files from markdown documentation

## Two Workflows

### 1. Documentation-First (New Code)

Write markdown documentation with code blocks, then tangle into source files:

```bash
# Write docs/my-feature.md with code blocks
entangled tangle  # Generates source files
```

### 2. Code-First (Existing Code) - Our Current Approach

Keep your existing code, write explanatory documentation alongside it:

1. Keep your source files (`build.ts`, `utils/file.ts`, etc.)
2. Write literate documentation in `docs/` that explains the code
3. Manually keep them in sync, or use docs as high-level explanation

## What We've Set Up

1. **Configuration**: `entangled.toml` - Configures languages and watch paths
2. **Documentation Directory**: `docs/` - Contains literate programming documents
3. **Example**: `docs/build-system.md` - Shows how to document `build.ts`

## How to Use the Example

The `build-system.md`:

-   Tells the **story** of how the build system works
-   Code is broken into logical **named chunks** like `<<prepare-build-directory>>`
-   Chunks can reference other chunks, allowing top-down explanation
-   The full source can be **tangled** from the markdown

## Running Entangled

### Watch Mode (Recommended)

Keep markdown and code in sync automatically:

```bash
entangled watch
```

This watches your `docs/**/*.md` files for changes and tangles them into source code.

### Manual Tangling

Generate source files from markdown once:

```bash
entangled tangle
```

**Note**: This will conflict if source files already exist. Use `--force` to overwrite (be careful!).

### Stitching (Reverse Direction)

If you edit source files, update the markdown documentation:

```bash
entangled stitch
```

This updates code blocks in your markdown files to match the source code.

## Working with Existing Files

Since we have existing source files, here are your options:

### Option A: Documentation Only (Recommended)

Use markdown files as explanatory documentation without syncing:

-   Keep your source files as the source of truth
-   Write markdown docs to explain architecture and design
-   Don't worry about syncing with `tangle`/`stitch`
-   This is great for onboarding and understanding

### Option B: Full Sync with Caution

If you want true literate programming:

1. **Backup your code first!**
2. Decide which files to manage with Entangled
3. Remove those files temporarily
4. Run `entangled tangle` to generate them from markdown
5. Compare and verify they match
6. Use `entangled watch` to keep them synced

## What to Document Next

Good candidates for literate documentation:

1. **Core architecture** (`index.ts`, `build.ts`) - Already started!
2. **Template system** (`scripts/template.ts`) - How rendering works
3. **Arena integration** (`scripts/arena.ts`) - API data fetching
4. **Utility functions** (`utils/`) - Reusable helpers

Start with files that need the most explanation or are most confusing to newcomers.

## Example: Creating New Documentation

To document the template system:

1. Create `docs/template-system.md`
2. Write narrative explanation with code blocks:

```markdown
# Template System

Our templating uses simple variable substitution...

\`\`\` {.typescript file=scripts/template.ts}
<<template-imports>>

<<render-template-function>>
\`\`\`

\`\`\` {.typescript #template-imports}
import fs from "fs";
import path from "path";
\`\`\`
```

3. Either:
    - Keep it as documentation only (Option A)
    - Or tangle it and replace the source file (Option B)

## Tips

-   Use descriptive chunk names: `<<parse-markdown>>` not `<<func1>>`
-   Order doesn't matter - define chunks before or after you reference them
-   Break code into logical pieces that match your explanation
-   Include prose between code blocks to explain the "why"

## Resources

-   Entangled docs: https://entangled.github.io/
-   Literate programming: https://en.wikipedia.org/wiki/Literate_programming
-   Noweb syntax: http://www.cs.tufts.edu/~nr/noweb/

## Current Status

-   `entangled.toml` configured for TypeScript, JavaScript, HTML, CSS
-   `docs/` directory created
-   `docs/build-system.md` example created
-   Decide on workflow (Option A or B)
-   Document more core files as needed
