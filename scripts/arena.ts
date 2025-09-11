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
   * Fetches the latest data from the Arena channel with aggressive cache busting (not working)
   * @returns Promise resolving to ArenaChannel data
   */
  async fetchChannelData(): Promise<ArenaChannel> {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);

    try {
      // Multiple cache-busting strategies...
      const cacheBusterParams = new URLSearchParams({
        _t: timestamp.toString(),
        _r: randomId,
        cache: "false",
        v: timestamp.toString(),
      });

      const cacheBusterUrl = `https://api.are.na/v2/channels/${this.channelSlug}?${cacheBusterParams.toString()}`;

      console.log(
        `Fetching fresh Arena data with aggressive cache buster: ${new Date().toISOString()}`,
      );
      console.log(`URL: ${cacheBusterUrl}`);

      // Direct fetch request with aggressive cache busting
      const response = await fetch(cacheBusterUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "If-None-Match": "*",
          "If-Modified-Since": new Date(0).toUTCString(),
          "User-Agent": `arena-site-builder-${timestamp}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Arena API responded with status: ${response.status} - ${response.statusText}`,
        );
      }

      const chan = (await response.json()) as ArenaChannel;

      console.log(
        `Successfully fetched ${chan.contents?.length || 0} items from Arena`,
      );
      console.log(`Last updated: ${chan.updated_at || "Unknown"}`);

      return chan;
    } catch (err) {
      console.error("Error fetching channel:", err);

      // if direct fetch fails
      console.log("Falling back to regular are.na client...");
      try {
        const freshArena = new Arena({ accessToken: this.accessToken });
        const chan = (await freshArena
          .channel(this.channelSlug)
          .get()) as ArenaChannel;

        console.log(`Fetched ${chan.contents?.length || 0} items`);
        return chan;
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        if (err instanceof Error) {
          throw new Error(
            `Failed to fetch Are.na channel data: ${err.message}`,
          );
        } else {
          throw new Error("Failed to fetch Are.na channel data: Unknown error");
        }
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
      let slugSource = "";

      // If item has a title and it's not empty
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
