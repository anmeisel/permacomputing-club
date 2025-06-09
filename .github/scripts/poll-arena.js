// This script checks for changes in an Arena channel and triggers a Vercel deployment if changes are detected. It will:
// 1. Log the (partial) webhook URL for verification
// 2. Trigger the deploy
// 3. Parse the response and extract the job ID
// 4. Check the deployment status using the Vercel API
// 5. Log the deployment status and project ID

const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const token = process.env.ARENA_ACCESS_TOKEN;
const channel = process.env.CHANNEL_SLUG;
const webhook = process.env.VERCEL_DEPLOY_HOOK_URL;
const vercelToken = process.env.VERCEL_API_TOKEN;

const COUNT_FILE = path.join(__dirname, "arena_count.txt");

// Subsequent runs: Reads from arena_count.txt → only deploys if count changed

async function getBlockCount() {
  const res = await fetch(`https://api.are.na/v2/channels/${channel}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data.contents.length;
}

async function getPreviousCount() {
  try {
    const count = await fs.readFile(COUNT_FILE, "utf8");
    return parseInt(count.trim(), 10);
  } catch (error) {
    console.log("No previous count found, treating as first run");
    return null;
  }
}

async function savePreviousCount(count) {
  await fs.writeFile(COUNT_FILE, count.toString());
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

  const currentCount = await getBlockCount();
  const previousCount = await getPreviousCount();

  console.log(`Current block count: ${currentCount}`);
  console.log(`Previous block count: ${previousCount}`);

  // Check if there are changes
  if (previousCount === null || currentCount !== previousCount) {
    if (previousCount === null) {
      console.log("First run - triggering initial deploy");
    } else {
      console.log(
        `Block count changed from ${previousCount} to ${currentCount} - triggering deploy`,
      );
    }

    // Save the new count
    await savePreviousCount(currentCount);

    // Trigger deploy
    const jsonData = await triggerDeploy();
    if (jsonData && jsonData.job && jsonData.job.id) {
      await checkDeployStatus(jsonData.job.id);
    } else {
      console.log("No valid job ID received from deploy trigger");
    }
  } else {
    console.log("No changes detected - skipping deployment");
  }

  console.log("Arena check completed");
})();
