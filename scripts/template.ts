import fs from "fs";
import path from "path";
import { ArenaItem, ArenaChannel } from "../types/arena-types";
import {
  generateSlug,
  processItemContent,
  processItemDescription,
  extractColourFromDescription,
  formatDate,
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
export async function renderHomePage(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): Promise<string> {
  // Process all items to create blocks and identify pinned items
  const processedItems = await Promise.all(
    channelData.contents.map(async (item: ArenaItem) => {
      // Prioritise title for display
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
        : { html: "", isPinned: false };

      // Check if the item has a "notes" tag in its description
      const hasNotesTag = item.description
        ? item.description.toLowerCase().includes("tag: notes") ||
          item.description.toLowerCase().includes("tags: notes") ||
          item.description.toLowerCase().includes("#notes")
        : false;

      // Process item content if it has notes tag
      const itemContent = hasNotesTag ? await processItemContent(item) : "";

      // Extract colour and border information from description if available
      const { backgroundColor, borderColor } = item.description
        ? extractColourFromDescription(item.description)
        : { backgroundColor: "", borderColor: "" };

      // Build the style attribute string
      let styleAttribute = "";
      const styles: string[] = [];
      if (backgroundColor) {
        styles.push(`background-color: ${backgroundColor}`);
      }
      if (borderColor) {
        styles.push(`border: 1px solid ${borderColor}`);
      }
      if (styles.length > 0) {
        styleAttribute = ` style="${styles.join("; ")};"`;
      }

      // Create the HTML block for this item
      const blockHtml = `<div class="content-block${isPinned ? " pinned" : ""}${hasNotesTag ? " notes" : ""}" data-id="${item.id}"${styleAttribute}>
        <h2><a href="/${slug}">${displayTitle}</a></h2>
        ${itemDescription ? `<div class="item-description">${itemDescription}</div>` : ""}
        ${hasNotesTag && itemContent ? `<div class="item-content">${itemContent}</div>` : ""}
        <div class="item-timestamps">
          <span class="created">Created: ${formatDate(item.created_at)}</span>
          <span class="updated">Updated: ${formatDate(item.updated_at)}</span>
        </div>
      </div>`;

      return {
        html: blockHtml,
        isPinned,
        item,
      };
    }),
  );

  // Sort items to put pinned items at the top
  processedItems.sort((a, b) => {
    // First priority: pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Second priority: created_at date (newest first)
    const dateA = new Date(a.item.created_at);
    const dateB = new Date(b.item.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  // Join all blocks together
  const blocks = processedItems.map((item) => item.html).join("");

  const pageContent = renderTemplate(
    path.join(templatesDir, "pages/home.html"),
    {
      channelTitle: channelData.title,
      totalBlocks: channelData.contents.length,
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

  // Prioritise title for display
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
      styleAttribute: styleAttribute,
      isPinned: isPinned ? "true" : "false",
      createdAt: formatDate(item.created_at),
      updatedAt: formatDate(item.updated_at),
    },
  );

  return renderTemplate(path.join(templatesDir, "layouts/main.html"), {
    title: `${channelData.title} | ${displayTitle}`,
    channelTitle: channelData.title, // Add channelTitle for the main layout
    navLinks: getNavigationLinks(slugMap),
    content: pageContent,
  });
}

/**
 * Renders the 404 page
 * @param channelData Channel data from Arena
 * @param slugMap Map of slugs to ArenaItems
 * @param templatesDir Directory containing templates
 * @returns Rendered HTML for 404 page
 */
export function render404Page(
  channelData: ArenaChannel,
  slugMap: Map<string, ArenaItem>,
  templatesDir: string,
): string {
  // Read the 404 page content
  const pageContent = fs.readFileSync(
    path.join(templatesDir, "pages/404.html"),
    "utf8",
  );

  return renderTemplate(path.join(templatesDir, "layouts/main.html"), {
    title: `${channelData.title} | Page not found`,
    channelTitle: channelData.title,
    navLinks: getNavigationLinks(slugMap),
    content: pageContent,
  });
}
