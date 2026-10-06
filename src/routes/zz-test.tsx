import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import SiteViewer from "@/components/twin/SiteViewer";
const B = [{ id: "a", name: "A", x: 0, z: 0, rotation: 0, floors: 3, cols: 2, rows: 2, layout: "two_bed", color: "sand" },{ id: "b", name: "B", x: 30, z: -10, rotation: 20, floors: 2, cols: 3, rows: 1, layout: "studio", color: "slate" }];
const U = B.flatMap((b) => Array.from({ length: b.floors * b.cols * b.rows }, (_, i) => ({ object_name: `APT_${b.id}${i}`, building_id: b.id, floor: 1 + Math.floor(i / (b.cols * b.rows)), col: i % b.cols, row: Math.floor(i / b.cols) % b.rows, layout: b.layout })));
export const Route = createFileRoute("/zz-test")({ ssr: false, component: () => { const [u, setU] = useState<string|null>(null); const [d, setD] = useState<string|null>(null); const q = new URLSearchParams(location.search); const f = q.get("u") ?? u;
 return <div style={{ height: "100vh" }}><SiteViewer lat={33.40133} lon={-111.96239} rotation={0} scale={1} buildings={B} units={U} focusUnit={f} focusDevice={q.get("d") ?? d} view={(q.get("v") as "2d") ?? "3d"} ground="map" onPick={(a, b) => { setU(a); setD(b); }} /></div>; } });
