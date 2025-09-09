import { Slug } from "../scripts/slug";

interface ChannelItem {
  id: string;
  class: "Text" | "Link" | string;
  title?: string;
  content?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function generateRSSFeed(channelData: any, siteUrl: string): string {
  const items: ChannelItem[] = channelData.contents
    .filter(
      (item: ChannelItem) => item.class === "Text" || item.class === "Link",
    )
    .sort(
      (a: ChannelItem, b: ChannelItem) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

  const slugHandler = new Slug("slug-mappings.json");
  const slugMappings = slugHandler.loadSlugMappings();

  const idToSlug: Record<string, string> = {};
  if (slugMappings) {
    Object.entries(slugMappings).forEach(([slug, mapping]) => {
      idToSlug[mapping.id] = slug;
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
            <channel>
                <title>${channelData.title}</title>
                <description>Community gathering focused on permacomputing - sustainable, resilient technology practices.</description>
                <link>${siteUrl}</link>
                <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
                ${items
                  .map((item) => {
                    const itemSlug = idToSlug[item.id] || item.id;
                    const itemLink = `${siteUrl}/${itemSlug}`;

                    return `
                <item>
                    <title>${item.title || "Untitled"}</title>
                    <description><![CDATA[${item.content || item.description || ""}]]></description>
                    <link>${itemLink}</link>
                    <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
                    <guid>${itemLink}</guid>
                </item>`;
                  })
                  .join("")}
            </channel>
        </rss>`;
}
