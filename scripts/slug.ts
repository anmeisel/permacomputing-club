import fs from "fs";
import { ArenaChannel, ArenaItem, SlugMapping } from "../types/arena-types";
import { generateSlug } from "../utils";

/**
 * Handles slug mapping operations
 */
export class Slug {
  private mappingFile: string;

  constructor(mappingFile: string) {
    this.mappingFile = mappingFile;
  }

  /**
   * Saves slug mappings to file
   * @param channelData The Arena channel data
   */
  saveSlugMappings(channelData: ArenaChannel): void {
    try {
      if (!channelData) return;

      // Always delete and regenerate the mappings file, regardless of whether it exists
      if (fs.existsSync(this.mappingFile)) {
        fs.unlinkSync(this.mappingFile);
        console.log(`Removed existing slug mappings file`);
      }

      const mappings: SlugMapping = {};

      channelData.contents.forEach((item: ArenaItem) => {
        // Prioritize the title field from Arena block
        let slugSource = "";

        // Check if item has a title and it's not empty
        if (item.title && item.title.trim() !== "") {
          slugSource = item.title;
        }
        // If no title, fall back to content
        else if (item.content && item.content.trim() !== "") {
          slugSource = item.content;
        }
        // Last resort - use ID with untitled prefix
        else {
          slugSource = `untitled-${item.id}`;
        }

        const slug = generateSlug(slugSource);

        mappings[slug] = {
          id: item.id,
          title: slugSource, // Store the source we used to create the slug
          class: item.class,
          original_title: item.title || "", // Store the original title for reference
        };
      });

      fs.writeFileSync(
        this.mappingFile,
        JSON.stringify(mappings, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("Error saving slug mappings:", err);
    }
  }

  /**
   * Loads slug mappings from file
   * @returns Mapping of slugs to items
   */
  loadSlugMappings(): SlugMapping | null {
    try {
      if (!fs.existsSync(this.mappingFile)) {
        console.log("No slug mappings file found");
        return null;
      }

      const fileContent = fs.readFileSync(this.mappingFile, "utf8");
      return JSON.parse(fileContent) as SlugMapping;
    } catch (err) {
      console.error("Error loading slug mappings:", err);
      return null;
    }
  }

  /**
   * Checks if a slug exists in the mappings
   * @param slug The slug to check
   * @returns True if slug exists, false otherwise
   */
  slugExists(slug: string): boolean {
    const mappings = this.loadSlugMappings();
    if (!mappings) return false;

    return Object.prototype.hasOwnProperty.call(mappings, slug);
  }
}
