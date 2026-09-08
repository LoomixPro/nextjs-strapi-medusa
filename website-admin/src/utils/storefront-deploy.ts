type DeployPayload = {
  component_path?: string
  action?: "add" | "remove"
  source?: string
  auto_deploy?: boolean
  batch?: { action: string; componentPath: string }[]
}

type DeployTriggerResult = {
  triggered: boolean
  mode: "github-actions" | "local-dev"
  message: string
  workflowUrl?: string
}

export async function triggerStorefrontDeploy(
  payload: DeployPayload = {}
): Promise<DeployTriggerResult> {
  const token = process.env.GITHUB_DEPLOY_TOKEN?.trim()
  const repo = process.env.GITHUB_DEPLOY_REPO?.trim()

  if (!token || !repo) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "GITHUB_DEPLOY_TOKEN and GITHUB_DEPLOY_REPO must be configured in production."
      )
    }

    return {
      triggered: false,
      mode: "local-dev",
      message:
        "GitHub deploy is not configured. Run `node scripts/sync-loom-component.js` locally or push to main to deploy.",
    }
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: "deploy-storefront",
      client_payload: {
        component_path: payload.component_path || "",
        action: payload.action || "add",
        source: payload.source || "strapi",
        auto_deploy: payload.auto_deploy !== undefined ? payload.auto_deploy : true,
        batch: payload.batch ? JSON.stringify(payload.batch) : "",
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `GitHub Actions dispatch failed (${response.status}): ${errorBody}`
    )
  }

  const [owner, repoName] = repo.split("/")

  return {
    triggered: true,
    mode: "github-actions",
    message: "Storefront deploy workflow started on GitHub Actions.",
    workflowUrl: `https://github.com/${owner}/${repoName}/actions/workflows/deploy-storefront.yml`,
  }
}

export type StorefrontStatusResult = {
  success: boolean
  mode: "github-actions" | "local-dev"
  status: "queued" | "in_progress" | "completed" | "idle"
  conclusion: "success" | "failure" | "cancelled" | null
  updated_at?: string
  html_url?: string
  run_number?: number
  message?: string
}

export async function getStorefrontDeployStatus(): Promise<StorefrontStatusResult> {
  const token = process.env.GITHUB_DEPLOY_TOKEN?.trim()
  const repo = process.env.GITHUB_DEPLOY_REPO?.trim()

  if (!token || !repo) {
    return {
      success: true,
      mode: "local-dev",
      status: "idle",
      conclusion: "success",
      message: "Local development mode (No GitHub deploy configured).",
    }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/deploy-storefront.yml/runs?per_page=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    )

    if (!response.ok) {
      return {
        success: false,
        mode: "github-actions",
        status: "idle",
        conclusion: null,
        message: `GitHub API error: ${response.status}`,
      }
    }

    const data = (await response.json()) as {
      workflow_runs?: Array<{
        status: "queued" | "in_progress" | "completed"
        conclusion: "success" | "failure" | "cancelled" | null
        updated_at: string
        html_url: string
        run_number: number
        display_title?: string
        name: string
      }>
    }
    const latestRun = data.workflow_runs?.[0]

    if (!latestRun) {
      return {
        success: true,
        mode: "github-actions",
        status: "idle",
        conclusion: null,
        message: "No workflow runs recorded yet.",
      }
    }

    return {
      success: true,
      mode: "github-actions",
      status: latestRun.status,
      conclusion: latestRun.conclusion,
      updated_at: latestRun.updated_at,
      html_url: latestRun.html_url,
      run_number: latestRun.run_number,
      message: latestRun.display_title || latestRun.name,
    }
  } catch (err: any) {
    return {
      success: false,
      mode: "github-actions",
      status: "idle",
      conclusion: null,
      message: err.message || "Failed to query workflow status.",
    }
  }
}
