const fetch = require("node-fetch");
const fs = require("fs");

const token = process.env.ARENA_ACCESS_TOKEN;
const channel = process.env.CHANNEL_SLUG;
const webhook = process.env.VERCEL_DEPLOY_HOOK_URL;
const stateFile = ".arena_state.json";

async function getBlockCount() {
  const res = await fetch(`https://api.are.na/v2/channels/${channel}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.contents.length;
}

async function triggerDeploy() {
  console.log("Triggering Vercel deploy...");
  await fetch(webhook, { method: "POST" });
}

(async () => {
  const newCount = await getBlockCount();
  let oldCount = 0;

  if (fs.existsSync(stateFile)) {
    oldCount = JSON.parse(fs.readFileSync(stateFile)).count;
  }

  if (newCount !== oldCount) {
    console.log(`Change detected (${oldCount} → ${newCount})`);
    await triggerDeploy();
    fs.writeFileSync(stateFile, JSON.stringify({ count: newCount }));
  } else {
    console.log("No changes detected.");
  }
})();
