import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // echarts 仅结果页异步使用，独立分包避免拖慢首屏；
        // naive-ui / vue 独立分包，业务代码迭代时厂商缓存不失效
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'echarts'
          if (id.includes('node_modules/naive-ui')) return 'naive-ui'
          if (/[\\/]node_modules[\\/](vue|@vue|pinia)[\\/]/.test(id)) return 'vue'
        },
      },
    },
  },
})
