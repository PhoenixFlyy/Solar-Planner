"use client";

// HTML compass overlay. `headingDeg` is the camera's look direction
// (0 = looking north/+Z). Rotating the dial by -heading keeps world N/S/E/W
// fixed to the world as the camera orbits — so it's always clear where south
// (the sun side) is.
export interface CompassProps {
  headingDeg: number;
}

const MARKS = [
  { label: "N", angle: 0, color: "#dc2626" },
  { label: "O", angle: 90, color: "#525252" },
  { label: "S", angle: 180, color: "#525252" },
  { label: "W", angle: 270, color: "#525252" },
];

export function Compass({ headingDeg }: CompassProps) {
  return (
    <div className="absolute bottom-3 left-3 rounded-full bg-white/80 p-1 shadow backdrop-blur">
      <svg width="56" height="56" viewBox="-32 -32 64 64" role="img" aria-label="Kompass">
        <circle r="28" fill="none" stroke="#e5e5e5" strokeWidth="1.5" />
        <g transform={`rotate(${-headingDeg})`}>
          {MARKS.map((m) => (
            <g key={m.label} transform={`rotate(${m.angle})`}>
              <line x1="0" y1="-28" x2="0" y2="-22" stroke={m.color} strokeWidth="2" />
              <text
                x="0"
                y="-13"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight={m.label === "N" ? 700 : 500}
                fill={m.color}
                transform={`rotate(${-m.angle})`}
              >
                {m.label}
              </text>
            </g>
          ))}
          {/* North needle */}
          <polygon points="0,-20 -3,0 3,0" fill="#dc2626" />
          <polygon points="0,20 -3,0 3,0" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
}
