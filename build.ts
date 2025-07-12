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
      if (!fs.existsSync(BUILD_DIR)) {
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
}

/**
 * Generates the home page and writes it to the build directory
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 */
export async function generateHomePage(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): Promise<void> {
  const homeHtml = await renderHomePage(channelData, slugMap, templatesDir);
  const homeFilePath = path.join(BUILD_DIR, "index.html");

  // Write home page to build directory
  fs.writeFileSync(homeFilePath, homeHtml);

  // Measure and update page size
  measurePageSize(homeFilePath);
}

/**
 * Generates item pages and writes them to the build directory
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @param channelData Channel data from Arena
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

    const itemFilePath = path.join(itemDirectory, "index.html");

    // Write item page to build directory
    fs.writeFileSync(itemFilePath, itemHtml);

    // Measure and update page size
    measurePageSize(itemFilePath);
  }
}

/**
 * Generates the 404 page and writes it to the build directory
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 */
export function generate404Page(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): void {
  const notFoundHtml = render404Page(channelData, slugMap, templatesDir);
  const notFoundFilePath = path.join(BUILD_DIR, "404.html");

  // Write 404 page to build directory
  fs.writeFileSync(notFoundFilePath, notFoundHtml);

  // Measure and update page size
  measurePageSize(notFoundFilePath);
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
    await generateHomePage(channelData, slugMap, templatesDir);

    // Generate item pages - Pass channelData here
    await generateItemPages(slugMap, templatesDir, channelData);

    // Generate 404 page
    generate404Page(channelData, slugMap, templatesDir);

    console.log(`Page generation completed at: ${new Date().toISOString()}`);
  } catch (err) {
    console.error("Error generating static pages:", err);
    throw err;
  }
}
