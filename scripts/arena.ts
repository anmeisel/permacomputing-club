import Arena from "are.na";
import { ArenaChannel, ArenaItem } from "../types/arena-types";
import { generateSlug } from "../utils";

// Arena API service
export class ArenaService {
  private channelSlug: string;
  private accessToken: string;

  constructor(accessToken: string, channelSlug: string) {
    this.channelSlug = channelSlug;
    this.accessToken = accessToken;
  }

  /**
   * Fetches the latest data from the Arena channel with cache busting
   * @returns Promise resolving to ArenaChannel data
   */
  async fetchChannelData(): Promise<ArenaChannel> {
    const timestamp = Date.now();

    try {
      console.log(`Fetching fresh Arena data: ${new Date().toISOString()}`);

      // Use the official Arena client - it handles API calls properly
      const arena = new Arena({ accessToken: this.accessToken });

      // The Arena API doesn't respect cache-control headers the way you're trying to use them
      // Instead, just fetch directly - the API always returns fresh data
      const chan = (await arena
        .channel(this.channelSlug)
        .get()) as ArenaChannel;

      console.log(
        `Successfully fetched ${chan.contents?.length || 0} items from Arena`
      );
      console.log(`Last updated: ${chan.updated_at || "Unknown"}`);

      return chan;
    } catch (err) {
      console.error("Error fetching channel:", err);

      // Try one more time with a direct fetch as fallback
      try {
        const url = `https://api.are.na/v2/channels/${this.channelSlug}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Arena API responded with status: ${response.status}`
          );
        }

        const chan = (await response.json()) as ArenaChannel;
        console.log(`Fallback successful: ${chan.contents?.length || 0} items`);
        return chan;
      } catch (fallbackErr) {
        console.error("Both attempts failed:", fallbackErr);
        throw new Error(
          `Failed to fetch Are.na channel data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
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

    if (!channel.contents || !Array.isArray(channel.contents)) {
      console.warn("No contents found in channel");
      return slugMap;
    }

    channel.contents.forEach((item: ArenaItem) => {
      let slugSource = "";

      // If item has a title and it's not empty
      if (item.title && item.title.trim() !== "") {
        slugSource = item.title;
      }
      // If no title, fall back to content
      else if (item.content && item.content.trim() !== "") {
        slugSource = item.content;
        console.log(
          `No title, using content for slug: "${item.content.substring(
            0,
            30
          )}..."`
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

    console.log(`Created slug map with ${slugMap.size} entries`);
    return slugMap;
  }
}
