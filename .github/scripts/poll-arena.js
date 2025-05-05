// This script checks for changes in an Arena channel and triggers a Vercel deployment if changes are detected. It will:
// 1. Log the (partial) webhook URL for verification
// 2. Trigger the deploy
// 3. Parse the response and extract the job ID
// 4. Check the deployment status using the Vercel API
// 5. Log the deployment status and project ID

const fetch = require("node-fetch");

const token = process.env.ARENA_ACCESS_TOKEN;
const channel = process.env.CHANNEL_SLUG;
const webhook = process.env.VERCEL_DEPLOY_HOOK_URL;
const vercelToken = process.env.VERCEL_API_TOKEN;

async function getBlockCount() {
  const res = await fetch(`https://api.are.na/v2/channels/${channel}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data.contents.length;
}

async function checkDeployStatus(jobId) {
  console.log(`Checking status of job ${jobId}...`);
  console.log("Checking recent deployments...");
  const listRes = await fetch(`https://api.vercel.com/v6/deployments`, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });

  if (listRes.status === 200) {
    const data = await listRes.json();
    console.log(
      `Found ${data.deployments ? data.deployments.length : 0} deployments`,
    );
    if (data.deployments && data.deployments.length > 0) {
      const latestDeploy = data.deployments[0];
      console.log(`Latest deployment state: ${latestDeploy.state}`);
      console.log(
        `Latest deployment created: ${new Date(latestDeploy.created).toISOString()}`,
      );
    }
  } else {
    console.log(`List deployments error: ${listRes.status}`);
  }

  return null;
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

  if (res.status === 201) {
    const jsonData = await res.json();
    console.log("Deploy job triggered successfully");
    return jsonData;
  } else {
    console.log(`Deploy trigger failed with status: ${res.status}`);
    return null;
  }
}

(async () => {
  console.log("Checking Arena for changes...");
  const newCount = await getBlockCount();
  console.log(`Current block count: ${newCount}`);

  // Trigger deploy
  const jsonData = await triggerDeploy();
  if (jsonData && jsonData.job && jsonData.job.id) {
    await checkDeployStatus(jsonData.job.id);
  } else {
    console.log("No valid job ID received from deploy trigger");
  }
  console.log("Deploy process completed");
})();
