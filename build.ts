// build.ts

import path from "path";
import fs from "fs";
import { ArenaChannel, ArenaItem } from "./types/arena-types";
import { renderHomePage, renderItemPage } from "./scripts/template";
import { copyDirectory } from "./utils/file";

// Constants
const BUILD_DIR = path.resolve(process.cwd(), "build");

/**
 * Ensures the build directory exists and is empty
 */
export function prepareBuildDirectory(): void {
  // Create build directory if it doesn't exist
  if (!fs.existsSync(BUILD_DIR)) {
    try {
      fs.mkdirSync(BUILD_DIR, { recursive: true });

      // Verify directory was created
      if (fs.existsSync(BUILD_DIR)) {
        console.log(`Build directory created at: ${BUILD_DIR}`);
      } else {
        console.error(
          `Failed to create build directory even though no error was thrown`,
        );
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
    console.log(`Cleared existing build directory content`);
  }

  // Create public directories in build
  const publicBuildDir = path.join(BUILD_DIR, "public");
  fs.mkdirSync(publicBuildDir, { recursive: true });
}

/**
 * Copies static assets to the build directory
 * @param srcDir Source directory for static assets
 */
export function copyStaticAssets(srcDir: string): void {
  // Copy static assets to the build root
  copyDirectory(path.join(srcDir, "public"), BUILD_DIR);
  console.log("Static assets copied to build directory");
}

/**
 * Generates the home page and writes it to the build directory
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 */
export function generateHomePage(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): void {
  const homeHtml = renderHomePage(channelData, slugMap, templatesDir);

  // Write home page to build directory
  fs.writeFileSync(path.join(BUILD_DIR, "index.html"), homeHtml);
  console.log("Home page generated successfully");
}

/**
 * Generates item pages and writes them to the build directory
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @param channelData Channel data from Arena (Added this parameter)
 */
export async function generateItemPages(
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
  channelData: ArenaChannel, // Added channelData here
): Promise<void> {
  for (const [slug, item] of slugMap.entries()) {
    const itemDirectory = path.join(BUILD_DIR, slug);
    fs.mkdirSync(itemDirectory, { recursive: true });

    // Now channelData is available here
    const itemHtml = await renderItemPage(
      channelData,
      item,
      slugMap,
      templatesDir,
    );

    // Write item page to build directory
    fs.writeFileSync(path.join(itemDirectory, "index.html"), itemHtml);
  }

  console.log(`Generated ${slugMap.size} item pages`);
}

/**
 * Main function to generate all static pages
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param sourceDir Source directory for static assets and templates
 */
export async function generateStaticPages(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  sourceDir: string,
): Promise<void> {
  try {
    if (!channelData) {
      throw new Error(
        "Cannot generate static pages: Channel data not available",
      );
    }

    const templatesDir = path.join(sourceDir, "views");

    // Prepare build directory
    prepareBuildDirectory();

    // Copy static assets
    copyStaticAssets(sourceDir);

    // Generate home page
    generateHomePage(channelData, slugMap, templatesDir);

    // Generate item pages - Pass channelData here
    await generateItemPages(slugMap, templatesDir, channelData);

    console.log(`Page generation completed at: ${new Date().toISOString()}`);
  } catch (err) {
    console.error("Error generating static pages:", err);
    throw err;
  }
}
