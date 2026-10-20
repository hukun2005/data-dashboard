import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // 按依赖拆包：把体积大且不常变的库单独打成 chunk，利用浏览器缓存并避免单个超大文件
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
            if (id.includes('three')) return 'three'
            if (id.includes('ant-design-vue') || id.includes('@ant-design')) return 'antd-vue'
            if (id.includes('@vue') || id.includes('node_modules/vue/')) return 'vue-vendor'
            return 'vendor'
          }
        },
      },
    },
  },
})