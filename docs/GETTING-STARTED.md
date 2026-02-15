# Getting Started with Entangled

This guide helps you start using Entangled for literate programming in the Permacomputing Club project.

## What is Entangled?

Entangled enables **literate programming** - writing code within narrative documentation. You can:

-   Explain your code's purpose and design decisions in prose
-   Break complex code into understandable chunks
-   Keep documentation and code synchronised
-   Generate actual source files from markdown documentation

## Two Workflows

### 1. Documentation-First (New Code)

Write markdown documentation with code blocks, then tangle into source files:

```bash
# Write docs/my-feature.md with code blocks
entangled tangle  # Generates source files
```

### 2. Code-First (Existing Code)

Keep existing code, write explanatory documentation alongside it:

1. Keep source files
2. Write literate documentation in `docs/` that explains the code
3. Manually keep them in sync, or use docs as high-level explanation

## What We Need

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

### Watch Mode

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

For more literate documentation:

1. **Core architecture** (`index.ts`, `build.ts`) - started
2. **Template system** (`scripts/template.ts`) - How rendering works
3. **Arena integration** (`scripts/arena.ts`) - API data fetching
4. **Utility functions** (`utils/`) - Reusable helpers

Start with files that need the most explanation or are most confusing to newcomers.

## Current Status

-   `entangled.toml` configured for TypeScript, JavaScript, HTML, CSS
-   `docs/` directory created
-   `docs/build-system.md` example created
-   More documentation coming...