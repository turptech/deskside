import { execFileSync } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import openapiTS, { astToString } from "openapi-typescript"
import { format, resolveConfig } from "prettier"

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const apiRoot = path.resolve(frontendRoot, "../mock-psa-api")
const outputPath = path.join(frontendRoot, "src/api/generated-schema.ts")
const schema = JSON.parse(
  execFileSync(
    "uv",
    [
      "run",
      "python",
      "-c",
      "import json; from mock_psa_api.main import create_app; print(json.dumps(create_app(initialize_database=False).openapi()))",
    ],
    {
      cwd: apiRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        UV_CACHE_DIR:
          process.env.UV_CACHE_DIR ?? path.join(tmpdir(), "deskside-uv-cache"),
      },
    },
  ),
)
const generated = astToString(await openapiTS(schema))
await writeFile(
  outputPath,
  await format(generated, {
    ...(await resolveConfig(outputPath)),
    filepath: outputPath,
  }),
)
console.log(`Generated ${path.relative(frontendRoot, outputPath)}`)
