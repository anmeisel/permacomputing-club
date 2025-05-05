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

async function triggerDeploy() {
  console.log("Triggering Vercel deploy...");
  const res = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const data = await res.text();
  console.log(`Deploy response: ${res.status} ${data}`);
  try {
    const jsonData = JSON.parse(data);
    console.log("Deploy job ID:", jsonData.job.id);
  } catch (e) {
    console.log("Could not parse response as JSON");
  }
}

(async () => {
  console.log("Checking Arena for changes...");
  const newCount = await getBlockCount();
  console.log(`Current block count: ${newCount}`);

  // Always trigger deploy for testing
  await triggerDeploy();
  console.log("Deploy triggered successfully");
})();
