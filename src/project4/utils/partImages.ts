/**
 * High-fidelity SVG placeholder images for EV spare parts.
 * Provides immediate visual recognition for warehouse staff and counter boys.
 */

function createSvgDataUrl(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const PART_PLACEHOLDER_IMAGES: Record<string, string> = {
  // Brake-pad set (Brake pads with friction lining and mounting pin holes)
  'EV-BRK-04': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <defs>
        <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#92400e" />
        </linearGradient>
        <linearGradient id="friction" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1f2937" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <g transform="translate(18, 24)">
        <!-- Backing plate left pad -->
        <path d="M 10 35 C 10 15, 45 10, 60 10 C 75 10, 110 15, 110 35 L 105 75 C 95 90, 25 90, 15 75 Z" fill="url(#metal)" stroke="#f59e0b" stroke-width="2" />
        <!-- Caliper pin hole -->
        <circle cx="60" cy="22" r="6" fill="#0f172a" stroke="#d97706" stroke-width="2" />
        <circle cx="28" cy="26" r="4" fill="#0f172a" stroke="#d97706" stroke-width="1.5" />
        <circle cx="92" cy="26" r="4" fill="#0f172a" stroke="#d97706" stroke-width="1.5" />
        <!-- Ceramic friction lining -->
        <path d="M 22 42 C 22 32, 50 28, 60 28 C 70 28, 98 32, 98 42 L 94 70 C 85 80, 35 80, 26 70 Z" fill="url(#friction)" stroke="#374151" stroke-width="2" />
        <!-- Friction grooves / wear indicators -->
        <line x1="50" y1="36" x2="48" y2="72" stroke="#4b5563" stroke-width="2" stroke-linecap="round" />
        <line x1="70" y1="36" x2="72" y2="72" stroke="#4b5563" stroke-width="2" stroke-linecap="round" />
        <!-- Sparkle & badge -->
        <circle cx="100" cy="80" r="14" fill="#10b981" />
        <path d="M 94 80 L 98 84 L 106 75" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="80" y="146" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-weight="900" font-size="11" letter-spacing="0.5">DISC BRAKE PAD SET</text>
    </svg>
  `),

  // Portable charger 3.3 kW (EVSE portable charging box with cable and gun)
  'EV-CHG-01': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <defs>
        <linearGradient id="chargerBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="16" fill="#020617" />
      <!-- Coiled Cable -->
      <path d="M 30 110 C 15 80, 15 30, 45 30 C 75 30, 65 90, 95 90 C 125 90, 135 60, 135 45" fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round" />
      <!-- Charger Main Brick -->
      <rect x="42" y="38" width="76" height="52" rx="8" fill="url(#chargerBody)" stroke="#10b981" stroke-width="2" />
      <!-- Status Display Screen -->
      <rect x="52" y="46" width="56" height="20" rx="4" fill="#042f2e" stroke="#14b8a6" stroke-width="1" />
      <!-- Power text / lightning -->
      <path d="M 62 56 L 68 49 L 66 54 L 72 54 L 64 63 L 66 57 Z" fill="#2dd4bf" />
      <text x="76" y="60" fill="#2dd4bf" font-family="monospace" font-weight="bold" font-size="9">3.3 kW</text>
      <!-- LED indicators -->
      <circle cx="56" cy="78" r="3" fill="#10b981" />
      <circle cx="66" cy="78" r="3" fill="#10b981" />
      <circle cx="76" cy="78" r="3" fill="#f59e0b" />
      <circle cx="86" cy="78" r="3" fill="#3b82f6" />
      <circle cx="96" cy="78" r="3" fill="#ef4444" />
      <!-- Charge Gun / Handle -->
      <g transform="translate(110, 85)">
        <path d="M 5 0 L 25 10 L 22 26 L 10 24 L 0 10 Z" fill="#1e293b" stroke="#64748b" stroke-width="1.5" />
        <rect x="22" y="12" width="12" height="10" rx="2" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
      </g>
      <text x="80" y="146" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-weight="900" font-size="11" letter-spacing="0.5">PORTABLE 3.3 kW CHARGER</text>
    </svg>
  `),

  // Slow charger leftover
  'EV-CHG-OLD': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <rect x="45" y="30" width="70" height="85" rx="8" fill="#1e293b" stroke="#64748b" stroke-width="2" />
      <circle cx="80" cy="55" r="16" fill="#334155" stroke="#94a3b8" stroke-width="1.5" />
      <path d="M 78 46 L 84 53 L 80 54 L 83 62 L 75 56 L 79 55 Z" fill="#94a3b8" />
      <rect x="58" y="80" width="44" height="6" rx="2" fill="#0f172a" />
      <circle cx="68" cy="98" r="4" fill="#f59e0b" />
      <circle cx="92" cy="98" r="4" fill="#64748b" />
      <path d="M 80 115 L 80 130" stroke="#475569" stroke-width="5" stroke-linecap="round" />
      <text x="80" y="146" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-weight="900" font-size="11">SLOW CHARGER 1.5 kW</text>
    </svg>
  `),

  // Display unit (LCD Speedometer cluster)
  'EV-DSP-02': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#020617" />
      <!-- Meter frame -->
      <path d="M 25 40 C 25 30, 135 30, 135 40 L 125 105 C 120 115, 40 115, 35 105 Z" fill="#090d16" stroke="#38bdf8" stroke-width="2" />
      <!-- Gauge display arc -->
      <path d="M 45 80 A 38 38 0 0 1 115 80" fill="none" stroke="#0284c7" stroke-width="4" stroke-dasharray="4 2" />
      <text x="80" y="78" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-weight="900" font-size="22">48</text>
      <text x="80" y="90" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-weight="bold" font-size="8">KM/H • READY</text>
      <!-- Battery status bar -->
      <rect x="55" y="96" width="50" height="6" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
      <rect x="57" y="98" width="38" height="2" fill="#38bdf8" />
      <text x="80" y="146" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-weight="900" font-size="11">LCD DIGITAL SPEEDO DASH</text>
    </svg>
  `),

  // Tube 3.00-10 (Rubber tire tube with brass air valve)
  'EV-TYR-TUB': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <circle cx="80" cy="75" r="48" fill="none" stroke="#1e293b" stroke-width="24" />
      <circle cx="80" cy="75" r="48" fill="none" stroke="#090d16" stroke-width="18" />
      <circle cx="80" cy="75" r="40" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="3 3" />
      <!-- Brass Valve Stem -->
      <rect x="77" y="20" width="6" height="14" rx="1.5" fill="#f59e0b" stroke="#d97706" stroke-width="1" />
      <circle cx="80" cy="20" r="4" fill="#b45309" />
      <text x="80" y="146" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-weight="900" font-size="11">TUBE 3.00-10 BUTYL</text>
    </svg>
  `),

  // Handle lock
  'EV-LCK-09': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <!-- Lock Cylinder -->
      <rect x="62" y="32" width="36" height="65" rx="6" fill="#64748b" stroke="#cbd5e1" stroke-width="2" />
      <rect x="70" y="24" width="20" height="10" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1.5" />
      <!-- Key slot -->
      <rect x="77" y="44" width="6" height="18" rx="2" fill="#0f172a" />
      <!-- Brass Keys -->
      <g transform="translate(68, 70)">
        <circle cx="12" cy="30" r="12" fill="none" stroke="#f59e0b" stroke-width="3" />
        <rect x="10" y="8" width="4" height="20" fill="#f59e0b" />
        <rect x="14" y="10" width="6" height="3" fill="#f59e0b" />
        <rect x="14" y="16" width="4" height="3" fill="#f59e0b" />
      </g>
      <text x="80" y="146" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-weight="900" font-size="11">HANDLE STEERING LOCK</text>
    </svg>
  `),

  // Side mirror pair
  'EV-MIR-01': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <!-- Left mirror -->
      <g transform="translate(20, 30)">
        <path d="M 10 30 Q 30 10 50 25 L 35 60 Q 15 55 10 30 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <path d="M 14 32 Q 28 17 44 28 L 32 55 Q 18 50 14 32 Z" fill="#0284c7" opacity="0.6" />
        <path d="M 35 60 L 50 85" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
      </g>
      <!-- Right mirror -->
      <g transform="translate(75, 30)">
        <path d="M 50 30 Q 30 10 10 25 L 25 60 Q 45 55 50 30 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <path d="M 46 32 Q 32 17 16 28 L 28 55 Q 42 50 46 32 Z" fill="#0284c7" opacity="0.6" />
        <path d="M 25 60 L 10 85" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
      </g>
      <text x="80" y="146" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-weight="900" font-size="11">SIDE MIRROR PAIR (L+R)</text>
    </svg>
  `),

  // LED headlamp
  'EV-LGT-HL': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#090d16" />
      <circle cx="80" cy="72" r="44" fill="#0f172a" stroke="#a855f7" stroke-width="3" />
      <circle cx="80" cy="72" r="36" fill="none" stroke="#c084fc" stroke-width="2" stroke-dasharray="6 3" />
      <!-- Projector Lens with White/Purple glow -->
      <circle cx="80" cy="72" r="22" fill="#f8fafc" stroke="#e9d5ff" stroke-width="3" />
      <circle cx="80" cy="72" r="14" fill="#38bdf8" opacity="0.7" />
      <!-- DRL Angel Eye Ring -->
      <text x="80" y="146" text-anchor="middle" fill="#c084fc" font-family="sans-serif" font-weight="900" font-size="11">LED PROJECTOR HEADLAMP</text>
    </svg>
  `),

  // Charging cable 16A
  'EV-CAB-01': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <path d="M 30 50 C 40 100, 120 100, 130 50" fill="none" stroke="#22c55e" stroke-width="8" stroke-linecap="round" />
      <rect x="20" y="35" width="22" height="24" rx="4" fill="#1e293b" stroke="#4ade80" stroke-width="2" />
      <rect x="118" y="35" width="22" height="24" rx="4" fill="#1e293b" stroke="#4ade80" stroke-width="2" />
      <circle cx="31" cy="47" r="3" fill="#f59e0b" />
      <circle cx="129" cy="47" r="3" fill="#f59e0b" />
      <text x="80" y="146" text-anchor="middle" fill="#4ade80" font-family="sans-serif" font-weight="900" font-size="11">HEAVY DUTY 16A CABLE</text>
    </svg>
  `),

  // Fuse kit
  'EV-ELC-FUS': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <!-- 4 mini blade fuses -->
      <g transform="translate(25, 45)">
        <rect x="0" y="0" width="22" height="26" rx="3" fill="#ef4444" stroke="#f87171" stroke-width="1.5" />
        <rect x="4" y="24" width="4" height="12" fill="#cbd5e1" />
        <rect x="14" y="24" width="4" height="12" fill="#cbd5e1" />
        <text x="11" y="16" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">10A</text>
      </g>
      <g transform="translate(55, 45)">
        <rect x="0" y="0" width="22" height="26" rx="3" fill="#3b82f6" stroke="#60a5fa" stroke-width="1.5" />
        <rect x="4" y="24" width="4" height="12" fill="#cbd5e1" />
        <rect x="14" y="24" width="4" height="12" fill="#cbd5e1" />
        <text x="11" y="16" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">15A</text>
      </g>
      <g transform="translate(85, 45)">
        <rect x="0" y="0" width="22" height="26" rx="3" fill="#eab308" stroke="#fde047" stroke-width="1.5" />
        <rect x="4" y="24" width="4" height="12" fill="#cbd5e1" />
        <rect x="14" y="24" width="4" height="12" fill="#cbd5e1" />
        <text x="11" y="16" text-anchor="middle" fill="#000" font-size="9" font-weight="bold">20A</text>
      </g>
      <g transform="translate(115, 45)">
        <rect x="0" y="0" width="22" height="26" rx="3" fill="#10b981" stroke="#34d399" stroke-width="1.5" />
        <rect x="4" y="24" width="4" height="12" fill="#cbd5e1" />
        <rect x="14" y="24" width="4" height="12" fill="#cbd5e1" />
        <text x="11" y="16" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold">30A</text>
      </g>
      <text x="80" y="146" text-anchor="middle" fill="#fde047" font-family="sans-serif" font-weight="900" font-size="11">AUTO BLADE FUSE SET</text>
    </svg>
  `),

  // Horn
  'EV-HRN-01': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <circle cx="80" cy="72" r="42" fill="#1e293b" stroke="#64748b" stroke-width="3" />
      <circle cx="80" cy="72" r="32" fill="#334155" stroke="#94a3b8" stroke-width="1.5" />
      <circle cx="80" cy="72" r="16" fill="#0f172a" stroke="#cbd5e1" stroke-width="2" />
      <!-- Sound slots -->
      <line x1="60" y1="58" x2="100" y2="58" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
      <line x1="56" y1="72" x2="104" y2="72" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
      <line x1="60" y1="86" x2="100" y2="86" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
      <text x="80" y="146" text-anchor="middle" fill="#cbd5e1" font-family="sans-serif" font-weight="900" font-size="11">12V DISC ELECTRIC HORN</text>
    </svg>
  `),

  // Controller old
  'EV-CTL-V1': createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#020617" />
      <!-- Aluminum Ribbed Enclosure -->
      <rect x="35" y="35" width="90" height="60" rx="4" fill="#334155" stroke="#94a3b8" stroke-width="2" />
      <!-- Cooling Fins / Ribs -->
      <line x1="45" y1="35" x2="45" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="55" y1="35" x2="55" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="65" y1="35" x2="65" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="75" y1="35" x2="75" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="85" y1="35" x2="85" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="95" y1="35" x2="95" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="105" y1="35" x2="105" y2="95" stroke="#1e293b" stroke-width="2" />
      <line x1="115" y1="35" x2="115" y2="95" stroke="#1e293b" stroke-width="2" />
      <!-- Wire Harness Harness sprouting -->
      <path d="M 45 95 L 40 120" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
      <path d="M 55 95 L 55 125" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
      <path d="M 65 95 L 70 122" stroke="#eab308" stroke-width="3" stroke-linecap="round" />
      <path d="M 95 95 L 90 122" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
      <path d="M 105 95 L 110 125" stroke="#000000" stroke-width="4" stroke-linecap="round" />
      <text x="80" y="146" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-weight="900" font-size="11">MOTOR CONTROLLER 48V</text>
    </svg>
  `),
};

export function getPartImageUrl(code: string, customUrl?: string): string {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl;
  }
  return PART_PLACEHOLDER_IMAGES[code] || createSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="16" fill="#0f172a" />
      <rect x="40" y="40" width="80" height="65" rx="8" fill="#1e293b" stroke="#475569" stroke-width="2" />
      <path d="M 70 55 L 90 55 L 80 75 L 90 75 L 70 95 L 75 78 L 68 78 Z" fill="#10b981" />
      <text x="80" y="146" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-weight="bold" font-size="11">GENUINE EV SPARE</text>
    </svg>
  `);
}
