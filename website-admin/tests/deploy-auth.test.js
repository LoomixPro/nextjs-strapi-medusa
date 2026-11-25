const fs = require("fs")
const path = require("path")
const ts = require("typescript")

function loadTsModule(tsFilePath) {
  const source = fs.readFileSync(tsFilePath, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
  })
  const mod = { exports: {} }
  const fn = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    outputText
  )
  fn(mod.exports, require, mod, tsFilePath, path.dirname(tsFilePath))
  return mod.exports
}

const { isDeployAuthorized } = loadTsModule(
  path.join(__dirname, "../src/utils/deploy-auth.ts")
)

describe("isDeployAuthorized", () => {
  const originalSecret = process.env.REVALIDATE_SECRET

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.REVALIDATE_SECRET
    } else {
      process.env.REVALIDATE_SECRET = originalSecret
    }
  })

  it("authorizes authenticated Strapi admin user on ctx.state.user", async () => {
    const ctx = {
      state: { user: { id: 1 } },
      request: { headers: {} },
    }
    await expect(isDeployAuthorized(ctx)).resolves.toBe(true)
  })

  it("authorizes matching x-strapi-secret header", async () => {
    process.env.REVALIDATE_SECRET = "my-secret-value"
    const ctx = {
      state: {},
      request: { headers: { "x-strapi-secret": "my-secret-value" } },
    }
    await expect(isDeployAuthorized(ctx)).resolves.toBe(true)
  })

  it("rejects missing or invalid secret", async () => {
    process.env.REVALIDATE_SECRET = "my-secret-value"
    const ctx = {
      state: {},
      request: { headers: { "x-strapi-secret": "wrong-secret" } },
    }
    await expect(isDeployAuthorized(ctx)).resolves.toBe(false)
  })
})
