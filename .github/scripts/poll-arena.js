const fetch = require("node-fetch");

const token = process.env.ARENA_ACCESS_TOKEN;
const channel = process.env.CHANNEL_SLUG;
const webhook = process.env.VERCEL_DEPLOY_HOOK_URL;

async function getBlockCount() {
  const res = await fetch(`https://api.are.na/v2/channels/${channel}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.contents.length;
}

async function getLastKnownCount() {
  try {
    // Get the count from a file in your repo or use GitHub API to check previous run
    // For simplicity, we'll always trigger a deploy for now
    return 0;
  } catch (e) {
    return 0;
  }
}

async function triggerDeploy() {
  console.log("Triggering Vercel deploy...");
  // Add forceNew=true parameter to ensure Vercel rebuilds everything
  await fetch(`${webhook}&forceNew=true`, { method: "POST" });
}

(async () => {
  console.log("Checking Arena for changes...");
  const newCount = await getBlockCount();
  console.log(`Current block count: ${newCount}`);

  // Always trigger deploy for testing
  await triggerDeploy();
  console.log("Deploy triggered successfully");
})();
