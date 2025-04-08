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
      external: ['react', 'react-dom', '@xyflow/react', '@dagrejs/dagre'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@xyflow/react': 'ReactFlow',
          '@dagrejs/dagre': 'dagre'
        },
      },
    },
  },
})
