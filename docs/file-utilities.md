# File Utilities

A collection of Node.js filesystem utilities for managing the build process.

## Design Philosophy

These utilities follow permacomputing principles:

- **Simple**: Pure functions with clear inputs and outputs
- **Efficient**: No unnecessary dependencies or complex abstractions
- **Resilient**: Graceful error handling and validation

## The Module

``` {.typescript file=utils/file.ts}
<<file-imports>>

<<copy-directory>>

<<ensure-directory>>

<<clear-directory>>

<<write-file-with-dirs>>
```

## Dependencies

We only need core Node.js modules:

``` {.typescript #file-imports}
import fs from "fs";
import path from "path";
```

## Copying Directories

Recursive directory copying is essential for copying static assets from `public/` to `build/`:

``` {.typescript #copy-directory}
/**
 * Copies a directory recursively
 * @param src Source directory path
 * @param dest Destination directory path
 */
export function copyDirectory(src: string, dest: string): void {
  <<ensure-destination-exists>>

  <<iterate-and-copy-entries>>
}
```

First, ensure the destination exists:

``` {.typescript #ensure-destination-exists}
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}
```

Then iterate through all entries and copy them recursively:

``` {.typescript #iterate-and-copy-entries}
const entries = fs.readdirSync(src, { withFileTypes: true });

for (const entry of entries) {
  const srcPath = path.join(src, entry.name);
  const destPath = path.join(dest, entry.name);

  if (entry.isDirectory()) {
    copyDirectory(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}
```

## Ensuring Directories Exist

Before writing files, we need to ensure parent directories exist:

``` {.typescript #ensure-directory}
/**
 * Ensures a directory exists, creating it if necessary
 * @param dir Directory path
 * @returns True if directory exists or was created, false otherwise
 */
export function ensureDirectoryExists(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return fs.existsSync(dir);
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
    return false;
  }
}
```

This function is **defensive**: it catches errors and returns a boolean rather than throwing, making it safer to use in build scripts.

## Clearing Directories

When rebuilding, we need to clear old content while preserving important files:

``` {.typescript #clear-directory}
/**
 * Clears all contents of a directory without removing the directory itself
 * @param dir Directory path
 * @param excludes List of file/folder names to exclude from deletion
 */
export function clearDirectory(dir: string, excludes: string[] = []): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  fs.readdirSync(dir).forEach((file) => {
    if (excludes.includes(file)) {
      return;
    }

    const filePath = path.join(dir, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
}
```

The `excludes` parameter is crucial for preserving `.git` and `node_modules` in the build directory.

## Writing Files with Auto-created Directories

A convenience function that combines directory creation and file writing:

``` {.typescript #write-file-with-dirs}
/**
 * Writes content to a file, creating any necessary directories
 * @param filePath Path to write the file
 * @param content Content to write
 */
export function writeFileWithDirs(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, content, "utf8");
}
```

This is especially useful when generating files in nested directory structures like `build/some-post/index.html`.

## Usage Examples

These utilities are used throughout the build process:

```typescript
// In build.ts
import { copyDirectory, writeFileWithDirs } from "./utils/file";

// Copy static assets
copyDirectory("public", "build");

// Write generated pages
writeFileWithDirs("build/about/index.html", htmlContent);
```

## Future Improvements

Potential enhancements aligned with permacomputing principles:

- Add file size tracking to monitor build efficiency
- Implement incremental copying (only changed files)
- Add checksums to verify file integrity
- Consider streaming for large files to reduce memory usage
