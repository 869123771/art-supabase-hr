import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const applicationRoot = fileURLToPath(new URL('.', import.meta.url))

function isPlatformRoot(candidate: string | undefined): candidate is string {
  if (!candidate) return false
  const packageFile = path.join(candidate, 'package.json')
  if (!existsSync(packageFile)) return false

  try {
    const packageJson = JSON.parse(readFileSync(packageFile, 'utf8')) as { name?: string }
    return packageJson.name === 'art-supabase-pro'
  } catch {
    return false
  }
}

function resolvePlatformRoot(): string {
  const candidates = [
    process.env.ART_SUPABASE_PLATFORM_ROOT,
    path.resolve(applicationRoot, '../..'),
    path.resolve(applicationRoot, '../art-supabase-pro'),
    path.resolve(applicationRoot, 'node_modules/art-supabase-pro')
  ]
  const resolved = candidates.find(isPlatformRoot)
  if (!resolved) {
    throw new Error('未找到 art-supabase-pro 平台运行时，请先执行 pnpm install')
  }
  return realpathSync(resolved)
}

const platformRoot = resolvePlatformRoot()
const platformSourceRoot = path.join(platformRoot, 'src')
const sourceTransformPattern = createSourceTransformPattern(applicationRoot, platformSourceRoot)

function createSourceTransformPattern(...roots: string[]): RegExp {
  const rootPattern = roots
    .map((root) =>
      root
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('|')
  return new RegExp(`^(?:${rootPattern})/.*\\.(?:ts|tsx|vue)(?:\\?.*)?$`)
}
const platformBusinessComponentRoot = path.join(platformSourceRoot, 'components/business')
const platformComponentDirs = [
  path.join(platformSourceRoot, 'components/core'),
  ...readdirSync(platformBusinessComponentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'finance-accounting-workspace-shell')
    .map((entry) => path.join(platformBusinessComponentRoot, entry.name))
]

interface HrRuntimeEnv extends Record<string, string | undefined> {
  VITE_APP_CODE: string
  VITE_BASE_URL?: string
  VITE_OUT_DIR?: string
  VITE_PORT?: string
  VITE_VERSION?: string
}

function createNoJekyllPlugin(): Plugin {
  return {
    name: 'hr-no-jekyll',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' })
    }
  }
}

export default defineConfig(({ mode }) => {
  const platformEnv = loadEnv(mode, platformRoot, '')
  const applicationEnv = loadEnv(mode, applicationRoot, '')
  const env: HrRuntimeEnv = {
    ...platformEnv,
    ...applicationEnv,
    VITE_APP_CODE: 'hr'
  }
  const exposedEnv = Object.fromEntries(
    Object.entries(env)
      .filter((entry): entry is [string, string] =>
        Boolean(entry[0].startsWith('VITE_') && entry[1] !== undefined)
      )
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
  )
  const outDir = process.env.VITE_OUT_DIR || env.VITE_OUT_DIR || 'docs'

  return {
    base: env.VITE_BASE_URL || '/',
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_VERSION || '1.0.0'),
      ...exposedEnv
    },
    server: {
      host: true,
      port: Number(env.VITE_PORT || 3013),
      fs: {
        allow: [applicationRoot, platformRoot]
      }
    },
    preview: {
      host: true,
      port: Number(env.VITE_PORT || 3013)
    },
    resolve: {
      alias: {
        '@hr': path.join(applicationRoot, 'src'),
        '@': platformSourceRoot,
        '@views': path.join(platformSourceRoot, 'views'),
        '@imgs': path.join(platformSourceRoot, 'assets/images'),
        '@icons': path.join(platformSourceRoot, 'assets/icons'),
        '@utils': path.join(platformSourceRoot, 'utils'),
        '@stores': path.join(platformSourceRoot, 'store'),
        '@styles': path.join(platformSourceRoot, 'assets/styles')
      },
      dedupe: ['vue', 'vue-router', 'pinia', 'element-plus']
    },
    plugins: [
      vue(),
      vueJsx(),
      tailwindcss(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        include: [sourceTransformPattern],
        exclude: [/[\\/]\.git[\\/]/],
        dts: false,
        resolvers: [ElementPlusResolver({ importStyle: 'sass' })]
      }),
      Components({
        include: [sourceTransformPattern],
        exclude: [/[\\/]\.git[\\/]/, /[\\/]art-data-select[\\/]preview\.vue$/],
        dirs: platformComponentDirs,
        deep: true,
        dts: false,
        resolvers: [ElementPlusResolver({ importStyle: 'sass' })]
      }),
      ElementPlus({ useSource: true }),
      createNoJekyllPlugin()
    ],
    build: {
      target: 'es2020',
      outDir,
      emptyOutDir: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 2000
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@styles/core/el-light.scss" as elementTheme;
            @use "@styles/core/mixin.scss" as *;
          `
        }
      }
    },
    optimizeDeps: {
      entries: ['index.html', 'src/views/**/*.vue'],
      include: ['vue', 'vue-router', 'pinia', 'element-plus/es']
    }
  }
})
