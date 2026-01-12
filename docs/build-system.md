# Static Site Build System

This document explains the build system for the Permacomputing Club website using literate programming with Entangled.

## Overview

The build system generates static HTML pages from Arena channel data. It follows a simple pipeline:

1. Prepare the build directory
2. Copy static assets (CSS, JS)
3. Generate HTML pages (home, items, 404)
4. Measure page sizes

## Main Build File

The core build functionality is organized into a set of functions that work together to generate the static site.

``` {.typescript file=build.ts}
<<build-imports>>

<<build-constants>>

<<prepare-build-directory>>

<<copy-static-assets>>

<<generate-home-page>>

<<generate-item-pages>>

<<generate-404-page>>

<<generate-static-pages>>
```

### Imports and Setup

We need several Node.js modules and our custom types and utilities:

``` {.typescript #build-imports}
import path from "path";
import fs from "fs";
import { ArenaChannel, ArenaItem } from "./types/arena-types";
import {
  renderHomePage,
  renderItemPage,
  render404Page,
} from "./scripts/template";
import { copyDirectory } from "./utils/file";
import { measurePageSize } from "./utils/size";
```

The build directory is where all generated files go:

``` {.typescript #build-constants}
const BUILD_DIR = path.resolve(process.cwd(), "build");
```

## Build Directory Preparation

Before building, we need a clean workspace. This function ensures the build directory exists and is empty (excluding version control).

``` {.typescript #prepare-build-directory}
/**
 * Ensures the build directory exists and is empty
 */
export function prepareBuildDirectory(): void {
  <<check-or-create-build-dir>>

  <<create-public-subdirs>>
}
```

### Directory Creation Logic

If the directory doesn't exist, create it. Otherwise, clear its contents:

``` {.typescript #check-or-create-build-dir}
// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  try {
    fs.mkdirSync(BUILD_DIR, { recursive: true });

    // Verify directory was created
    if (!fs.existsSync(BUILD_DIR)) {
      console.error(`error`);
      throw new Error("Build directory creation failed silently");
    }
  } catch (err) {
    console.error(`Error creating build directory:`, err);
    throw err;
  }
} else {
  // Clear existing build directory content
  fs.readdirSync(BUILD_DIR).forEach((file) => {
    const filePath = path.join(BUILD_DIR, file);
    if (file !== "node_modules" && file !== ".git") {
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
}
```

### Public Directory Structure

Create the necessary subdirectories for static assets:

``` {.typescript #create-public-subdirs}
// Create public directories in build
const publicBuildDir = path.join(BUILD_DIR, "public");
fs.mkdirSync(publicBuildDir, { recursive: true });
```

## Static Assets

CSS, JavaScript, and other static files need to be copied to the build directory:

``` {.typescript #copy-static-assets}
/**
 * Copies static assets to the build directory
 * @param srcDir Source directory for static assets
 */
export function copyStaticAssets(srcDir: string): void {
  // Copy static assets to the build root
  copyDirectory(path.join(srcDir, "public"), BUILD_DIR);
}
```

## Page Generation

### Home Page

The home page lists all content in reverse chronological order:

``` {.typescript #generate-home-page}
/**
 * Generates the home page and writes it to the build directory
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 */
export async function generateHomePage(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string
): Promise<void> {
  const homeHtml = await renderHomePage(channelData, slugMap, templatesDir);
  const homeFilePath = path.join(BUILD_DIR, "index.html");

  // Write home page to build directory
  fs.writeFileSync(homeFilePath, homeHtml);

  // Measure and update page size
  measurePageSize(homeFilePath);
}
```

### Individual Item Pages

Each Arena block gets its own page with a clean URL structure:

``` {.typescript #generate-item-pages}
/**
 * Generates item pages and writes them to the build directory
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @param channelData Channel data from Arena
 */
export async function generateItemPages(
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
  channelData: ArenaChannel // Added channelData here
): Promise<void> {
  for (const [slug, item] of slugMap.entries()) {
    const itemDirectory = path.join(BUILD_DIR, slug);
    fs.mkdirSync(itemDirectory, { recursive: true });

    // Now channelData is available here
    const itemHtml = await renderItemPage(
      channelData,
      item,
      slugMap,
      templatesDir
    );

    const itemFilePath = path.join(itemDirectory, "index.html");

    // Write item page to build directory
    fs.writeFileSync(itemFilePath, itemHtml);

    // Measure and update page size
    measurePageSize(itemFilePath);
  }
}
```

### 404 Error Page

Handle missing pages gracefully:

``` {.typescript #generate-404-page}
/**
 * Generates the 404 page and writes it to the build directory
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 */
export function generate404Page(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string
): void {
  const notFoundHtml = render404Page(channelData, slugMap, templatesDir);
  const notFoundFilePath = path.join(BUILD_DIR, "404.html");

  // Write 404 page to build directory
  fs.writeFileSync(notFoundFilePath, notFoundHtml);

  // Measure and update page size
  measurePageSize(notFoundFilePath);
}
```

## Orchestration

The main function ties everything together:

``` {.typescript #generate-static-pages}
/**
 * Main function to generate all static pages
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param sourceDir Source directory for static assets and templates
 */
export async function generateStaticPages(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  sourceDir: string
): Promise<void> {
  try {
    if (!channelData) {
      throw new Error(
        "Cannot generate static pages: Channel data not available"
      );
    }

    const templatesDir = path.join(sourceDir, "views");

    // Prepare build directory
    prepareBuildDirectory();

    // Copy static assets
    copyStaticAssets(sourceDir);

    // Generate home page
    await generateHomePage(channelData, slugMap, templatesDir);

    // Generate item pages - Pass channelData here
    await generateItemPages(slugMap, templatesDir, channelData);

    // Generate 404 page
    generate404Page(channelData, slugMap, templatesDir);

    const completionTime = new Date().toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    console.log(`Page generation completed at: ${completionTime}`);
  } catch (err) {
    console.error("Error generating static pages:", err);
    throw err;
  }
}
```

## Usage

This module is imported and used by the main entry point (`index.ts`) which:

1. Fetches data from the Are.na channel
2. Generates slug mappings for clean URLs
3. Calls `generateStaticPages()` with the channel data

The generated static site can then be deployed to any static hosting service.
