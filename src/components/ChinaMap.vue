<template>
  <div ref="wrapRef" class="china-map-wrap" aria-label="全国区域分布三维地图"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

const props = defineProps<{ data: Record<string, number>; selected: string }>()
const emit = defineEmits<{ (e: 'select', name: string): void }>()

type Position = [number, number]
type Ring = Position[]
type GeoFeature = {
  properties: { name?: string; centroid?: Position | null; center?: Position | null }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Ring[] | Ring[][] } | null
}
type GeoCollection = { features: GeoFeature[] }

type ProvinceEntry = {
  mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshLambertMaterial>
  name: string
  center: Position
  targetZ: number
}

const BASE_COLOR = 0x31423a
const DATA_COLOR = 0x46a987
const SELECTED_COLOR = 0xf4b95f
const HOVER_EMISSIVE = 0x14352b
const OUTLINE_COLOR = 0x16211c
const MAP_DEPTH = 1.6
const MAP_WIDTH = 44

const toMercator = (lon: number, lat: number): Position => [
  (lon * Math.PI) / 180,
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]

function polygonToShape(rings: Ring[], project: (lon: number, lat: number) => Position) {
  const [outer, ...holes] = rings
  const shape = new THREE.Shape(outer.map(([lon, lat]) => new THREE.Vector2(...project(lon, lat))))
  for (const hole of holes) {
    shape.holes.push(new THREE.Path(hole.map(([lon, lat]) => new THREE.Vector2(...project(lon, lat)))))
  }
  return shape
}

const wrapRef = ref<HTMLDivElement>()
const provincesRef = ref<ProvinceEntry[]>([])
const labelsRef = ref<THREE.Group | null>(null)
const ready = ref(false)
const stateRef = ref<{ data: Record<string, number>; onSelect: (name: string) => void }>({
  data: props.data,
  onSelect: (name) => emit('select', name),
})

let disposeScene: (() => void) | null = null

onMounted(() => {
  const wrap = wrapRef.value
  if (!wrap) return
  let cancelled = false

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600)
  camera.position.set(0, 42, 36)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  wrap.appendChild(renderer.domElement)

  const labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.classList.add('map-label-layer')
  wrap.appendChild(labelRenderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 32
  controls.maxDistance = 110
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = 1.35

  scene.add(new THREE.AmbientLight(0xffffff, 1.4))
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(18, 60, 26)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0x9fd8c2, 0.7)
  fillLight.position.set(-40, 20, -30)
  scene.add(fillLight)

  const root = new THREE.Group()
  root.rotation.x = -Math.PI / 2
  scene.add(root)
  const labelsGroup = new THREE.Group()
  root.add(labelsGroup)
  labelsRef.value = labelsGroup

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let hovered: ProvinceEntry | null = null

  const pick = (event: { clientX: number; clientY: number }): ProvinceEntry | null => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const [hit] = raycaster.intersectObjects(provincesRef.value.map((item) => item.mesh), false)
    return hit ? provincesRef.value.find((item) => item.mesh === hit.object) ?? null : null
  }

  let downX = 0
  let downY = 0
  const handlePointerDown = (event: PointerEvent) => {
    downX = event.clientX
    downY = event.clientY
  }
  const handleClick = (event: MouseEvent) => {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return
    const hit = pick(event)
    if (hit && hit.name in stateRef.value.data) stateRef.value.onSelect(hit.name)
  }
  const handlePointerMove = (event: PointerEvent) => {
    const hit = pick(event)
    const next = hit && hit.name in stateRef.value.data ? hit : null
    if (next === hovered) return
    hovered?.mesh.material.emissive.setHex(0x000000)
    hovered = next
    hovered?.mesh.material.emissive.setHex(HOVER_EMISSIVE)
    renderer.domElement.style.cursor = hovered ? 'pointer' : ''
  }
  renderer.domElement.addEventListener('pointerdown', handlePointerDown)
  renderer.domElement.addEventListener('click', handleClick)
  renderer.domElement.addEventListener('pointermove', handlePointerMove)

  const resize = () => {
    const width = wrap.clientWidth
    const height = wrap.clientHeight
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    labelRenderer.setSize(width, height)
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(wrap)

  let frame = 0
  const tick = () => {
    frame = requestAnimationFrame(tick)
    for (const item of provincesRef.value) {
      item.mesh.position.z += (item.targetZ - item.mesh.position.z) * 0.14
    }
    controls.update()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }
  tick()

  fetch(`${import.meta.env.BASE_URL}china.json`)
    .then((response) => response.json() as Promise<GeoCollection>)
    .then((geo) => {
      if (cancelled) return
      const features = geo.features.filter((feature) => feature.geometry && feature.properties.name)
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const feature of features) {
        const geometry = feature.geometry!
        const polys: Ring[][] = geometry.type === 'Polygon'
          ? [geometry.coordinates as Ring[]]
          : (geometry.coordinates as Ring[][])
        for (const poly of polys) {
          for (const [lon, lat] of poly[0]) {
            const [x, y] = toMercator(lon, lat)
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
        }
      }
      const midX = (minX + maxX) / 2
      const midY = (minY + maxY) / 2
      const scale = MAP_WIDTH / Math.max(maxX - minX, 1e-9)
      const project = (lon: number, lat: number): Position => {
        const [x, y] = toMercator(lon, lat)
        return [(x - midX) * scale, (y - midY) * scale]
      }

      const provinces: ProvinceEntry[] = []
      for (const feature of features) {
        const geometry = feature.geometry!
        const polys: Ring[][] = geometry.type === 'Polygon'
          ? [geometry.coordinates as Ring[]]
          : (geometry.coordinates as Ring[][])
        const extrude = new THREE.ExtrudeGeometry(
          polys.map((poly) => polygonToShape(poly, project)),
          { depth: MAP_DEPTH, bevelEnabled: false },
        )
        const material = new THREE.MeshLambertMaterial({ color: BASE_COLOR })
        const mesh = new THREE.Mesh(extrude, material)
        mesh.add(new THREE.LineSegments(
          new THREE.EdgesGeometry(extrude, 8),
          new THREE.LineBasicMaterial({ color: OUTLINE_COLOR, transparent: true, opacity: 0.55 }),
        ))
        const centerGeo = feature.properties.centroid ?? feature.properties.center
        provinces.push({
          mesh,
          name: feature.properties.name!,
          center: centerGeo ? project(centerGeo[0], centerGeo[1]) : [0, 0],
          targetZ: 0,
        })
        root.add(mesh)
      }
      provincesRef.value = provinces
      ready.value = true
    })
    .catch((error) => console.error('加载中国地图数据失败', error))

  disposeScene = () => {
    cancelled = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
    renderer.domElement.removeEventListener('click', handleClick)
    renderer.domElement.removeEventListener('pointermove', handlePointerMove)
    controls.dispose()
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) object.material.forEach((item) => item.dispose())
        else object.material.dispose()
      }
    })
    renderer.dispose()
    labelRenderer.domElement.remove()
    renderer.domElement.remove()
    provincesRef.value = []
    labelsRef.value = null
  }
})

onBeforeUnmount(() => {
  disposeScene?.()
  disposeScene = null
})

watch(
  [ready, () => props.data, () => props.selected],
  () => {
    if (!ready.value) return
    for (const item of provincesRef.value) {
      const hasData = item.name in props.data
      const isSelected = item.name === props.selected
      item.targetZ = isSelected ? 1.35 : hasData ? 0.55 : 0
      item.mesh.material.color.setHex(isSelected ? SELECTED_COLOR : hasData ? DATA_COLOR : BASE_COLOR)
    }
    const labelsGroup = labelsRef.value
    if (!labelsGroup) return
    labelsGroup.clear()
    for (const item of provincesRef.value) {
      const value = props.data[item.name]
      if (value == null) continue
      const chip = document.createElement('div')
      chip.className = `map-chip${item.name === props.selected ? ' map-chip-active' : ''}`
      const nameEl = document.createElement('span')
      nameEl.textContent = item.name
      const valueEl = document.createElement('b')
      valueEl.textContent = `${value} 个`
      chip.append(nameEl, valueEl)
      chip.addEventListener('click', () => stateRef.value.onSelect(item.name))
      const label = new CSS2DObject(chip)
      label.position.set(item.center[0], item.center[1], MAP_DEPTH + 1.5)
      labelsGroup.add(label)
    }
  },
)
</script>