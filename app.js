// ============================================================
// GAUTAM | Full Stack AI & Creative Engineering Portfolio
// Interactive WebGL Shaders, GSAP ScrollTrigger & Lenis Engine
// ============================================================

// ------------------------------------------------------------
// 1. Setup Custom Cursor with Magnetic Lag & Hover Scaling
// ------------------------------------------------------------
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;
let targetX = mouseX;
let targetY = mouseY;
let isHovered = false;
let portraitBaseY = 0;
let imageAspectRatio = 3.0 / 4.0;

window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
});

function bindHoverTargets() {
    const hoverTargets = document.querySelectorAll('.hover-target, a, button, .flow-node, .highlight-card, .skill-category-card, .cert-card, .outline');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => {
            isHovered = true;
            gsap.to(cursorRing, {
                width: 58,
                height: 58,
                borderColor: 'rgba(255, 45, 32, 1)',
                backgroundColor: 'rgba(255, 45, 32, 0.06)',
                duration: 0.3
            });
            gsap.to(cursorDot, {
                scale: 1.8,
                duration: 0.2
            });
        });
        el.addEventListener('mouseleave', () => {
            isHovered = false;
            gsap.to(cursorRing, {
                width: 32,
                height: 32,
                borderColor: 'rgba(255, 45, 32, 0.45)',
                backgroundColor: 'rgba(255, 45, 32, 0)',
                duration: 0.3
            });
            gsap.to(cursorDot, {
                scale: 1,
                duration: 0.2
            });
        });
    });
}
bindHoverTargets();

// ------------------------------------------------------------
// 2. Smooth Scrolling Setup (Lenis Engine)
// ------------------------------------------------------------
const lenis = new Lenis({
    duration: 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    wheelMultiplier: 1.0,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0, 0);

gsap.registerPlugin(ScrollTrigger);

// ------------------------------------------------------------
// 3. WebGL Cinematic Scene (Unified Three.js Architecture)
// ------------------------------------------------------------
const canvas = document.getElementById('webgl-canvas');
const bgCanvas = document.getElementById('bg-canvas');

// Main Portrait & Particle Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5.0;

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Background Atmosphere Scene
const bgScene = new THREE.Scene();
const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const bgRenderer = new THREE.WebGLRenderer({
    canvas: bgCanvas,
    antialias: true
});
bgRenderer.setSize(window.innerWidth, window.innerHeight);
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ------------------------------------------------------------
// 4. Textures Loading (Grayscale & Color Portraits)
// ------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();

// Prefer base64 strings from textures.js for zero CORS dependency, with asset path fallbacks
const srcBW = (typeof BASE64_BW !== 'undefined') ? BASE64_BW : 'assets/portrait-bw.jpg';
const srcColor = (typeof BASE64_COLOR !== 'undefined') ? BASE64_COLOR : 'assets/portrait-color.jpg';

const textureA = textureLoader.load(srcBW, (tex) => {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (tex.image && tex.image.width && tex.image.height) {
        portraitMaterial.uniforms.u_imageSize.value.set(tex.image.width, tex.image.height);
        imageAspectRatio = tex.image.width / tex.image.height;
    }
    resize();
});

const textureB = textureLoader.load(srcColor, (tex) => {
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
});

// ------------------------------------------------------------
// 5. Volumetric Background Shaders (Atmospheric Fog & Light)
// ------------------------------------------------------------
const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_scroll: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_scroll;
        varying vec2 vUv;

        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = vUv;
            
            // Bright luxury gradient
            vec2 c = vec2(0.5, 0.5);
            float dist = length(uv - c);
            vec3 col = mix(vec3(0.98, 0.98, 0.99), vec3(0.93, 0.94, 0.96), dist);

            // Subtle dynamic spotlight source following mouse
            vec2 lightPos = u_mouse / u_resolution;
            float lightDist = length(uv - lightPos);
            vec3 spotlight = vec3(1.0, 0.28, 0.2) * (1.0 - smoothstep(0.0, 0.75, lightDist)) * 0.022;
            col += spotlight;

            // Fluid atmospheric fog
            float fog = snoise(uv * 1.6 + vec2(u_time * 0.025, u_time * 0.015)) * 0.5 + 0.5;
            float fog2 = snoise(uv * 2.6 - vec2(u_time * 0.035, -u_time * 0.03)) * 0.5 + 0.5;
            float combinedFog = mix(fog, fog2, 0.5);
            vec3 fogColor = vec3(0.91, 0.92, 0.95) * combinedFog * 0.032;
            col += fogColor;

            // Atmospheric moving light ray
            vec2 raySrc = vec2(0.2, 0.95);
            vec2 diff = uv - raySrc;
            float rayAngle = atan(diff.y, diff.x);
            float rayNoise = snoise(vec2(rayAngle * 4.0, u_time * 0.07)) * 0.5 + 0.5;
            float rayFalloff = smoothstep(1.5, 0.0, length(diff));
            col += vec3(1.0, 0.97, 0.94) * rayNoise * rayFalloff * 0.007;

            // Subtle film grain
            float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
            col += (grain - 0.5) * 0.01;

            // Fade to clean background as user scrolls down
            float scrollFade = clamp(u_scroll / 600.0, 0.0, 1.0);
            col = mix(col, vec3(1.0), scrollFade);

            gl_FragColor = vec4(col, 1.0);
        }
    `
});

const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
bgScene.add(bgMesh);

// ------------------------------------------------------------
// 6. Interactive Dual-Portrait Reveal Mesh (Spotlight Shader)
// ------------------------------------------------------------
const portraitMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_textureA: { value: textureA },
        u_textureB: { value: textureB },
        u_time: { value: 0 },
        u_mouseMeshUv: { value: new THREE.Vector2(0.5, 0.5) },
        u_hoverStrength: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_imageSize: { value: new THREE.Vector2(1000, 1333) },
        u_planeSize: { value: new THREE.Vector2(1, 1) },
        u_revealRadius: { value: 0.4 },
        u_scroll: { value: 0 },
        u_textureBOffset: { value: new THREE.Vector2(0.0, 0.0) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D u_textureA;
        uniform sampler2D u_textureB;
        uniform float u_time;
        uniform vec2 u_mouseMeshUv;
        uniform float u_hoverStrength;
        uniform vec2 u_resolution;
        uniform vec2 u_imageSize;
        uniform vec2 u_planeSize;
        uniform float u_revealRadius;
        uniform float u_scroll;
        uniform vec2 u_textureBOffset;
        varying vec2 vUv;

        vec2 getCoverUV(vec2 uv, vec2 imgSize, vec2 planeSize) {
            float imgAspect = imgSize.x / imgSize.y;
            float planeAspect = planeSize.x / planeSize.y;
            
            vec2 scale = vec2(1.0);
            if (planeAspect > imgAspect) {
                scale.y = imgAspect / planeAspect;
            } else {
                scale.x = planeAspect / imgAspect;
            }
            return (uv - 0.5) * scale + 0.5;
        }

        void main() {
            vec2 coverUv = getCoverUV(vUv, u_imageSize, u_planeSize);

            // Read B&W and Color textures
            vec4 texColA = texture2D(u_textureA, coverUv);
            vec3 colA = texColA.rgb;

            vec2 coverUvB = coverUv + u_textureBOffset;
            vec4 texColB = texture2D(u_textureB, coverUvB);
            vec3 colB = texColB.rgb;

            // Distance calculation in local world aspect
            vec2 diff = (vUv - u_mouseMeshUv) * u_planeSize;
            float dist = length(diff);
            
            float radius = u_revealRadius;
            float revealMask = smoothstep(radius, radius - 0.12, dist) * u_hoverStrength;

            // Smoothly blend color over grayscale under cursor
            vec3 finalColor = mix(colA, colB, revealMask);
            float finalAlpha = mix(texColA.a, texColB.a, revealMask);

            // Subtle fade-out as hero is scrolled out of view
            float fadeFactor = 1.0 - clamp((u_scroll - 220.0) / 420.0, 0.0, 1.0);
            
            gl_FragColor = vec4(finalColor, finalAlpha * fadeFactor);
        }
    `,
    transparent: true,
    depthWrite: false
});

const portraitGeometry = new THREE.PlaneGeometry(1, 1, 32, 32);
const portraitMesh = new THREE.Mesh(portraitGeometry, portraitMaterial);
scene.add(portraitMesh);

// ------------------------------------------------------------
// 7. Dynamic 3D Particle Cloud (Interactive Spark Constellation)
// ------------------------------------------------------------
const particleCount = window.innerWidth < 768 ? 60 : 140;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const initialPartData = [];

for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 5.2;
    const y = (Math.random() - 0.5) * 3.6;
    const z = (Math.random() - 0.5) * 2.0 - 0.5;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    initialPartData.push({
        x, y, z,
        speedX: (Math.random() - 0.5) * 0.012,
        speedY: (Math.random() - 0.5) * 0.012,
        speedZ: (Math.random() - 0.5) * 0.007,
        amp: Math.random() * 0.08 + 0.02,
        freq: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2
    });
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 0 },
        u_mouse3D: { value: new THREE.Vector3() },
        u_scroll: { value: 0 }
    },
    vertexShader: `
        uniform float u_time;
        uniform vec3 u_mouse3D;
        varying float vAlpha;
        void main() {
            vec3 pos = position;
            
            // Subtle magnetic pull toward cursor in 3D
            float d = distance(pos, u_mouse3D);
            if (d < 2.2) {
                float pull = (1.0 - (d / 2.2)) * 0.18;
                pos = mix(pos, u_mouse3D, pull);
            }
            
            vAlpha = smoothstep(-2.5, 0.5, pos.z) * 0.7;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = (13.0 / -mvPos.z) * (1.0 + sin(u_time * 2.5 + pos.x) * 0.2);
            gl_Position = projectionMatrix * mvPos;
        }
    `,
    fragmentShader: `
        varying float vAlpha;
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float glow = smoothstep(0.5, 0.0, dist);
            vec3 col = mix(vec3(0.1, 0.1, 0.14), vec3(0.95, 0.2, 0.15), gl_PointCoord.y);
            gl_FragColor = vec4(col, glow * vAlpha * 1.5);
        }
    `,
    transparent: true,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

const raycaster = new THREE.Raycaster();
const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse3D = new THREE.Vector3();

// ------------------------------------------------------------
// 8. Window Resize & Aspect Cover Calculations
// ------------------------------------------------------------
function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    bgRenderer.setSize(width, height);
    bgMaterial.uniforms.u_resolution.value.set(width, height);
    
    // Frustum calculations at z = 0
    const vFOV = camera.fov * Math.PI / 180;
    const visibleHeight = 2.0 * Math.tan(vFOV / 2.0) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const imgAspect = imageAspectRatio;
    const targetHeight = visibleHeight * 0.78;
    const targetWidth = targetHeight * imgAspect;

    if (visibleWidth * 0.95 < targetWidth) {
        const mobileWidth = visibleWidth * 0.92;
        portraitMesh.scale.set(mobileWidth, mobileWidth / imgAspect, 1.0);
    } else {
        portraitMesh.scale.set(targetWidth, targetHeight, 1.0);
    }

    // Align base of portrait nicely with viewport bottom
    portraitBaseY = -visibleHeight / 2.0 + portraitMesh.scale.y / 2.0;
    portraitMesh.position.y = portraitBaseY;

    portraitMaterial.uniforms.u_planeSize.value.set(portraitMesh.scale.x, portraitMesh.scale.y);
    portraitMaterial.uniforms.u_resolution.value.set(width, height);
}

window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------
// 9. Animation Loop
// ------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    const scrollY = window.scrollY;

    // Smooth cursor follow
    mouseX = targetX;
    mouseY = targetY;
    ringX += (targetX - ringX) * 0.12;
    ringY += (targetY - ringY) * 0.12;

    if (cursorDot && cursorRing) {
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
    }

    // Shader uniforms
    portraitMaterial.uniforms.u_time.value = time;
    portraitMaterial.uniforms.u_scroll.value = scrollY;
    portraitMesh.position.y = portraitBaseY;
    portraitMesh.position.x = 0;
    portraitMesh.rotation.set(0, 0, 0);

    // 3D Raycasting for particles and portrait spotlight
    raycaster.setFromCamera(new THREE.Vector2(
        (targetX / window.innerWidth) * 2.0 - 1.0,
        -(targetY / window.innerHeight) * 2.0 + 1.0
    ), camera);
    raycaster.ray.intersectPlane(mousePlane, mouse3D);
    particleMaterial.uniforms.u_mouse3D.value.copy(mouse3D);
    particleMaterial.uniforms.u_time.value = time;

    const intersects = raycaster.intersectObject(portraitMesh);
    let targetHoverStrength = 0.0;
    if (intersects.length > 0) {
        targetHoverStrength = 1.0;
        const uv = intersects[0].uv;
        portraitMaterial.uniforms.u_mouseMeshUv.value.x += (uv.x - portraitMaterial.uniforms.u_mouseMeshUv.value.x) * 0.12;
        portraitMaterial.uniforms.u_mouseMeshUv.value.y += (uv.y - portraitMaterial.uniforms.u_mouseMeshUv.value.y) * 0.12;
    }
    portraitMaterial.uniforms.u_hoverStrength.value += (targetHoverStrength - portraitMaterial.uniforms.u_hoverStrength.value) * 0.08;

    // Slow organic particle drift
    const pPositions = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const data = initialPartData[i];
        const wave = Math.sin(time * data.freq + data.phase) * data.amp;
        
        pPositions[i * 3] = data.x + wave * 0.6;
        pPositions[i * 3 + 1] = data.y + wave;
        data.z += data.speedZ;
        if (data.z > 1.5) data.z = -2.5;
        pPositions[i * 3 + 2] = data.z;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Render both layers
    bgMaterial.uniforms.u_time.value = time;
    bgMaterial.uniforms.u_mouse.value.set(mouseX, mouseY);
    bgMaterial.uniforms.u_scroll.value = scrollY;
    bgRenderer.render(bgScene, bgCamera);

    renderer.render(scene, camera);
}

animate();

// ------------------------------------------------------------
// 10. GSAP ScrollTrigger Animations
// ------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    // 1. Hero Typography Split
    const heroHeading = document.querySelector('.hero-name-heading');
    if (heroHeading) {
        new SplitType('.hero-name-heading span', { types: 'chars' });

        gsap.from('.hero-name-heading .char', {
            y: "100%",
            opacity: 0,
            duration: 1.2,
            stagger: 0.03,
            ease: "power4.out",
            delay: 0.3,
            clearProps: "transform,opacity"
        });

        // Parallax scroll break apart
        gsap.to('.hero-name-heading .outline', {
            x: -140,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
        gsap.to('.hero-name-heading .fill', {
            x: 140,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });

        // Fade typography on scroll out
        gsap.to('.hero-name-heading', {
            opacity: 0,
            scale: 0.92,
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top top',
                end: '65% top',
                scrub: true
            }
        });
    }

    // Hero UI fade-in
    gsap.from('.hero-info-card', {
        x: -40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.7
    });
    gsap.from('.hero-social-pills', {
        x: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.7
    });
    gsap.from('.nav-container', {
        y: -20,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        delay: 0.2
    });

    // 2. Manifesto Word-by-Word Scroll Reveal
    const manifesto = document.querySelector('.manifesto-text');
    if (manifesto) {
        const manifestoSplit = new SplitType(manifesto, { types: 'words' });
        gsap.from(manifestoSplit.words, {
            opacity: 0.12,
            stagger: 0.08,
            scrollTrigger: {
                trigger: ".manifesto-sec",
                start: "top 75%",
                end: "center center",
                scrub: 1
            }
        });
        manifestoSplit.words.forEach(word => {
            gsap.to(word, {
                color: '#111111',
                scrollTrigger: {
                    trigger: word,
                    start: "top 72%",
                    end: "top 48%",
                    scrub: true
                }
            });
        });
    }

    // 3. About Section Portrait scale trigger
    gsap.fromTo('.about-portrait', 
        { scale: 1.15 },
        { 
            scale: 1, 
            scrollTrigger: { 
                trigger: ".about-sec", 
                start: "top bottom", 
                end: "top top", 
                scrub: true 
            }
        }
    );

    // 4. Pinned Sticky Project Panels
    const projects = gsap.utils.toArray('.project-panel');
    projects.forEach((panel) => {
        ScrollTrigger.create({
            trigger: panel,
            start: "top top",
            pin: true,
            pinSpacing: false
        });
        
        const img = panel.querySelector('.project-mockup img');
        if (img) {
            gsap.fromTo(img, 
                { scale: 1.2, opacity: 0.6 },
                { 
                    scale: 1, 
                    opacity: 0.95,
                    scrollTrigger: { 
                        trigger: panel, 
                        start: "top bottom", 
                        end: "top top", 
                        scrub: true 
                    }
                }
            );
        }
    });

    // 5. Dynamic Metrics Counter
    const stats = document.querySelectorAll('.num-val');
    stats.forEach(stat => {
        const target = parseFloat(stat.getAttribute('data-target'));
        const decimals = stat.getAttribute('data-decimals') ? parseInt(stat.getAttribute('data-decimals')) : 0;
        
        gsap.to({ val: 0 }, {
            val: target,
            duration: 2.2,
            ease: "power2.out",
            scrollTrigger: {
                trigger: stat,
                start: "top 85%"
            },
            onUpdate: function() {
                if (decimals > 0) {
                    stat.innerHTML = this.targets()[0].val.toFixed(decimals);
                } else {
                    stat.innerHTML = Math.round(this.targets()[0].val);
                }
            }
        });
    });

    // 6. Generic Text Reveal on scroll
    const reveals = document.querySelectorAll('.reveal-text');
    reveals.forEach(el => {
        const split = new SplitType(el, { types: 'words, chars' });
        gsap.from(split.chars, {
            opacity: 0,
            y: 35,
            rotateX: -30,
            stagger: 0.02,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: el,
                start: 'top 88%',
            }
        });
    });
});

// ------------------------------------------------------------
// 11. Interactive Resume Modal
// ------------------------------------------------------------
function openResumeModal() {
    const modal = document.getElementById('resume-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeResumeModal() {
    const modal = document.getElementById('resume-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeResumeModal();
    }
});
