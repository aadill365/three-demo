import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import saadUrl from './static/saad.jpeg'
import saifUrl from './static/saif.jpeg'
import saudUrl from './static/saud.jpeg'
import catUrl from './static/cat.jpeg'
import trackUrl from "./static/Gangsta's Paradise Oiia.mp3"

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x05050c)
scene.fog = new THREE.Fog(0x05050c, 14, 34)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  120
)
camera.position.set(0, 4, 16)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.maxDistance = 26
controls.minDistance = 5

scene.add(new THREE.AmbientLight(0xffffff, 0.25))
const keyLight = new THREE.DirectionalLight(0xaaccff, 0.5)
keyLight.position.set(2, 6, 4)
scene.add(keyLight)

// --- the sun: a warm glowing body at the center everything wanders around ---
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffd27a })
)
scene.add(sun)

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.5, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.2, side: THREE.BackSide })
)
sun.add(sunGlow)

const sunLight = new THREE.PointLight(0xffd27a, 70, 40, 2)
sun.add(sunLight)

// drifting star-dust backdrop
const starCount = 600
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i++) {
  const radius = 16 + Math.random() * 14
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
  starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
  starPositions[i * 3 + 2] = radius * Math.cos(phi)
}
const starGeometry = new THREE.BufferGeometry()
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0x8899cc, size: 0.035, transparent: true, opacity: 0.75 })
)
scene.add(stars)

// faint orbit rings so the paths read as a solar system
const orbitRadii = [6, 8.5, 11]
for (const r of orbitRadii) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 0.015, r + 0.015, 128),
    new THREE.MeshBasicMaterial({ color: 0x334066, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  )
  ring.rotation.x = Math.PI / 2
  scene.add(ring)
}

// --- audio: click-to-play track + analyser for beat-reactive visuals ---
const audio = new Audio(trackUrl)
audio.loop = true
audio.crossOrigin = 'anonymous'

const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
const audioSource = audioCtx.createMediaElementSource(audio)
const analyser = audioCtx.createAnalyser()
analyser.fftSize = 256
audioSource.connect(analyser)
analyser.connect(audioCtx.destination)

const freqData = new Uint8Array(analyser.frequencyBinCount)
let bass = 0
let treble = 0

// --- a comedic intro: an asteroid chases a spacecraft that lands right where
// the play button belongs, narrowly missing it and flying off ---
const introStyle = document.createElement('style')
introStyle.textContent = `
@keyframes rocket-land {
  0%   { transform: translate(70vw, -80vh) rotate(50deg) scale(0.6); opacity: 0; }
  15%  { opacity: 1; }
  72%  { transform: translate(5vw, -6vh) rotate(18deg) scale(1.05); }
  88%  { transform: translate(-4px, 8px) rotate(-8deg) scale(1.12); }
  100% { transform: translate(0, 0) rotate(0deg) scale(1); }
}
@keyframes asteroid-chase {
  0%   { transform: translate(95vw, -95vh) rotate(0deg) scale(1.5); opacity: 0; }
  12%  { opacity: 1; }
  74%  { transform: translate(12vw, -4vh) rotate(220deg) scale(1.3); }
  100% { transform: translate(-35vw, 45vh) rotate(480deg) scale(1); opacity: 0; }
}
`
document.head.appendChild(introStyle)

const asteroid = document.createElement('div')
asteroid.textContent = '🪨'
Object.assign(asteroid.style, {
  position: 'fixed',
  bottom: '24px',
  left: '24px',
  fontSize: '34px',
  zIndex: 9,
  pointerEvents: 'none',
  animation: 'asteroid-chase 2.1s cubic-bezier(0.3, 0, 0.7, 1) forwards',
})
document.body.appendChild(asteroid)

const playButton = document.createElement('button')
playButton.textContent = '🚀'
playButton.title = 'play/pause the soundtrack'
Object.assign(playButton.style, {
  position: 'fixed',
  bottom: '24px',
  left: '24px',
  width: '48px',
  height: '48px',
  padding: '0',
  background: 'rgba(20, 20, 32, 0.75)',
  color: '#dfe6ff',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: '50%',
  fontSize: '20px',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  zIndex: 10,
  pointerEvents: 'none',
  animation: 'rocket-land 1.8s cubic-bezier(0.2, 0.7, 0.3, 1) forwards',
})
document.body.appendChild(playButton)

async function startPlayback() {
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  if (audio.paused) {
    try {
      await audio.play()
      playButton.textContent = '⏸'
    } catch {
      // autoplay blocked — will retry on the first click/keypress anywhere
    }
  }
}

playButton.addEventListener('animationend', () => {
  playButton.style.pointerEvents = 'auto'
  asteroid.remove()
  startPlayback()
})

playButton.addEventListener('click', async () => {
  if (audio.paused) {
    await startPlayback()
  } else {
    audio.pause()
    playButton.textContent = '🚀'
  }
})

// if the browser blocked autoplay, the first tap/click/keypress anywhere unlocks it
// (uses 'click' rather than 'pointerdown' so it fires after the play button's
// own click handler on the same gesture, instead of racing it)
function unlockOnFirstInteraction() {
  if (audio.paused) startPlayback()
  window.removeEventListener('click', unlockOnFirstInteraction)
  window.removeEventListener('keydown', unlockOnFirstInteraction)
}
window.addEventListener('click', unlockOnFirstInteraction)
window.addEventListener('keydown', unlockOnFirstInteraction)

function updateAudioEnergy() {
  if (audio.paused) {
    bass *= 0.92
    treble *= 0.92
    return
  }
  analyser.getByteFrequencyData(freqData)
  const bassEnd = Math.floor(freqData.length * 0.12)
  let bassSum = 0
  for (let i = 0; i < bassEnd; i++) bassSum += freqData[i]
  const trebleStart = Math.floor(freqData.length * 0.5)
  let trebleSum = 0
  for (let i = trebleStart; i < freqData.length; i++) trebleSum += freqData[i]

  const bassLevel = bassSum / bassEnd / 255
  const trebleLevel = trebleSum / (freqData.length - trebleStart) / 255
  bass += (bassLevel - bass) * 0.3
  treble += (trebleLevel - treble) * 0.3
}

// --- three textured planets, wandering in orbit around the sun ---
const planets = []
const PLANET_CONFIGS = [
  { url: saifUrl, radius: 6, speed: 0.16, phase: 0, wobble: 0.6, size: 1.1, spawnDelay: 0 },
  { url: saadUrl, radius: 8.5, speed: -0.11, phase: 2.1, wobble: 0.9, size: 1.3, spawnDelay: 0.3 },
  { url: saudUrl, radius: 11, speed: 0.08, phase: 4.3, wobble: 1.2, size: 1.5, spawnDelay: 0.6 },
]

const PLANET_TINTS = [0x556b8f, 0x8a5a6b, 0x5a8a6f]

PLANET_CONFIGS.forEach((config, i) => {
  // carrier orbits and always faces the camera; the sphere spins inside it
  // independently, and the face decal is a flat, correctly-proportioned
  // plane held in front of the sphere so the photo is never stretched
  const carrier = new THREE.Group()
  scene.add(carrier)

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(config.size, 48, 48),
    new THREE.MeshStandardMaterial({ color: PLANET_TINTS[i], roughness: 0.7, metalness: 0.1 })
  )
  carrier.add(sphere)

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide })
  )
  face.position.z = config.size * 1.05
  carrier.add(face)

  carrier.scale.setScalar(0.001)

  const planet = {
    carrier,
    sphere,
    face,
    orbit: config,
    spinSpeed: 0.15 + Math.random() * 0.2,
  }
  planets.push(planet)

  new THREE.TextureLoader().load(config.url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    const aspect = texture.image.width / texture.image.height
    const target = config.size * 1.5
    const w = aspect >= 1 ? target : target * aspect
    const h = aspect >= 1 ? target / aspect : target
    face.scale.set(w, h, 1)
    face.material.map = texture
    face.material.opacity = 1
    face.material.needsUpdate = true
  })
})

function orbitPosition(config, time, out) {
  const { radius, speed, phase, wobble } = config
  const angle = time * speed + phase
  const r = radius + Math.sin(time * 0.25 + phase) * wobble
  return out.set(Math.cos(angle) * r, Math.sin(time * 0.35 + phase * 1.6) * 1.2, Math.sin(angle) * r)
}

function makeRockGeometry(size) {
  const geometry = new THREE.IcosahedronGeometry(size, 0)
  const pos = geometry.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.multiplyScalar(1 + (Math.random() - 0.5) * 0.5)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

// --- a swarm of asteroids chasing each planet along its own orbital path,
// trailing a little behind in time so they read as pursuit, not decoration ---
const asteroids = []
const ASTEROIDS_PER_PLANET = 5

planets.forEach((planet) => {
  for (let i = 0; i < ASTEROIDS_PER_PLANET; i++) {
    const size = 0.14 + Math.random() * 0.22
    const mesh = new THREE.Mesh(
      makeRockGeometry(size),
      new THREE.MeshStandardMaterial({ color: 0x7c7468, roughness: 0.95, metalness: 0.05 })
    )
    mesh.scale.setScalar(0.001)
    scene.add(mesh)

    asteroids.push({
      mesh,
      planet,
      trailDelay: 0.6 + i * 0.35 + Math.random() * 0.3,
      spawnDelay: planet.orbit.spawnDelay + 0.8 + i * 0.15,
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 1.3,
        (Math.random() - 0.5) * 1.8
      ),
      jitterSeed: Math.random() * 10,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      ),
    })
  }
})

// --- a cat, because why not — roams freely through the whole scene on its
// own lazy Lissajous path, ignoring the planets and asteroids entirely ---
const cat = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0 }))
scene.add(cat)

new THREE.TextureLoader().load(catUrl, (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace
  const aspect = texture.image.width / texture.image.height
  const target = 2.2
  cat.scale.set(aspect >= 1 ? target : target * aspect, aspect >= 1 ? target / aspect : target, 1)
  cat.material.map = texture
  cat.material.opacity = 1
  cat.material.needsUpdate = true
})

const easeOutBack = (x) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
const clock = new THREE.Clock()
const tmpVec = new THREE.Vector3()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime()

  updateAudioEnergy()

  const bassPunch = bass * bass * 1.6

  sun.scale.setScalar(1 + bassPunch * 0.3)
  sunLight.intensity = 70 + bass * 150
  keyLight.intensity = 0.5 + treble * 0.6
  stars.rotation.y = t * 0.01 + bass * 0.006

  for (const planet of planets) {
    orbitPosition(planet.orbit, t, planet.carrier.position)
    planet.carrier.lookAt(camera.position)

    const spawn = easeOutBack(THREE.MathUtils.clamp((t - planet.orbit.spawnDelay) / 1.2, 0, 1))
    planet.carrier.scale.setScalar(Math.max(0.001, spawn) * (1 + bassPunch * 0.15))

    planet.sphere.rotation.y += planet.spinSpeed * 0.016
  }

  for (const asteroid of asteroids) {
    orbitPosition(asteroid.planet.orbit, t - asteroid.trailDelay, tmpVec)
    asteroid.mesh.position.set(
      tmpVec.x + asteroid.offset.x + Math.sin(t * 1.3 + asteroid.jitterSeed) * 0.15,
      tmpVec.y + asteroid.offset.y + Math.cos(t * 1.7 + asteroid.jitterSeed) * 0.12,
      tmpVec.z + asteroid.offset.z + Math.sin(t * 1.1 + asteroid.jitterSeed * 1.3) * 0.15
    )
    asteroid.mesh.rotation.set(t * asteroid.spin.x, t * asteroid.spin.y, t * asteroid.spin.z)

    const spawn = easeOutBack(THREE.MathUtils.clamp((t - asteroid.spawnDelay) / 1, 0, 1))
    asteroid.mesh.scale.setScalar(Math.max(0.001, spawn))
  }

  cat.position.set(
    Math.sin(t * 0.13) * 10,
    Math.sin(t * 0.21 + 1.5) * 3.5,
    Math.cos(t * 0.09 + 0.7) * 9
  )
  cat.material.rotation = Math.sin(t * 0.4) * 0.2

  controls.update()
  renderer.render(scene, camera)
})
