// index.ts

import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
import { ArenaService } from "./scripts/arena";
import { Slug } from "./scripts/slug";
import { generateStaticPages } from "./build";

// Load environment variables
dotenv.config();

// Constants
const CHANNEL_SLUG =
  process.env.CHANNEL_SLUG ??
  (() => {
    throw new Error("CHANNEL_SLUG is required");
  })();

const ARENA_ACCESS_TOKEN =
  process.env.ARENA_ACCESS_TOKEN ??
  (() => {
    throw new Error("ARENA_ACCESS_TOKEN is required");
  })();

const SLUG_MAPPING_FILE = path.join(__dirname, "slug-mappings.json");
const SOURCE_DIR = __dirname;
const POLL_INTERVAL = process.env.POLL_INTERVAL
  ? parseInt(process.env.POLL_INTERVAL)
  : 5 * 60 * 1000; // Default: 5 minutes
const LAST_UPDATE_FILE = path.join(__dirname, ".arena-last-update");

/**
 * Main build function
 */
export async function buildStaticSite(): Promise<void> {
  try {
    console.log("Starting static site build process...");

    // Ensure slug-mappings.json is deleted before building
    if (fs.existsSync(SLUG_MAPPING_FILE)) {
      fs.unlinkSync(SLUG_MAPPING_FILE);
      console.log("Deleted existing slug-mappings.json file");
    }

    // Create Arena service
    const arenaService = new ArenaService(ARENA_ACCESS_TOKEN, CHANNEL_SLUG);

    // Create slug mapper
    const slug = new Slug(SLUG_MAPPING_FILE);

    // Fetch channel data
    console.log("Fetching latest data from Are.na API...");
    const channelData = await arenaService.fetchChannelData();

    if (!channelData) {
      throw new Error("Failed to fetch channel data");
    }

    // Create slug map
    const slugMap = arenaService.createSlugMap(channelData);

    // Save slug mappings to file
    slug.saveSlugMappings(channelData);

    // Generate static pages
    console.log("Channel data fetched successfully, generating pages...");
    await generateStaticPages(channelData, slugMap, SOURCE_DIR);

    console.log("Static site built successfully!");
    return;
  } catch (err) {
    console.error("Failed to build static site:", err);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await buildStaticSite();
      process.exit(0);
    } catch (err) {
      console.error("Error during build process:", err);
      process.exit(1);
    }
  })();
}
