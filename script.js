let scene = new THREE.Scene();
scene.background = new THREE.Color(0x160016);

let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 4, 21);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

function fullscreen() {
	const el = renderer && renderer.domElement ? renderer.domElement : document.documentElement;
	const doc = document;
	const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
	const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
	const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
	const done = () => requestAnimationFrame(updateViewport);
	if (!isFs && request) {
		try {
			const ret = request.call(el);
			if (ret && typeof ret.then === 'function') ret.finally(done); else setTimeout(done, 0);
		} catch (_) {
			setTimeout(done, 0);
		}
	} else if (isFs && exit) {
		try {
			const ret = exit.call(doc);
			if (ret && typeof ret.then === 'function') ret.finally(done); else setTimeout(done, 0);
		} catch (_) {
			setTimeout(done, 0);
		}
	} else {
		done();
	}
}

function updateViewport() {
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(innerWidth, innerHeight);
}

window.addEventListener('resize', updateViewport);
document.addEventListener('fullscreenchange', () => requestAnimationFrame(updateViewport));
document.addEventListener('webkitfullscreenchange', () => requestAnimationFrame(updateViewport));
document.addEventListener('MSFullscreenChange', () => requestAnimationFrame(updateViewport));

// let textureLoader = new THREE.TextureLoader();
// let texture = textureLoader.load(
// 	"./your-local-image.jpg",
// 	(texture) => {
//	 	texture.mapping = THREE.EquirectangularReflectionMapping;
//	 	scene.background = texture;
//	 }
// );

let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

let gu = {
	time: { value: 0 }
};

let sizes = [];
let shift = [];
let pushShift = () => {
	shift.push(
		Math.random() * Math.PI,
		Math.random() * Math.PI * 2,
		(Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
		Math.random() * 0.9 + 0.1
	);
};
let pts = new Array(3e5).fill().map((p) => {
	sizes.push(Math.random() * 1.5 + 0.5);
	pushShift();
	return new THREE.Vector3()
		.randomDirection()
		.multiplyScalar(Math.random() * 10.0 + 2.0);
});
let dis_list = [-3.0, 7.0, 17.0, 27.0];
for (let i = 1; i <= 2e5; ++i) {
	for (let d of dis_list) {
		let radius = Math.log2(i * 100.0) + d;
		pts.push(
			new THREE.Vector3().setFromCylindricalCoords(
				radius,
				Math.random() * 2 * Math.PI,
				(Math.random() - 0.5) * 2
			)
		);
		sizes.push(Math.random() * 1.5 + 0.5);
		pushShift();
	}
}

let g = new THREE.BufferGeometry().setFromPoints(pts);
g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
let m = new THREE.PointsMaterial({
	size: 0.125,
	transparent: true,
	depthTest: false,
	blending: THREE.AdditiveBlending,
	onBeforeCompile: (shader) => {
		shader.uniforms.time = gu.time;
		shader.vertexShader = `
			uniform float time;
			attribute float sizes;
			attribute vec4 shift;
			varying vec3 vColor;
			${shader.vertexShader}
		`
			.replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
			.replace(
				`#include <color_vertex>`,
				`#include <color_vertex>
				float d = length(abs(position) / vec3(40., 10., 40));
				d = clamp(d, 0., 1.);
				vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
			`
			)
			.replace(
				`#include <begin_vertex>`,
				`#include <begin_vertex>
				float t = time;
				float moveT = mod(shift.x + shift.z * t, PI2);
				float moveS = mod(shift.y + shift.z * t, PI2);
				transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
			`
			);
		//console.log(shader.vertexShader);
		shader.fragmentShader = `
			varying vec3 vColor;
			${shader.fragmentShader}
		`
			.replace(
				`#include <clipping_planes_fragment>`,
				`#include <clipping_planes_fragment>
				float d = length(gl_PointCoord.xy - 0.5);
				//if (d > 0.5) discard;
			`
			)
			.replace(
				`vec4 diffuseColor = vec4( diffuse, opacity );`,
				`vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d)/* * 0.5 + 0.5*/ );`
			);
		//console.log(shader.fragmentShader);
	}
});
let p = new THREE.Points(g, m);
p.rotation.order = "ZYX";
p.rotation.z = 0.2;
scene.add(p);

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
	controls.update();
	let t = clock.getElapsedTime() * 0.5;
	gu.time.value = t * Math.PI;
	p.rotation.y = t * 0.05;
	renderer.render(scene, camera);
});