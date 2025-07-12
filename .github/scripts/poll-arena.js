// This script checks for changes in an Arena channel and triggers a Vercel deployment if changes are detected. It will:
// 1. Check the current block count from Arena
// 2. Compare with previously cached count
// 3. Only deploy if there's a change (or first run)
// 4. Save the new count to cache

const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const token = process.env.ARENA_ACCESS_TOKEN;
const channel = process.env.CHANNEL_SLUG;
const webhook = process.env.VERCEL_DEPLOY_HOOK_URL;
const vercelToken = process.env.VERCEL_API_TOKEN;

const COUNT_FILE = path.join(__dirname, "arena_count.txt");

async function getBlockCount() {
  try {
    console.log(`Fetching Arena channel: ${channel}`);
    const res = await fetch(`https://api.are.na/v2/channels/${channel}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Arena API failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(
      `Arena channel "${data.title}" has ${data.contents.length} blocks`,
    );
    return data.contents.length;
  } catch (error) {
    console.error("Error fetching Arena data:", error.message);
    throw error;
  }
}

async function getPreviousCount() {
  try {
    const count = await fs.readFile(COUNT_FILE, "utf8");
    const parsed = parseInt(count.trim(), 10);
    console.log(`Previous count from cache: ${parsed}`);
    return parsed;
  } catch (error) {
    console.log("No previous count found (first run or cache miss)");
    console.log(`Cache file path: ${COUNT_FILE}`);
    return null;
  }
}

async function savePreviousCount(count) {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(COUNT_FILE), { recursive: true });
    await fs.writeFile(COUNT_FILE, count.toString());
    console.log(`Saved count ${count} to cache file: ${COUNT_FILE}`);
  } catch (error) {
    console.error("Error saving count:", error.message);
  }
}

async function triggerDeploy() {
  try {
    console.log("Triggering Vercel deployment...");
    console.log(`Webhook URL (partial): ${webhook.substring(0, 50)}...`);

    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    console.log(`Deploy webhook response: ${res.status} ${res.statusText}`);

    if (res.status === 201) {
      const jsonData = await res.json();
      console.log("Deploy triggered successfully:", jsonData);
      return jsonData;
    } else {
      const errorText = await res.text();
      console.error(`Deploy failed: ${res.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error("Error triggering deploy:", error.message);
    return null;
  }
}

async function checkDeployStatus(jobId) {
  try {
    console.log(`Checking deployment status for job: ${jobId}`);
    const listRes = await fetch(`https://api.vercel.com/v6/deployments`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });

    if (listRes.ok) {
      const data = await listRes.json();
      if (data.deployments && data.deployments.length > 0) {
        const latest = data.deployments[0];
        console.log(
          `Latest deployment: ${latest.state} (${latest.url || "no URL"})`,
        );
      }
    } else {
      console.log(`Could not fetch deployment status: ${listRes.status}`);
    }
  } catch (error) {
    console.error("Error checking deployment status:", error.message);
  }
}

(async () => {
  try {
    console.log("=== Arena Check Starting ===");
    console.log(`Environment check - Channel: ${channel ? "OK" : "MISSING"}`);
    console.log(`Environment check - Arena Token: ${token ? "OK" : "MISSING"}`);
    console.log(`Environment check - Webhook: ${webhook ? "OK" : "MISSING"}`);
    console.log(
      `Environment check - Vercel Token: ${vercelToken ? "OK" : "MISSING"}`,
    );

    const currentCount = await getBlockCount();
    const previousCount = await getPreviousCount();

    console.log(`\nCOMPARISON:`);
    console.log(`  Current: ${currentCount}`);
    console.log(`  Previous: ${previousCount}`);
    console.log(
      `  Changed: ${previousCount === null || currentCount !== previousCount}`,
    );

    if (previousCount === null || currentCount !== previousCount) {
      if (previousCount === null) {
        console.log("\n→ FIRST RUN: Triggering initial deployment");
      } else {
        console.log(`\n→ CHANGE DETECTED: ${previousCount} → ${currentCount}`);
      }

      // Save the new count before triggering deploy
      await savePreviousCount(currentCount);

      const deployResult = await triggerDeploy();
      if (deployResult && deployResult.job && deployResult.job.id) {
        await checkDeployStatus(deployResult.job.id);
      }
    } else {
      console.log("\n→ NO CHANGES: Skipping deployment");
      console.log("The script is working correctly - no deployment needed!");
    }

    console.log("\n=== Arena Check Complete ===");
  } catch (error) {
    console.error("Fatal error:", error.message);
    process.exit(1);
  }
})();
