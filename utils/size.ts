// This script measures the total download size of each page by:
// 1. Parsing HTML to find all linked resources (CSS, JS, images, favicons)
// 2. Calculating compressed sizes for text assets (HTML, CSS, JS) using GZIP
// 3. Using raw file sizes for binary assets (images, favicons)
// 4. Summing all sizes to simulate the complete network transfer weight
// 5. Updating each page with its total size in kilobytes
// This provides visitors with an accurate representation of how much data they downloaded.

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { JSDOM } from "jsdom";

/**
 * Measures the total size of a page including all its resources
 * @param filePath Path to the HTML file to measure
 * @param basePath Base directory to look for resources
 */
export function measurePageSize(
  filePath: string,
  basePath: string = path.dirname(filePath),
): void {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, "utf8");

    // Parse the HTML to extract resource references
    const dom = new JSDOM(content);
    const document = dom.window.document;

    // Start with the HTML file size
    let totalSize = getCompressedSize(content);
    const resources: { type: string; path: string; size: number }[] = [];

    // Track CSS files
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        const resourcePath = path.resolve(
          basePath,
          href.startsWith("/") ? path.join(basePath, "..", href) : href,
        );
        if (fs.existsSync(resourcePath)) {
          const size = getCompressedFileSize(resourcePath);
          totalSize += size;
          resources.push({ type: "CSS", path: href, size });
        }
      }
    });

    // Track JavaScript files
    const scripts = document.querySelectorAll("script");
    scripts.forEach((script) => {
      const src = script.getAttribute("src");
      if (src) {
        const resourcePath = path.resolve(
          basePath,
          src.startsWith("/") ? path.join(basePath, "..", src) : src,
        );
        if (fs.existsSync(resourcePath)) {
          const size = getCompressedFileSize(resourcePath);
          totalSize += size;
          resources.push({ type: "JS", path: src, size });
        }
      }
    });

    // Track images
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.getAttribute("src");
      if (src) {
        const resourcePath = resolveResourcePath(src, basePath);

        if (fs.existsSync(resourcePath)) {
          const size = getFileSize(resourcePath); // Images are usually already compressed
          totalSize += size;
          resources.push({ type: "Image", path: src, size });
        }
      }
    });

    // Track favicon files
    const favicons = document.querySelectorAll(
      'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], link[rel="shortcut icon"]',
    );
    favicons.forEach((favicon) => {
      const href = favicon.getAttribute("href");
      if (href) {
        const resourcePath = path.resolve(
          basePath,
          href.startsWith("/") ? path.join(basePath, "..", href) : href,
        );
        if (fs.existsSync(resourcePath)) {
          const size = getFileSize(resourcePath);
          totalSize += size;
          resources.push({ type: "Favicon", path: href, size });
        }
      }
    });

    // Track metadata (open graph images, etc.)
    const metaTags = document.querySelectorAll(
      'meta[property^="og:image"], meta[name="twitter:image"]',
    );
    metaTags.forEach((meta) => {
      const content = meta.getAttribute("content");
      if (content && content.startsWith("/")) {
        // Only process local files, not external URLs
        const resourcePath = path.resolve(
          basePath,
          content.startsWith("/")
            ? path.join(basePath, "..", content)
            : content,
        );
        if (fs.existsSync(resourcePath)) {
          const size = getFileSize(resourcePath);
          totalSize += size;
          resources.push({ type: "Metadata", path: content, size });
        }
      }
    });

    // Track any other head resources like preload, prefetch
    const headResources = document.querySelectorAll(
      'link[rel="preload"], link[rel="prefetch"], link[rel="dns-prefetch"], link[rel="preconnect"]',
    );
    headResources.forEach((resource) => {
      const href = resource.getAttribute("href");
      if (href && !href.startsWith("http") && !href.startsWith("//")) {
        // Only process local files, not external URLs
        const resourcePath = path.resolve(
          basePath,
          href.startsWith("/") ? path.join(basePath, "..", href) : href,
        );
        if (fs.existsSync(resourcePath)) {
          const size = getFileSize(resourcePath);
          totalSize += size;
          resources.push({ type: "HeadResource", path: href, size });
        }
      }
    });

    // Calculate total size in KB (to 1 decimal place)
    const totalSizeKB = (totalSize / 1024).toFixed(1);

    // Replace the size placeholder in the HTML
    const updated = content.replace(
      /<p class="size">.*?<\/p>/,
      `<p class="size">${totalSizeKB} KB</p>`,
    );

    // Write the updated content back to the file
    fs.writeFileSync(filePath, updated);
  } catch (error) {
    console.error(`Error measuring page size for ${filePath}:`, error);
  }
}

/**
 * Gets the compressed size of a string
 */
function getCompressedSize(content: string): number {
  return zlib.gzipSync(Buffer.from(content)).length;
}

/**
 * Gets the compressed size of a file
 */
function getCompressedFileSize(filePath: string): number {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

/**
 * Gets the raw size of a file (for already compressed formats)
 */
function getFileSize(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Process all HTML files in a directory
 */
export function processDirectory(directory: string): void {
  const buildDir = path.resolve(directory);

  // Check if the build directory exists
  if (!fs.existsSync(buildDir)) {
    return;
  }

  // Process index.html in the root
  const indexPath = path.join(buildDir, "index.html");
  if (fs.existsSync(indexPath)) {
    measurePageSize(indexPath, buildDir);
  } else {
    console.warn(`Index file not found: ${indexPath}`);
  }

  try {
    // Process subdirectories (for item pages)
    fs.readdirSync(buildDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .forEach((dirent) => {
        const itemIndexPath = path.join(buildDir, dirent.name, "index.html");
        if (fs.existsSync(itemIndexPath)) {
          measurePageSize(itemIndexPath, path.join(buildDir, dirent.name));
        }
      });
  } catch (error) {
    console.error(`Error processing subdirectories in ${buildDir}:`, error);
  }
}

function resolveResourcePath(src, basePath) {
  // Skip external URLs
  if (src.startsWith("http") || src.startsWith("//")) {
    return "";
  }

  // For absolute paths (starting with /)
  if (src.startsWith("/")) {
    // First try the normal resolution
    const normalPath = path.resolve(basePath, "..", src.slice(1));

    // If it exists, return it
    if (fs.existsSync(normalPath)) {
      return normalPath;
    }

    // Otherwise try alternative resolutions
    const altPaths = [
      path.resolve(process.cwd(), "build", src.slice(1)), // Try from build root
      path.resolve(process.cwd(), src.slice(1)), // Try from project root
    ];

    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        return altPath;
      }
    }

    // Fall back to original behavior
    return normalPath;
  }

  // For relative paths (not starting with /)
  return path.resolve(basePath, src);
}

// Main execution - directly process the directory passed as an argument
const directory = process.argv[2] || "./build";
processDirectory(directory);
