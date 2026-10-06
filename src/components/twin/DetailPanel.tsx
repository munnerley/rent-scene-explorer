import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { devicesQuery, type Device, type Unit } from "@/lib/twin/data";
import { layoutOf } from "@/lib/twin/templates";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function DeviceEditor({ device }: { device: Device }) {
  const qc = useQueryClient();
  const [d, setD] = useState(device);
  useEffect(() => setD(device), [device]);
  const fields: [keyof Device, string, boolean?][] = [["name", "Name"], ["type", "Type"], ["model", "Model"], ["install_year", "Installed", true], ["energy_kwh", "Energy kWh/yr", true], ["notes", "Notes"]];
  const save = async (): Promise<void> => {
    const { error } = await supabase.from("devices").update({
      name: d.name, type: d.type, model: d.model, notes: d.notes, status: d.status,
      install_year: d.install_year === null || (d.install_year as unknown) === "" ? null : Number(d.install_year),
      energy_kwh: d.energy_kwh === null || (d.energy_kwh as unknown) === "" ? null : Number(d.energy_kwh),
    }).eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Device saved");
    qc.invalidateQueries({ queryKey: ["devices", d.unit_id] });
  };
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-warn/50 bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{d.object_name}</span>
        <select value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })} className="rounded border bg-background px-1 text-xs">
          {["online", "offline", "needs service"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {fields.map(([k, label, num]) => (
        <label key={k} className="grid grid-cols-[6.5rem_1fr] items-center gap-2 text-xs text-muted-foreground">
          {label}
          <Input className="h-8 text-sm text-foreground" inputMode={num ? "numeric" : undefined} value={(d[k] as string | number | null) ?? ""}
            onChange={(e) => setD({ ...d, [k]: e.target.value })} />
        </label>
      ))}
      <Button size="sm" className="w-full" onClick={save}>Save device</Button>
    </div>
  );
}

export function DetailPanel({ unit, device, onSelectDevice, onClose }: {
  unit: Unit; device: string | null; onSelectDevice: (obj: string | null) => void; onClose: () => void;
}) {
  const { data: devices = [] } = useQuery(devicesQuery(unit.id));
  const current = devices.find((d) => d.object_name === device);
  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">Apartment</p>
          <h2 className="text-2xl font-semibold">{unit.apt_number}</h2>
          <p className="text-sm text-muted-foreground">Floor {unit.floor}{unit.layout ? ` · ${layoutOf(unit.layout).name}` : ""}</p>
        </div>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[["Beds", unit.beds], ["Baths", unit.baths], ["Sq ft", unit.area_sqft]].map(([k, v]) => (
          <div key={k as string} className="rounded-lg bg-muted py-2"><dt className="text-[0.65rem] uppercase text-muted-foreground">{k}</dt><dd className="font-display text-lg">{v ?? "—"}</dd></div>
        ))}
      </dl>
      <h3 className="mt-6 text-sm font-semibold">Devices <span className="font-normal text-muted-foreground">({devices.length})</span></h3>
      {devices.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No DEV_ objects inside this apartment.</p>}
      <ul className="mt-2 space-y-1">
        {devices.map((d) => (
          <li key={d.id}>
            <button onClick={() => onSelectDevice(d.object_name === device ? null : d.object_name)}
              className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent", d.object_name === device && "bg-accent")}>
              <span>{d.name}<span className="ml-2 text-xs text-muted-foreground">{d.type}</span></span>
              <span className={cn("h-2 w-2 rounded-full", d.status === "online" ? "bg-success" : "bg-warn")} />
            </button>
          </li>
        ))}
      </ul>
      {current && <DeviceEditor device={current} />}
      <p className="mt-auto pt-6 text-xs text-muted-foreground">Click devices in the 3D view or in this list. Edit apartment details in the table below.</p>
    </div>
  );
}
