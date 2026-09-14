import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: true,
    sourcemap: true,
    clean: true,
    outputOptions: {
      entryFileNames: 'index.js'
    }
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    deps: {
      neverBundle: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-whale-girl", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;'
    }
  }
])
