# 智慧监管数据大屏

基于 Vue 3 + TypeScript + Vite 构建的「项目交易监管总览」数据大屏，聚焦监管场景下的指标总览、趋势分析与风险监控，支持指标配置、图表联动、3D 区域地图钻取等能力。

## 功能特性

- 核心指标卡：项目总数、交易金额、异常数量，随年度与行政区域联动变化
- 交易趋势：月度金额 / 项目数双轴图表，支持折线图、面积图、柱状图切换
- 3D 中国地图：省份立体挤出、悬浮高亮、点击钻取行政区域，其余数据联动切换
- 异常构成：异常类型占比环形图，风险线索一目了然
- 指标配置抽屉：控制模块显隐、调整展示顺序、切换图表类型，配置实时生效
- 统计口径说明与实时状态栏

## 技术栈

- 前端框架：Vue 3（Composition API + `<script setup>`）
- 开发语言：TypeScript
- 构建工具：Vite 6
- UI 组件库：Ant Design Vue 4
- 数据可视化：ECharts 6（按需引入）
- 三维地图：Three.js + OrbitControls + CSS2DRenderer

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 目录结构

```
my-app
├── public
│   └── china.json          # 中国地图 GeoJSON 边界数据
├── src
│   ├── main.ts             # 应用入口
│   ├── App.vue             # 主页面（数据逻辑 + 布局）
│   ├── App.css             # 全局大屏样式
│   ├── index.css           # 基础样式
│   └── components
│       ├── EChart.vue      # ECharts 图表封装（按需注册）
│       ├── ChinaMap.vue    # Three.js 3D 中国地图
│       └── Function.vue    # 指标与图表配置抽屉
├── vite.config.ts          # Vite 配置（按依赖拆包）
└── package.json
```

## 页面结构

- Topbar：品牌标识与数据实时状态
- Page Heading：年度 / 行政区域筛选 + 指标配置入口
- Metric Grid：三个核心指标卡
- Chart Grid：交易趋势、区域分布地图、异常构成、统计口径
- Footer：数据来源说明

## 数据说明

项目数据为前端模拟数据，按「年度 × 行政区域」两个维度组织。区域包含北京、上海、广东、浙江、四川、湖北六个地区，年度支持 2022–2025，通过系数缩放模拟不同年度的规模变化。

## 构建优化

- ECharts 按需引入：仅注册用到的图表与组件，打包体积较全量引入减半
- 依赖拆包：echarts / three / ant-design-vue 等大库拆分为独立 chunk，利用浏览器缓存，首屏入口 JS 控制在 20 KB 左右

## 开发记录

1. 完成监管大屏指标配置与图表联动：项目总数、交易金额、异常数量按年度与行政区域模拟不同数据
2. 组件化实现指标配置：支持控制模块显示、调整展示顺序、切换图表展示类型
3. 实现点击区域分布地图的数据块钻取行政区域，其余数据联动变化
4. 将项目从 React 迁移至 Vue 3，并完成 ECharts 按需引入与依赖拆包优化