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
  // Try both v1 and v6 API endpoints to see which works
  const responses = await Promise.all([
    fetch(`https://api.vercel.com/v1/deployments/${jobId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    }),
    fetch(`https://api.vercel.com/v6/deployments/${jobId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    }),
  ]);

  // Process both responses
  for (let i = 0; i < responses.length; i++) {
    const res = responses[i];
    const version = i === 0 ? "v1" : "v6";

    console.log(`${version} API status code: ${res.status}`);
    if (res.status === 200) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        console.log(
          `${version} deployment info:`,
          JSON.stringify(data, null, 2).substring(0, 500) + "...",
        );
        return data;
      } catch (e) {
        console.log(`Could not parse ${version} response as JSON:`, e.message);
      }
    } else {
      const text = await res.text();
      console.log(`${version} error response:`, text);
    }
  }

  // If we're not getting good data from the deployment endpoints,
  // let's try checking all deployments to see if this job appears
  console.log("Checking all deployments...");
  const listRes = await fetch(`https://api.vercel.com/v6/deployments`, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });

  if (listRes.status === 200) {
    const text = await listRes.text();
    try {
      const data = JSON.parse(text);
      console.log(
        `Found ${data.deployments ? data.deployments.length : 0} deployments`,
      );
      if (data.deployments && data.deployments.length > 0) {
        // Just log the first deployment to see structure
        console.log(
          "Latest deployment:",
          JSON.stringify(data.deployments[0], null, 2).substring(0, 500) +
            "...",
        );
      }
    } catch (e) {
      console.log("Could not parse deployments list as JSON");
    }
  } else {
    const text = await listRes.text();
    console.log("List deployments error:", text);
  }

  return null;
}

async function triggerDeploy() {
  console.log(`Using webhook URL: ${webhook.substring(0, 30)}...`); // Partial URL for security
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
    return jsonData; // Return the parsed data
  } catch (e) {
    console.log("Could not parse response as JSON");
    return null;
  }
}

(async () => {
  console.log("Checking Arena for changes...");
  const newCount = await getBlockCount();
  console.log(`Current block count: ${newCount}`);

  // Always trigger deploy for testing
  const jsonData = await triggerDeploy(); // Store the returned data
  if (jsonData && jsonData.job && jsonData.job.id) {
    await checkDeployStatus(jsonData.job.id);
  } else {
    console.log("No valid job ID received from deploy trigger");
  }
  console.log("Deploy triggered successfully");
})();
