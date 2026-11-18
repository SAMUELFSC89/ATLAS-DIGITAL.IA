import { useEffect, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Clock, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer } from 'three';

type Shape = 'nuvem' | 'onda' | 'espiral';

function positions(shape: Shape, count: number) {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    let x: number, y: number, z: number;
    if (shape === 'onda') {
      x = (Math.random() - 0.5) * 14; z = (Math.random() - 0.5) * 8;
      y = Math.sin(x * 0.7) * 0.9 + Math.cos(z * 0.9) * 0.5 + (Math.random() - 0.5) * 0.25;
    } else if (shape === 'espiral') {
      const angle = t * Math.PI * 14, radius = 0.4 + t * 4.6;
      x = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.5;
      y = (Math.random() - 0.5) * 1.2;
      z = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.5;
    } else {
      const r = 4.2 * Math.cbrt(Math.random()), theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(phi) * Math.cos(theta); y = r * Math.sin(phi) * Math.sin(theta) * 0.75; z = r * Math.cos(phi);
    }
    data.set([x, y, z], i * 3);
  }
  return data;
}

/** WebGL particle field that drifts, follows the pointer and opens up as the visitor scrolls past the hero. */
export default function ParticleField({ color, shape = 'nuvem', motion = true }: { color: string; shape?: Shape; motion?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current as HTMLDivElement | null;
    if (!element) return;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); }
    catch { return; } // No WebGL: the scene keeps its plain background.
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    element.appendChild(renderer.domElement);
    const scene = new Scene();
    const camera = new PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions(shape, mobile ? 1400 : 3200), 3));
    const material = new PointsMaterial({ color, size: mobile ? 0.05 : 0.04, transparent: true, opacity: 0.85, depthWrite: false, blending: AdditiveBlending });
    const points = new Points(geometry, material);
    scene.add(points);

    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);

    const pointer = { x: 0, y: 0 };
    const onPointer = (event: PointerEvent) => { pointer.x = event.clientX / window.innerWidth - 0.5; pointer.y = event.clientY / window.innerHeight - 0.5; };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true, frame = 0;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !frame) frame = requestAnimationFrame(tick); });
    io.observe(element);
    const clock = new Clock();
    function tick() {
      frame = 0;
      if (!visible) return;
      const t = clock.getElapsedTime();
      const progress = Math.min(1, Math.max(0, -element!.getBoundingClientRect().top / Math.max(1, element!.offsetHeight)));
      if (motion) {
        points.rotation.y = t * 0.05 + pointer.x * 0.5;
        points.rotation.x = pointer.y * 0.3;
        points.scale.setScalar(1 + progress * 0.9);
        material.opacity = 0.85 * (1 - progress * 0.7);
      }
      renderer.render(scene, camera);
      if (motion) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect(); observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      geometry.dispose(); material.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, [color, shape, motion]);
  return <div ref={host} aria-hidden="true" className="ss-particles" />;
}
