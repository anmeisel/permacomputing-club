// arena.ts

import Arena from "are.na";
import { ArenaChannel, ArenaItem } from "../types/arena-types";
import { generateSlug } from "../utils";

// Arena API service
export class ArenaService {
  private channelSlug: string;
  private accessToken: string; // Add this line to store the access token

  constructor(accessToken: string, channelSlug: string) {
    this.channelSlug = channelSlug;
    this.accessToken = accessToken; // Store the access token
  }

  /**
   * Fetches the latest data from the Arena channel
   * @returns Promise resolving to ArenaChannel data
   */
  async fetchChannelData(): Promise<ArenaChannel> {
    try {
      // Create a new client for each request to avoid any client-side caching
      const freshArena = new Arena({ accessToken: this.accessToken });
      const chan = (await freshArena
        .channel(this.channelSlug)
        .get()) as ArenaChannel;

      return chan;
    } catch (err) {
      console.error("Error fetching channel:", err);
      if (err instanceof Error) {
        throw new Error(`Failed to fetch Are.na channel data: ${err.message}`);
      } else {
        throw new Error("Failed to fetch Are.na channel data: Unknown error");
      }
    }
  }

  /**
   * Creates a mapping of slugs to Arena items
   * @param channel The Arena channel data
   * @returns Map of slugs to ArenaItems
   */
  createSlugMap(channel: ArenaChannel): Map<string, ArenaItem> {
    const slugMap = new Map<string, ArenaItem>();

    channel.contents.forEach((item: ArenaItem) => {
      // Prioritize the title field from Arena block
      let slugSource = "";

      // Check if item has a title and it's not empty
      if (item.title && item.title.trim() !== "") {
        slugSource = item.title;
      }
      // If no title, fall back to content
      else if (item.content && item.content.trim() !== "") {
        slugSource = item.content;
        console.log(
          `No title, using content for slug: "${item.content.substring(0, 30)}..."`,
        );
      }
      // Last resort - use ID with untitled prefix
      else {
        slugSource = `untitled-${item.id}`;
        console.log(`No title or content, using ID for slug: "${slugSource}"`);
      }

      const slug = generateSlug(slugSource);
      slugMap.set(slug, item);
    });

    return slugMap;
  }
}
