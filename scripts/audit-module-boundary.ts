import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const repositoryRoot = process.cwd()
const sourceRoot = path.join(repositoryRoot, 'src')
const allowedSourceRoots = new Set(['api', 'types', 'views'])
const allowedRootFiles = new Set(['index.ts', 'main.ts'])
const sourceExtensions = new Set(['.ts', '.tsx', '.vue'])
const allowedFunctionSharedFiles = new Set<string>()
const violations: string[] = []

for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && !allowedSourceRoots.has(entry.name)) {
    violations.push(`不允许的公共源码目录: src/${entry.name}`)
  }
  if (entry.isFile() && !allowedRootFiles.has(entry.name)) {
    violations.push(`不允许的应用壳文件: src/${entry.name}`)
  }
}

for (const requiredPath of [
  'src/index.ts',
  'src/main.ts',
  'src/api/index.ts',
  'src/views/recruitment/workbench/index.vue'
]) {
  if (!existsSync(path.join(repositoryRoot, requiredPath))) {
    violations.push(`缺少 HR 业务入口: ${requiredPath}`)
  }
}

function collectSourceFiles(target: string): string[] {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return [target]
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    collectSourceFiles(path.join(target, entry.name))
  )
}

for (const filePath of collectSourceFiles(sourceRoot)) {
  if (!sourceExtensions.has(path.extname(filePath))) continue
  const source = readFileSync(filePath, 'utf8')
  if (/@\/(?:views|api)\/(?:finance|fms|hr|smis|tms|vms)(?:['"/])/.test(source)) {
    violations.push(`${path.relative(repositoryRoot, filePath)} 直接引用了其他业务仓前端源码`)
  }
  if (/src\/(?:auth|components|router|store|utils)\//.test(source)) {
    violations.push(`${path.relative(repositoryRoot, filePath)} 包含了应由主平台维护的公共实现`)
  }
}

const functionSharedRoot = path.join(repositoryRoot, 'supabase/functions/_shared')
for (const filePath of collectSourceFiles(functionSharedRoot)) {
  const fileName = path.basename(filePath)
  if (!allowedFunctionSharedFiles.has(fileName)) {
    violations.push(`Edge Function 包含平台公共实现: supabase/functions/_shared/${fileName}`)
  }
}

if (violations.length > 0) {
  console.error(['HR 模块边界审计失败：', ...violations.map((item) => `- ${item}`)].join('\n'))
  process.exitCode = 1
} else {
  console.log('HR business-only boundary audit passed.')
}
