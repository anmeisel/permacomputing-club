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
import http from "http";
import https from "https";

const ESTIMATED_EXTERNAL_IMAGE_SIZE = 300 * 1024; // Fallback size: 300KB. In case the HTTP HEAD request fails to determine the actual size of an external image.

/**
 * Get size of external resource using HTTP HEAD request
 */
function getExternalResourceSize(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.request(
      url,
      { method: "HEAD", timeout: 3000 },
      (res) => {
        const contentLength = res.headers["content-length"];
        if (contentLength) {
          resolve(parseInt(contentLength, 10));
        } else {
          resolve(ESTIMATED_EXTERNAL_IMAGE_SIZE);
        }
      },
    );

    req.on("error", () => resolve(ESTIMATED_EXTERNAL_IMAGE_SIZE));
    req.on("timeout", () => {
      req.destroy();
      resolve(ESTIMATED_EXTERNAL_IMAGE_SIZE);
    });

    req.end();
  });
}

/**
 * Measures the total size of a page including all its resources
 */
export async function measurePageSize(
  filePath,
  basePath = path.dirname(filePath),
) {
  try {
    // Read and parse HTML
    const content = fs.readFileSync(filePath, "utf8");
    const dom = new JSDOM(content);
    const document = dom.window.document;

    // Start with the HTML file size
    let totalSize = getCompressedSize(content);
    let allResources: Array<{
      type: string;
      path: string;
      size: number;
      external?: boolean;
    }> = [];
    let externalImages: string[] = [];

    // Process all resource types
    const resourceTypes = [
      {
        selector: 'link[rel="stylesheet"]',
        attribute: "href",
        type: "CSS",
        compressible: true,
      },
      {
        selector: "script[src]",
        attribute: "src",
        type: "JS",
        compressible: true,
      },
      {
        selector: "img",
        attribute: "src",
        type: "Image",
        compressible: false,
      },
      {
        selector:
          'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], link[rel="shortcut icon"]',
        attribute: "href",
        type: "Favicon",
        compressible: false,
      },
      {
        selector: 'meta[property^="og:image"], meta[name="twitter:image"]',
        attribute: "content",
        type: "Metadata",
        compressible: false,
        filter: (src) => src && src.startsWith("/"),
      },
      {
        selector:
          'link[rel="preload"], link[rel="prefetch"], link[rel="dns-prefetch"], link[rel="preconnect"]',
        attribute: "href",
        type: "HeadResource",
        compressible: false,
        filter: (src) =>
          src && !src.startsWith("http") && !src.startsWith("//"),
      },
    ];

    // Process each resource type
    resourceTypes.forEach(
      ({ selector, attribute, type, compressible, filter }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          const src = element.getAttribute(attribute);

          // Skip if src is missing or doesn't match filter
          if (!src || (filter && !filter(src))) return;

          // Handle external resources
          if (src.startsWith("http") || src.startsWith("//")) {
            if (type === "Image") {
              externalImages.push(src);
            }
            return;
          }

          const resourcePath = resolveResourcePath(src, basePath);
          if (resourcePath && fs.existsSync(resourcePath)) {
            const size = compressible
              ? getCompressedFileSize(resourcePath)
              : getFileSize(resourcePath);

            totalSize += size;
            allResources.push({ type, path: src, size });
          }
        });
      },
    );

    // Get sizes for external images
    let externalImageSizes = 0;
    if (externalImages.length > 0) {
      const sizes = await Promise.all(
        externalImages.map((url) => getExternalResourceSize(url)),
      );

      sizes.forEach((size, i) => {
        const numericSize =
          typeof size === "number" ? size : ESTIMATED_EXTERNAL_IMAGE_SIZE;
        externalImageSizes += numericSize;
        totalSize += numericSize;
        allResources.push({
          type: "Image",
          path: externalImages[i],
          size: numericSize,
          external: true,
        });
      });
    }

    // Update the page with the total size
    const totalSizeKB = (totalSize / 1024).toFixed(1);
    const updated = content.replace(
      /<p class="size">.*?<\/p>/,
      `<p class="size">${totalSizeKB} KB</p>` +
        (externalImages.length > 0
          ? ` <!-- Includes ${externalImages.length} external images (${(externalImageSizes / 1024).toFixed(1)} KB) -->`
          : ""),
    );

    fs.writeFileSync(filePath, updated);
  } catch (error) {
    console.error(`Error measuring page size for ${filePath}:`, error);
  }
}

/**
 * Resolves a resource path with fallbacks for different path types
 */
function resolveResourcePath(src, basePath) {
  if (!src || src.startsWith("http") || src.startsWith("//")) return "";

  const isAbsolute = src.startsWith("/");
  const pathsToTry = isAbsolute
    ? [
        path.resolve(basePath, "..", src.slice(1)),
        path.resolve(process.cwd(), "build", src.slice(1)),
        path.resolve(process.cwd(), src.slice(1)),
      ]
    : [path.resolve(basePath, src)];

  return pathsToTry.find((p) => fs.existsSync(p)) || pathsToTry[0];
}

/**
 * Gets the compressed size of a string
 */
function getCompressedSize(content) {
  return zlib.gzipSync(Buffer.from(content)).length;
}

/**
 * Gets the compressed size of a file
 */
function getCompressedFileSize(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

/**
 * Gets the raw size of a file (for already compressed formats)
 */
function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

/**
 * Process all HTML files in a directory
 */
export async function processDirectory(directory) {
  const buildDir = path.resolve(directory);
  if (!fs.existsSync(buildDir)) return;

  // Process root index.html
  const indexPath = path.join(buildDir, "index.html");
  if (fs.existsSync(indexPath)) {
    await measurePageSize(indexPath, buildDir);
  }

  // Process subdirectories
  try {
    const subdirs = fs
      .readdirSync(buildDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory());

    for (const dirent of subdirs) {
      const itemIndexPath = path.join(buildDir, dirent.name, "index.html");
      if (fs.existsSync(itemIndexPath)) {
        await measurePageSize(itemIndexPath, path.join(buildDir, dirent.name));
      }
    }
  } catch (error) {
    console.error(`Error processing subdirectories in ${buildDir}:`, error);
  }
}

// Main execution
const directory = process.argv[2] || "./build";
(async () => {
  await processDirectory(directory);
})();
