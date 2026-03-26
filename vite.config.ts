import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/LayoutContext/**/*'],
      outDir: 'dist/types',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/LayoutContext/index.ts'),
      name: 'reactFlowAutomatedLayout',
      fileName: (format) => `react-flow-automated-layout.${format}.js`,
    },
    rollupOptions: {
      external: (id) =>
        id === 'react' ||
        id.startsWith('react/') ||
        id === 'react-dom' ||
        id.startsWith('react-dom/') ||
        id === '@xyflow/react' ||
        id.startsWith('@xyflow/react/') ||
        id === '@dagrejs/dagre',
      output: {
        globals: {
          'react/jsx-runtime': 'jsxRuntime',
          'react/jsx-dev-runtime': 'jsxDevRuntime',
          react: 'React',
          'react-dom': 'ReactDOM',
          '@xyflow/react': 'ReactFlow',
          '@dagrejs/dagre': 'dagre'
        },
      },
    },
  },
})
