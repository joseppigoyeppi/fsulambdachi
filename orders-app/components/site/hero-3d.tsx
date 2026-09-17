"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { asset } from "@/lib/base-path";

/*
  Real 3D layer for the hero. Sun Cruiser cans are cylinders wearing their product
  photo (UV-mapped so the front view matches the photo exactly), Λ Χ Α are extruded,
  beveled gold letters. Everything drifts, rocks, and parallaxes against the pointer.
  Rendered into a transparent canvas that sits between the sunrise backdrop and the text.
*/

const GOLD = "#e6b955";
const CAN_ASPECT = 302 / 852;

// ---- Letter outlines (unit square, y up). Bold geometric caps extrude cleanly. ----
function polygon(points: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return shape;
}

const LAMBDA = polygon([[0, 0], [0.22, 0], [0.5, 0.72], [0.78, 0], [1, 0], [0.58, 1], [0.42, 1]]);
const CHI = polygon([[0, 0], [0.2, 0], [0.5, 0.4], [0.8, 0], [1, 0], [0.62, 0.5], [1, 1], [0.8, 1], [0.5, 0.6], [0.2, 1], [0, 1], [0.38, 0.5]]);
const ALPHA = (() => {
  const shape = polygon([[0, 0], [0.22, 0], [0.32, 0.26], [0.68, 0.26], [0.78, 0], [1, 0], [0.58, 1], [0.42, 1]]);
  const hole = new THREE.Path();
  hole.moveTo(0.39, 0.4);
  hole.lineTo(0.61, 0.4);
  hole.lineTo(0.5, 0.66);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
})();

const LETTER_SHAPES = { Λ: LAMBDA, Χ: CHI, Α: ALPHA } as const;
type Glyph = keyof typeof LETTER_SHAPES;

function useLetterGeometry(glyph: Glyph) {
  return React.useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(LETTER_SHAPES[glyph], {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 4,
      curveSegments: 4,
    });
    geometry.center();
    return geometry;
  }, [glyph]);
}

// ---- Placement -------------------------------------------------------------------
// x/y are fractions of the visible half-width / half-height at z = 0, so the layout
// scales with the section. `phone` variants keep the middle column clear on narrow screens.
interface Placement {
  x: number;
  y: number;
  z: number;
  size: number;
  delay: number;
  phone?: { x: number; y: number; size: number } | null;
}

const CANS: (Placement & { src: string; tilt: number; phase: number })[] = [
  { src: "/products/cutouts/sc-peach-iced-tea.png", x: -0.72, y: 0.16, z: 0.4, size: 0.98, tilt: -0.24, phase: 0, delay: 0.3, phone: { x: -0.86, y: 0.48, size: 0.5 } },
  { src: "/products/cutouts/sc-classic-iced-tea.png", x: -0.44, y: -0.52, z: -1.4, size: 0.78, tilt: 0.18, phase: 1.7, delay: 0.5, phone: null },
  { src: "/products/cutouts/sc-raspberry-iced-tea.png", x: 0.6, y: 0.42, z: -0.8, size: 0.86, tilt: 0.2, phase: 3.1, delay: 0.4, phone: { x: 0.86, y: 0.45, size: 0.46 } },
  { src: "/products/cutouts/sc-pink-lemonade.png", x: 0.64, y: -0.48, z: 0.4, size: 0.98, tilt: -0.16, phase: 4.4, delay: 0.6, phone: null },
];

// Letters mostly face the viewer and swing ±40° so they always read as Λ Χ Α.
const LETTERS: (Placement & { glyph: Glyph; swing: number; phase: number })[] = [
  { glyph: "Λ", x: -0.96, y: -0.5, z: -2.2, size: 1.45, swing: 0.5, phase: 0.4, delay: 0.7, phone: { x: -0.94, y: -0.3, size: 0.5 } },
  { glyph: "Χ", x: -0.42, y: 0.68, z: -2.8, size: 1.05, swing: 0.45, phase: 2.2, delay: 0.85, phone: null },
  { glyph: "Α", x: 0.22, y: -0.74, z: -1.6, size: 1, swing: 0.55, phase: 3.6, delay: 1, phone: { x: 0.94, y: -0.3, size: 0.5 } },
  { glyph: "Λ", x: 0.44, y: 0.76, z: -3.4, size: 0.9, swing: 0.4, phase: 5, delay: 1.1, phone: null },
  { glyph: "Χ", x: 0.96, y: 0.06, z: -2.6, size: 1.2, swing: 0.5, phase: 1.1, delay: 0.95, phone: null },
  { glyph: "Α", x: -0.62, y: 0.8, z: -3, size: 0.8, swing: 0.45, phase: 4.1, delay: 1.2, phone: null },
];

function easeOutBack(t: number) {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/** Resolves a placement to world units for the current viewport. */
function useLayout(item: Placement) {
  const { viewport } = useThree();
  const phone = viewport.width < 5;
  const p = phone && item.phone !== undefined ? item.phone : null;
  if (phone && item.phone === null) return null;
  const x = (p?.x ?? item.x) * (viewport.width / 2);
  const y = (p?.y ?? item.y) * (viewport.height / 2);
  const size = (p?.size ?? item.size) * (phone ? 1 : Math.min(1, viewport.width / 9));
  return { x, y, z: item.z, size };
}

// ---- Objects -----------------------------------------------------------------------
function Can({ item }: { item: (typeof CANS)[number] }) {
  const layout = useLayout(item);
  const group = React.useRef<THREE.Group>(null);
  const texture = useTexture(asset(item.src), (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = 8;
  });

  const height = 2.4;
  const radius = (height * CAN_ASPECT) / 2;
  const geometry = React.useMemo(() => {
    // Open cylinder whose UVs sample the photo by sin(θ): the front half reproduces the
    // product shot exactly, so small rotations read as the real can turning.
    const g = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const theta = Math.atan2(pos.getX(i), pos.getZ(i));
      // 0.48 keeps the photo's feathered outer columns off the silhouette.
      uv.setX(i, 0.5 + 0.48 * Math.sin(theta));
    }
    uv.needsUpdate = true;
    return g;
  }, [radius, height]);

  useFrame(({ clock }) => {
    if (!group.current || !layout) return;
    const t = clock.elapsedTime;
    const enter = easeOutBack(THREE.MathUtils.clamp((t - item.delay) / 0.9, 0, 1));
    group.current.scale.setScalar(layout.size * enter);
    group.current.position.set(layout.x, layout.y + Math.sin(t * 0.7 + item.phase) * 0.14, layout.z);
    group.current.rotation.set(
      Math.sin(t * 0.5 + item.phase) * 0.08,
      Math.sin(t * 0.55 + item.phase) * 0.32,
      item.tilt + Math.sin(t * 0.4 + item.phase) * 0.05,
    );
  });

  if (!layout) return null;
  return (
    <group ref={group} scale={0}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.5}
          roughness={0.42}
          metalness={0.08}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.42}
          envMapIntensity={0.9}
        />
      </mesh>
      {/* Lid, just under the tab region of the photo so tilted cans do not look hollow. */}
      <mesh position={[0, height / 2 - 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.96, 48]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.95} roughness={0.3} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.96, 48]} />
        <meshStandardMaterial color="#6b6b6b" metalness={0.9} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Letter({ item }: { item: (typeof LETTERS)[number] }) {
  const layout = useLayout(item);
  const mesh = React.useRef<THREE.Mesh>(null);
  const geometry = useLetterGeometry(item.glyph);

  useFrame(({ clock }) => {
    if (!mesh.current || !layout) return;
    const t = clock.elapsedTime;
    const enter = easeOutBack(THREE.MathUtils.clamp((t - item.delay) / 1, 0, 1));
    mesh.current.scale.setScalar(layout.size * enter);
    mesh.current.position.set(layout.x, layout.y + Math.sin(t * 0.6 + item.phase) * 0.18, layout.z);
    mesh.current.rotation.set(
      Math.sin(t * 0.45 + item.phase) * 0.28,
      Math.sin(t * 0.5 + item.phase) * item.swing,
      Math.sin(t * 0.3 + item.phase) * 0.14,
    );
  });

  if (!layout) return null;
  return (
    <mesh ref={mesh} geometry={geometry} scale={0}>
      <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.28} envMapIntensity={1.6} emissive={GOLD} emissiveIntensity={0.12} />
    </mesh>
  );
}

/** Whole scene leans a few degrees toward the pointer and slides with it. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = React.useRef<THREE.Group>(null);
  useFrame(({ pointer }, delta) => {
    if (!group.current) return;
    const g = group.current;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * 0.16, 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.1, 3, delta);
    g.position.x = THREE.MathUtils.damp(g.position.x, pointer.x * 0.35, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, pointer.y * 0.2, 3, delta);
  });
  return <group ref={group}>{children}</group>;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={2.2} color="#fff4dc" />
      <directionalLight position={[-6, -2, 4]} intensity={0.8} color="#ffd9a0" />
      <directionalLight position={[0, -4, 6]} intensity={0.6} color="#ffffff" />
      {/* Procedural studio: warm key, gold ring, cool rim — no HDR download needed. */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={5} color="#fff3d6" position={[4, 4, 5]} scale={[7, 5, 1]} />
        <Lightformer form="ring" intensity={3} color="#f2c76a" position={[-5, -1, 4]} scale={3.5} />
        <Lightformer form="rect" intensity={2} color="#9fb4ff" position={[0, 6, -6]} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, -6, 2]} scale={[12, 2, 1]} />
      </Environment>
      <ParallaxRig>
        <React.Suspense fallback={null}>
          {CANS.map((can) => (
            <Can key={can.src} item={can} />
          ))}
        </React.Suspense>
        {LETTERS.map((letter, i) => (
          <Letter key={i} item={letter} />
        ))}
      </ParallaxRig>
    </>
  );
}

export default function Hero3D({ eventSource }: { eventSource: React.RefObject<HTMLElement | null> }) {
  return (
    <Canvas
      className="pointer-events-none"
      style={{ position: "absolute", inset: 0, zIndex: 5 }}
      camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 50 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      eventSource={eventSource as React.RefObject<HTMLElement>}
      eventPrefix="client"
      resize={{ debounce: 100 }}
    >
      <Scene />
    </Canvas>
  );
}
