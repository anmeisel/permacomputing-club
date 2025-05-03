// template.ts

import fs from "fs";
import path from "path";
import { ArenaItem, ArenaChannel } from "../types/arena-types";
import {
  generateSlug,
  processItemContent,
  processItemDescription,
  extractColourFromDescription,
} from "../utils";

/**
 * Renders a template with provided data
 * @param templatePath Path to the template file
 * @param data Data to inject into the template
 * @returns Rendered HTML
 */
export function renderTemplate(
  templatePath: string,
  data: Record<string, string | number>,
): string {
  try {
    // Read the template file
    let template = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders with actual data
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      template = template.replace(placeholder, String(value || ""));
    }

    return template;
  } catch (err) {
    console.error(`Error rendering template ${templatePath}:`, err);
    if (err instanceof Error) {
      throw new Error(`Template rendering failed: ${err.message}`);
    } else {
      throw new Error(`Template rendering failed: Unknown error`);
    }
  }
}

/**
 * Generate navigation links from the slug map
 * @param slugMap Map of slugs to ArenaItems
 * @returns HTML string of navigation links
 */
export function getNavigationLinks(slugMap: Map<string, ArenaItem>): string {
  const links = Array.from(slugMap.entries())
    .map(([slug, item]) => {
      const title = item.title || item.content || `Untitled #${item.id}`;
      const displayTitle =
        title.length > 30 ? title.substring(0, 30) + "..." : title;
      return `<li><a href="/${slug}">${displayTitle}</a></li>`;
    })
    .join("");

  return `<ul class="nav-links">${links}</ul>`;
}

/**
 * Renders the home page
 * @param channelData Arena channel data
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @returns Rendered HTML for home page
 */
export function renderHomePage(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): string {
  // Process all items to create blocks and identify pinned items
  const processedItems = channelData.contents.map((item: ArenaItem) => {
    // Prioritize title for display
    let displayTitle = "";

    // Check if item has a title and it's not empty
    if (item.title && item.title.trim() !== "") {
      displayTitle = item.title;
    }
    // If no title, fall back to content
    else if (item.content && item.content.trim() !== "") {
      // For content, limit to first 50 chars to avoid very long titles
      displayTitle =
        item.content.length > 50
          ? item.content.substring(0, 50) + "..."
          : item.content;
    }
    // Last resort - use ID with untitled prefix
    else {
      displayTitle = `Untitled #${item.id}`;
    }

    // Generate slug from the same source used for display title
    const slugSource =
      item.title && item.title.trim() !== ""
        ? item.title
        : item.content && item.content.trim() !== ""
          ? item.content
          : `untitled-${item.id}`;

    const slug = generateSlug(slugSource);

    // Process item description ONCE to get both HTML and isPinned
    const { html: itemDescription, isPinned } = item.description
      ? processItemDescription(item.description)
      : { html: "", isPinned: false }; // Ensure the fallback provides both

    // Extract colour and border information from description if available
    const { backgroundColor, borderColor } = item.description
      ? extractColourFromDescription(item.description)
      : { backgroundColor: "", borderColor: "" }; // Ensure fallback provides both

    // Build the style attribute string
    let styleAttribute = "";
    const styles: string[] = [];
    if (backgroundColor) {
      styles.push(`background-color: ${backgroundColor}`);
    }
    if (borderColor) {
      styles.push(`border: 1px solid ${borderColor}`); // Example border style
    }
    if (styles.length > 0) {
      styleAttribute = ` style="${styles.join("; ")};"`;
    }

    // Create the HTML block for this item
    const blockHtml = `<div class="content-block${isPinned ? " pinned" : ""}" data-id="${item.id}"${styleAttribute}>
      <h2><a href="/${slug}">${displayTitle}</a></h2>
      ${itemDescription ? `<div class="item-description">${itemDescription}</div>` : ""}
    </div>`;

    return {
      html: blockHtml,
      isPinned,
      item,
    };
  });

  // Sort items to put pinned items at the top
  processedItems.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // Join all blocks together
  const blocks = processedItems.map((item) => item.html).join("");

  const pageContent = renderTemplate(
    path.join(templatesDir, "pages/home.html"),
    {
      channelTitle: channelData.title,
      totalBlocks: channelData.contents.length,
      // Pass the blocks HTML here, which already includes the description
      blocks: blocks,
    },
  );

  return renderTemplate(path.join(templatesDir, "layouts/main.html"), {
    channelTitle: channelData.title,
    navLinks: getNavigationLinks(slugMap),
    content: pageContent,
  });
}

/**
 * Renders an item page
 * @param item Arena item
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @returns Rendered HTML for item page
 */
export async function renderItemPage(
  channelData: ArenaChannel,
  item: ArenaItem,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): Promise<string> {
  // Process the main content
  const itemContent = await processItemContent(item);

  // Process the description if it exists
  const { html: itemDescription, isPinned } = item.description
    ? processItemDescription(item.description)
    : { html: "", isPinned: false };

  // Extract colour and border information from description if available
  const { backgroundColor, borderColor } = item.description
    ? extractColourFromDescription(item.description)
    : { backgroundColor: "", borderColor: "" }; // Ensure fallback provides both

  // Build the style attribute string
  let styleAttribute = "";
  const styles: string[] = [];
  if (backgroundColor) {
    styles.push(`background-color: ${backgroundColor}`);
  }
  if (borderColor) {
    styles.push(`border: 1px solid ${borderColor}`); // Example border style
  }
  if (styles.length > 0) {
    styleAttribute = ` style="${styles.join("; ")};"`;
  }

  // Prioritize title for display
  let displayTitle = "";

  // Check if item has a title and it's not empty
  if (item.title && item.title.trim() !== "") {
    displayTitle = item.title;
  }
  // If no title, fall back to content
  else if (item.content && item.content.trim() !== "") {
    // For content, limit to first 50 chars to avoid very long titles
    displayTitle =
      item.content.length > 50
        ? item.content.substring(0, 50) + "..."
        : item.content;
  }
  // Last resort - use ID with untitled prefix
  else {
    displayTitle = `Untitled #${item.id}`;
  }

  // We need to modify the item.html template to include an item-container div
  // that can receive our style attribute
  const pageContent = renderTemplate(
    path.join(templatesDir, "pages/item.html"),
    {
      channelTitle: channelData.title,
      itemTitle: displayTitle,
      itemContent: itemContent,
      itemDescription: itemDescription,
      itemId: item.id.toString(),
      styleAttribute: styleAttribute, // Pass the style attribute to the template
      isPinned: isPinned ? "true" : "false", // Pass isPinned as a string
    },
  );

  return renderTemplate(path.join(templatesDir, "layouts/main.html"), {
    title: `${channelData.title} | ${displayTitle}`,
    channelTitle: channelData.title, // Add channelTitle for the main layout
    navLinks: getNavigationLinks(slugMap),
    content: pageContent,
  });
}
