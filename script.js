let scene = new THREE.Scene();
scene.background = new THREE.Color(0x160016);

let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 8, 42);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

let clock = new THREE.Clock();

function updateViewport() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

window.addEventListener('resize', updateViewport);

// let textureLoader = new THREE.TextureLoader();
// let texture = textureLoader.load(
// 	"./background.jpg",
// 	(texture) => {
//	 	texture.mapping = THREE.EquirectangularReflectionMapping;
//	 	scene.background = texture;
//	 }
// );

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;

let gu = {
  time: { value: 0 },
  morphA: { value: 0 },
  morphB: { value: 0 },
  morphC: { value: 0 },
  colorF: { value: new THREE.Color(227 / 255, 155 / 255, 0 / 255) },
  colorT: { value: new THREE.Color(100 / 255, 50 / 255, 255 / 255) }
};

let COLORS = [
  { from: new THREE.Color(227 / 255, 155 / 255, 0 / 255), to: new THREE.Color(100 / 255, 50 / 255, 255 / 255) },
  { from: new THREE.Color(238 / 255, 0 / 255, 255 / 255), to: new THREE.Color(52 / 255, 162 / 255, 255 / 255) },
  { from: new THREE.Color(255 / 255, 0 / 255, 0 / 255), to: new THREE.Color(52 / 255, 255 / 255, 93 / 255) }
];
let colorIdx = 0;

let TIMING = {
  dur: 3.0,
  t1: 10.0,
  t2: 23.0,
  t3: 52.0,
  flip: false
};

let SENTENCES = [
  ["XX，祝你", "生日快乐哟~"],
  ["愿你笑容常在，", "每天幸福快乐！"]
];

function buildTextLayout(lines) {
  let points = [];
  let positions = [];

  let canvas = document.createElement("canvas");
  canvas.width = 2000;
  canvas.height = 1000;
  let ctx = canvas.getContext("2d");

  let fontSize = 200;
  let pixelToWorld = 0.1;
  let thickness = 2.0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px "YouYuan", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif`;
  let centerX = canvas.width * 0.5;
  let lineGap = fontSize * 1.2;
  ctx.fillText(lines[0], centerX, canvas.height * 0.5 - lineGap * 0.5);
  ctx.fillText(lines[1], centerX, canvas.height * 0.5 + lineGap * 0.5);

  let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let samples = [];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let idx = (y * canvas.width + x) * 4;
      if (data[idx + 3] > 30 && data[idx] > 80) {
        samples.push([x, y]);
      }
    }
  }

  let cx = canvas.width * 0.5;
  let cy = canvas.height * 0.5;
  for (let i = 0; i < 11e5; i++) {
    let pick = samples[Math.floor(Math.random() * samples.length)];
    let x = (pick[0] - cx) * pixelToWorld;
    let y = (cy - pick[1]) * pixelToWorld;
    let z = (Math.random() - 0.5) * thickness;
    let p = new THREE.Vector3(x, y, z);
    points.push(p);
    positions.push(x, y, z);
  }

  return { points, positions };
}

function buildStarALayout() {
  let points = [];
  let positions = [];

  points = new Array(3e5).fill().map(() => {
    let p = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(Math.random() * 12.0 + 2.0);
    positions.push(p.x, p.y, p.z);
    return p;
  });

  let disList = [-3.0, 7.0, 17.0, 27.0];
  let tiltByRing = [
    new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(45)),
    new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(-45)),
    new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(45)),
    new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-45))
  ];
  for (let i = 1; i <= 2e5; ++i) {
    for (let j = 0; j < disList.length; j++) {
      let radius = Math.log2(i * 520.0) + 1.0;
      let theta = Math.random() * 2 * Math.PI;
      let h = (Math.random() - 0.5) * 2;
      let p = new THREE.Vector3(Math.cos(theta) * radius, h, Math.sin(theta) * radius);
      p.applyMatrix4(tiltByRing[j]);

      points.push(p);
      positions.push(p.x, p.y, p.z);
    }
  }

  return { points, positions };
}

function buildStarBLayout() {
  let points = [];
  let positions = [];

  points = new Array(3e5).fill().map(() => {
    let p = new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(Math.random() * 10.0 + 2.0);
    positions.push(p.x, p.y, p.z);
    return p;
  });

  let disList = [-3.0, 7.0, 17.0, 27.0];
  for (let i = 1; i <= 2e5; ++i) {
    for (let d of disList) {
      let radius = Math.log2(i * 100.0) + d;
      let p = new THREE.Vector3().setFromCylindricalCoords(
        radius,
        Math.random() * 2 * Math.PI,
        (Math.random() - 0.5) * 2
      );
      points.push(p);
      positions.push(p.x, p.y, p.z);
    }
  }

  return { points, positions };
}

let starALayout = buildStarALayout();
let starBLayout = buildStarBLayout();
let textALayout = buildTextLayout(SENTENCES[0]);
let textBLayout = buildTextLayout(SENTENCES[1]);
let sizes = [];
let shift = [];
for (let i = 0; i < 11e5; i++) {
  sizes.push(Math.random() * 1.5 + 0.5);
  shift.push(
    Math.random() * Math.PI,
    Math.random() * Math.PI * 2,
    (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
    Math.random() * 0.9 + 0.1
  );
}

let g = new THREE.BufferGeometry().setFromPoints(starBLayout.points);
g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
g.setAttribute("layoutTextA", new THREE.Float32BufferAttribute(textALayout.positions, 3));
g.setAttribute("layoutTextB", new THREE.Float32BufferAttribute(textBLayout.positions, 3));
g.setAttribute("layoutStarA", new THREE.Float32BufferAttribute(starALayout.positions, 3));
g.setAttribute("layoutStarB", new THREE.Float32BufferAttribute(starBLayout.positions, 3));

let m = new THREE.PointsMaterial({
  size: 0.125,
  transparent: true,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  onBeforeCompile: (shader) => {
    shader.uniforms.time = gu.time;
    shader.uniforms.morphA = gu.morphA;
    shader.uniforms.morphB = gu.morphB;
    shader.uniforms.morphC = gu.morphC;
    shader.uniforms.colorF = gu.colorF;
    shader.uniforms.colorT = gu.colorT;
    shader.vertexShader = `
      uniform float time;
      uniform float morphA;
      uniform float morphB;
      uniform float morphC;
      uniform vec3 colorF;
      uniform vec3 colorT;
      attribute float sizes;
      attribute vec4 shift;
      attribute vec3 layoutTextA;
      attribute vec3 layoutTextB;
      attribute vec3 layoutStarA;
      attribute vec3 layoutStarB;
      varying vec3 vColor;
      ${shader.vertexShader}`
      .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
      .replace(
        `#include <color_vertex>`,
        `#include <color_vertex>
        float d = length(abs(layoutStarB) / vec3(40.0, 10.0, 40.0));
        d = clamp(d, 0.0, 1.0);
        vColor = mix(colorF, colorT, d);`
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
        float localMorphA = clamp((morphA - shift.w * 0.12) / 0.88, 0.0, 1.0);
        float easeMorphA = localMorphA * localMorphA * (3.0 - 2.0 * localMorphA);
        float localMorphB = clamp((morphB - shift.w * 0.12) / 0.88, 0.0, 1.0);
        float easeMorphB = localMorphB * localMorphB * (3.0 - 2.0 * localMorphB);
        float localMorphC = clamp((morphC - shift.w * 0.12) / 0.88, 0.0, 1.0);
        float easeMorphC = localMorphC * localMorphC * (3.0 - 2.0 * localMorphC);
        vec3 textStage = mix(layoutTextA, layoutTextB, easeMorphA);
        vec3 starStage = mix(layoutStarA, layoutStarB, easeMorphC);
        transformed = mix(textStage, starStage, easeMorphB);
        float t = time;
        float moveT = mod(shift.x + shift.z * t, PI2);
        float moveS = mod(shift.y + shift.z * t, PI2);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;`
      );
    shader.fragmentShader = `
      varying vec3 vColor;
      ${shader.fragmentShader}`
      .replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
        float d = length(gl_PointCoord.xy - 0.5);`
      )
      .replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4(vColor, smoothstep(0.5, 0.1, d));`
      );
  }
});

let p = new THREE.Points(g, m);
p.rotation.order = "ZYX";
p.rotation.z = 0.2;
scene.add(p);

window.addEventListener("keydown", (e) => {
  if ((e.code === "KeyC") && !e.repeat) {
    colorIdx = (colorIdx + 1) % COLORS.length;
    gu.colorF.value.copy(COLORS[colorIdx].from);
    gu.colorT.value.copy(COLORS[colorIdx].to);
    e.preventDefault();
  }

  if (e.code === "Space" && !e.repeat) {
    let elapsed = clock.getElapsedTime();
    if (elapsed < TIMING.t1) TIMING.t1 = elapsed;
    else if (elapsed < TIMING.t2) TIMING.t2 = elapsed;
    else if (elapsed < TIMING.t3) TIMING.t3 = elapsed;
    else {
      TIMING.t3 = elapsed;
      TIMING.flip = !TIMING.flip;
    }
    e.preventDefault();
  }
});

function transfer(elapsed, start, duration) {
  if (elapsed <= start) return 0;
  let t = (elapsed - start) / duration;
  t = THREE.MathUtils.clamp(t, 0, 1);
  return Math.sin(t * Math.PI * 0.5);
}

renderer.setAnimationLoop(() => {
  controls.update();
  let elapsed = clock.getElapsedTime();
  gu.morphA.value = transfer(elapsed, TIMING.t1, TIMING.dur);
  gu.morphB.value = transfer(elapsed, TIMING.t2, TIMING.dur);
  gu.morphC.value = transfer(elapsed, TIMING.t3, TIMING.dur);
  gu.morphC.value = TIMING.flip ? 1 - gu.morphC.value : gu.morphC.value;
  gu.time.value = elapsed * Math.PI * 0.5;
  p.rotation.y = elapsed / 40.0;
  renderer.render(scene, camera);
});