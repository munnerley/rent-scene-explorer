import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildInterior, buildSampleSite, type SampleBuilding, type SampleUnit } from "@/lib/twin/build";
import { layoutOf } from "@/lib/twin/templates";
import { isApartment, isDevice } from "@/lib/twin/ingest";
import { osmGround } from "@/lib/twin/osm";

export interface ViewerProps {
  lat: number; lon: number; rotation: number; scale: number;
  glbUrl?: string | null;
  buildings: SampleBuilding[]; units: SampleUnit[];
  focusUnit: string | null; focusDevice: string | null;
  view: "2d" | "3d"; ground: "map" | "plane";
  onPick: (unit: string | null, device: string | null) => void;
}

function findTagged(o: THREE.Object3D | null) {
  let device: string | null = null, unit: string | null = null;
  while (o) {
    if (!device && isDevice(o)) device = o.name;
    if (isApartment(o)) { unit = o.name; break; }
    o = o.parent;
  }
  return { unit, device };
}

function Ground({ lat, lon, mode }: { lat: number; lon: number; mode: "map" | "plane" }) {
  const [, force] = useState(0);
  const g = useMemo(() => (mode === "map" ? osmGround(lat, lon, () => force((n) => n + 1)) : null), [lat, lon, mode]);
  useEffect(() => () => g?.tex.dispose(), [g]);
  if (!g) {
    return (
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[220, 64]} />
        <meshStandardMaterial color="#dfe6dc" roughness={1} />
      </mesh>
    );
  }
  return (
    <mesh rotation-x={-Math.PI / 2} position={[g.offset[0], -0.02, g.offset[1]]} receiveShadow>
      <planeGeometry args={[g.size, g.size]} />
      <meshStandardMaterial map={g.tex} roughness={1} />
    </mesh>
  );
}

function GlbRoot({ url, children }: { url: string; children: (root: THREE.Object3D) => React.ReactNode }) {
  const gltf = useGLTF(url);
  useMemo(() => gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }), [gltf]);
  return <>{children(gltf.scene)}</>;
}

function Model({ root, props }: { root: THREE.Object3D; props: ViewerProps }) {
  const controls = useRef<CameraControls>(null);
  const [helper, setHelper] = useState<THREE.Box3Helper | null>(null);
  const isSample = !props.glbUrl;

  // visibility / interior management
  useEffect(() => {
    root.updateMatrixWorld(true);
    const apts: THREE.Object3D[] = [];
    root.traverse((o) => { if (isApartment(o)) apts.push(o); });
    const boxOf = (o: THREE.Object3D) => new THREE.Box3().setFromObject(o);
    const focused = apts.find((a) => a.name === props.focusUnit) ?? null;
    root.traverse((o) => { if (o.userData.roof || /roof/i.test(o.name)) o.visible = !focused; });
    for (const a of apts) {
      a.visible = true;
      a.children.forEach((c) => { if (c.userData.shell || /^SHELL/i.test(c.name) || /^Window/.test(c.name)) c.visible = true; });
      const int = a.getObjectByName("INTERIOR");
      if (int && isSample) int.visible = false;
    }
    if (focused) {
      if (isSample && !focused.getObjectByName("INTERIOR")) focused.add(buildInterior(layoutOf(focused.userData.layout)));
      const int = focused.getObjectByName("INTERIOR"); if (int) int.visible = true;
      focused.children.forEach((c) => { if (c.userData.shell || /^SHELL/i.test(c.name) || /^Window/.test(c.name)) c.visible = false; });
      const fb = boxOf(focused);
      for (const a of apts) if (a !== focused && boxOf(a).min.y > fb.min.y + 0.5) a.visible = false;
    }
    root.updateMatrixWorld(true);
    const sel = (props.focusDevice && focused?.getObjectByName(props.focusDevice)) || focused;
    setHelper(sel ? new THREE.Box3Helper(boxOf(sel).expandByScalar(0.08), new THREE.Color(props.focusDevice ? "#ff8a3d" : "#32bdcd")) : null);
  }, [root, props.focusUnit, props.focusDevice, isSample]);

  // camera
  useEffect(() => {
    const c = controls.current; if (!c) return;
    root.updateMatrixWorld(true);
    const focused = props.focusUnit ? root.getObjectByName(props.focusUnit) : null;
    const box = new THREE.Box3().setFromObject(focused ?? root);
    const center = box.getCenter(new THREE.Vector3());
    const r = Math.max(8, box.getSize(new THREE.Vector3()).length() * (focused ? 0.9 : 0.6));
    if (props.view === "2d") c.setLookAt(center.x, center.y + r * 1.6, center.z + 0.001, center.x, center.y, center.z, true);
    else c.setLookAt(center.x + r * 0.7, center.y + r * 0.75, center.z + r * 0.9, center.x, center.y, center.z, true);
  }, [root, props.focusUnit, props.view]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const { unit, device } = findTagged(e.object);
    if (unit) props.onPick(unit, device);
  };

  return (
    <>
      <CameraControls ref={controls} makeDefault maxPolarAngle={props.view === "2d" ? 0.01 : Math.PI / 2.1} minDistance={2} maxDistance={600} />
      <group rotation-y={THREE.MathUtils.degToRad(props.rotation)} scale={props.scale}>
        <primitive object={root} onClick={onClick} />
      </group>
      {helper && <primitive object={helper} />}
    </>
  );
}

function SampleRoot({ props }: { props: ViewerProps }) {
  const root = useMemo(() => buildSampleSite(props.buildings, props.units), [props.buildings, props.units]);
  return <Model root={root} props={props} />;
}

export default function SiteViewer(props: ViewerProps) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [60, 60, 80], fov: 45, near: 0.1, far: 3000 }} onPointerMissed={() => props.onPick(null, null)}>
      <color attach="background" args={["#e9eef0"]} />
      <fog attach="fog" args={["#e9eef0", 260, 700]} />
      <hemisphereLight args={["#ffffff", "#c9c2b4", 0.7]} />
      <directionalLight position={[60, 90, 40]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#bde" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      <Ground lat={props.lat} lon={props.lon} mode={props.ground} />
      <Suspense fallback={null}>
        {props.glbUrl ? <GlbRoot url={props.glbUrl}>{(root) => <Model root={root} props={props} />}</GlbRoot> : <SampleRoot props={props} />}
      </Suspense>
    </Canvas>
  );
}
