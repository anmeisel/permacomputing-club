import { ArenaItem } from "../types/arena-types";
import { marked } from "marked";

export * from "./file";

/**
 * Generates a URL-friendly slug from a string
 * @param str The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores and hyphens with a single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/^\d+[_-]/, "") // Remove leading numbers followed by underscore or hyphen
    .substring(0, 100); // Limit length to 100 chars
}

/**
 * Extracts colour value from item description
 * @param description The raw description text to process
 * @returns Colour value as string or empty string if not found
 */
export function extractColourFromDescription(description: string): {
  backgroundColor: string;
  borderColor: string;
} {
  const result = {
    backgroundColor: "",
    borderColor: "",
  };

  if (!description) return result;

  // Split the description into lines
  const lines = description.split("\n").filter((line) => line.trim() !== "");

  // Look for a line that starts with "Colour:" or "colour:"
  const colourLine = lines.find((line) =>
    line.trim().toLowerCase().startsWith("colour:"),
  );

  if (colourLine) {
    // Extract the colour value
    const colourMatch = colourLine.match(/^colour:\s*(.+)$/i);
    if (colourMatch && colourMatch[1]) {
      result.backgroundColor = colourMatch[1].trim();
    }
  }

  // Look for a line that starts with "Border:" or "border:"
  const borderLine = lines.find((line) =>
    line.trim().toLowerCase().startsWith("border:"),
  );

  if (borderLine) {
    // Extract the border value
    const borderMatch = borderLine.match(/^border:\s*(.+)$/i);
    if (borderMatch && borderMatch[1]) {
      result.borderColor = borderMatch[1].trim();
    }
  }

  return result;
}

/**
 * Processes content based on item type/class
 * @param item The Arena item to process
 * @returns Processed HTML content
 */
export async function processItemContent(item: ArenaItem): Promise<string> {
  try {
    switch (item.class) {
      case "Image":
        if (item.image && item.image.display && item.image.display.url) {
          return `<img src="${item.image.display.url}" alt="${item.title || "Arena image"}" class="item-image" />`;
        }
        return `<div class="error">Image URL not available</div>`;

      case "Text":
        // Parse the content as markdown if it's a text block
        let processedContent = item.content || "";

        // Special handling for JSON format
        if (
          processedContent.startsWith("[") &&
          processedContent.includes('"type":')
        ) {
          try {
            const jsonContent = JSON.parse(processedContent);

            // Process each content block
            const renderedBlocks = jsonContent
              .map((block: any) => {
                if (
                  block.type === "text" &&
                  block.content &&
                  block.content.text
                ) {
                  // Process text with markdown and headline handling
                  let textContent = block.content.text;
                  textContent = textContent
                    .split("\n") // Split into lines
                    .map((line: string) => {
                      const headlineMatch = line.match(
                        /^(headline|Headline):\s*(.*)$/,
                      );
                      if (headlineMatch) {
                        return `<h3>${headlineMatch[2].trim()}</h3>`;
                      }
                      return line; // Return original line if no headline
                    })
                    .join("\n"); // Join lines back
                  return marked.parse(textContent);
                } else if (
                  block.type === "image" &&
                  block.content &&
                  block.content.src
                ) {
                  // Process images
                  const caption = block.content.caption
                    ? `<figcaption>${block.content.caption}</figcaption>`
                    : "";
                  return `<figure>
                  <img src="${block.content.src}" alt="${block.content.alt || ""}" />
                  ${caption}
                </figure>`;
                }
                // Default case
                return "";
              })
              .join("\n");

            return `<div class="structured-content">${renderedBlocks}</div>`;
          } catch (err) {
            console.error(
              `Error parsing JSON content for item ${item.id}:`,
              err,
            );
            // Fall back to normal markdown processing
          }
        }

        // Standard markdown processing for non-JSON content
        if (typeof processedContent === "string") {
          try {
            // Handle headlines before markdown parsing
            processedContent = processedContent
              .split("\n") // Split into lines
              .map((line: string) => {
                const headlineMatch = line.match(
                  /^(headline|Headline):\s*(.*)$/,
                );
                if (headlineMatch) {
                  return `<h3>${headlineMatch[2].trim()}</h3>`;
                }
                return line; // Return original line if no headline
              })
              .join("\n"); // Join lines back

            // Convert markdown to HTML
            processedContent = marked.parse(processedContent);
          } catch (err) {
            console.error(`Error parsing markdown for item ${item.id}:`, err);
            // Fall back to plain text if markdown parsing fails
          }
        }

        return `<div class="text-content">${processedContent}</div>`;

      case "Link":
        return `
          <div class="link-content">
            <h3><a href="${item.source?.url || "#"}" target="_blank">${item.title || item.source?.url || "Untitled Link"}</a></h3>
            ${item.description ? `<p class="description">${item.description}</p>` : ""}
            ${item.image ? `<img src="${item.image.display?.url}" alt="${item.title || "Link preview"}" />` : ""}
          </div>
        `;

      case "Attachment":
        if (item.attachment && item.attachment.url) {
          return `
            <div class="attachment-content">
              <h3>${item.title || "Attachment"}</h3>
              <a href="${item.attachment.url}" class="download-link" download>Download Attachment</a>
            </div>
          `;
        }
        return `<div class="error">Attachment not available</div>`;

      case "Media":
        // Handle embedded media (like YouTube videos)
        if (item.embed && item.embed.html) {
          return `
            <div class="media-embed">
              ${item.embed.html}
            </div>
          `;
        }
        return `<div class="error">Media embed not available</div>`;

      default:
        // Default case for unknown types
        return `
          <div class="generic-content">
            ${item.title ? `<h3>${item.title}</h3>` : ""}
            ${item.content ? `<div class="content">${item.content}</div>` : ""}
            ${item.description ? `<div class="description">${item.description}</div>` : ""}
          </div>
        `;
    }
  } catch (err) {
    console.error(`Error processing content for item ${item.id}:`, err);
    return `<div class="error">Error processing content: ${err instanceof Error ? err.message : "Unknown error"}</div>`;
  }
}

/**
 * Processes item description text to extract description and format other lines
 * @param description The raw description text to process
 * @returns Processed HTML content with description and formatted lines
 */
export function processItemDescription(description: string): {
  html: string;
  isPinned: boolean;
} {
  if (!description) return { html: "", isPinned: false };

  // Track if item is pinned
  let isPinned = false;

  // Split the description into lines
  const lines = description.split("\n");

  // Collect regular markdown content
  let markdownContent = "";
  // Collect metadata fields
  const metadataFields: string[] = [];

  // First pass - separate metadata from content
  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip completely empty lines
    if (trimmedLine === "") {
      markdownContent += "\n";
      continue;
    }

    // Check if the line matches a known metadata field
    const metadataPattern = /^(pin|colour|tags|border|author):\s*(.+)$/i;
    const descriptionMatch = trimmedLine.match(metadataPattern);

    if (descriptionMatch) {
      const key = descriptionMatch[1].trim().toLowerCase(); // Only lowercase the key
      const value = descriptionMatch[2].trim(); // Preserve original case for value

      // Handle metadata fields
      if (key === "pin" && value.toLowerCase() === "top") {
        isPinned = true;
        // Don't include in output
      } else if (key === "colour" || key === "border") {
        // Don't include these in output
      } else if (key === "tags") {
        const tags = value
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "");

        if (tags.length > 0) {
          const tagLinks = tags
            .map(
              (tag) =>
                `<a href="/#${encodeURIComponent(tag)}" class="tag-link">#${tag}</a>`,
            )
            .join(" ");
          metadataFields.push(
            `<div class="description-field tags-field item-tags"><span class="description-key">Tags:</span> ${tagLinks}</div>`,
          );
        }
      } else if (key === "author") {
        // Assuming author value is a slug or username
        metadataFields.push(
          `<div class="description-field author-field"><span class="description-key">Author:</span> <a href="/${encodeURIComponent(value)}">${value}</a></div>`,
        );
      }
    } else {
      // If it doesn't match a description format, add to markdown content
      // Add double newline after each line to ensure proper markdown spacing
      markdownContent += trimmedLine + "\n\n";
    }
  }

  // Process markdown content
  let processedMarkdown = "";
  if (markdownContent.trim() !== "") {
    // Remove consecutive newlines (more than 2) to clean up the spacing
    const cleanedMarkdown = markdownContent.replace(/\n{3,}/g, "\n\n").trim();
    processedMarkdown = marked.parse(cleanedMarkdown);
  }

  // Combine metadata fields and markdown content
  const result = [
    ...metadataFields,
    processedMarkdown
      ? `<div class="markdown-content">${processedMarkdown}</div>`
      : "",
  ]
    .filter((content) => content !== "")
    .join("\n");

  return {
    html: result,
    isPinned,
  };
}
