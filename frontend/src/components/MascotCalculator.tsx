export default function MascotCalculator() {
  return <svg className="mascot-svg" viewBox="0 0 300 305" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="mascot-case" x1="83" y1="28" x2="222" y2="259" gradientUnits="userSpaceOnUse">
        <stop stopColor="#88E8D2" />
        <stop offset=".52" stopColor="#64D7C1" />
        <stop offset="1" stopColor="#39B5A8" />
      </linearGradient>
      <linearGradient id="mascot-screen" x1="96" y1="66" x2="204" y2="155" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DDF6DB" />
        <stop offset="1" stopColor="#BAEACB" />
      </linearGradient>
    </defs>
    <ellipse cx="150" cy="290" rx="88" ry="9" fill="#042630" opacity=".3" />

    <g className="mascot-legs" stroke="#1D5860" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M103 255v25c-10 2-15 6-15 11h39c1-5-4-9-13-11v-25" fill="#279F98" />
      <path d="M197 255v25c10 2 15 6 15 11h-39c-1-5 4-9 13-11v-25" fill="#279F98" />
      <path d="M88 290h39m46 0h39" stroke="#123E48" strokeWidth="3" strokeLinecap="round" />
    </g>

    <g className="mascot-arm-left" stroke="#1D5860" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M69 173c-21 3-28 23-42 25" stroke="#66D3BF" strokeWidth="12" />
      <path d="M69 173c-21 3-28 23-42 25" />
      <path d="M30 190c-6-6-12-4-14 2-2 8 4 15 12 16 8 0 12-5 12-11" fill="#7BE0C8" />
    </g>
    <g className="mascot-arm-rest" stroke="#1D5860" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M231 173c21 3 28 23 42 25" stroke="#66D3BF" strokeWidth="12" />
      <path d="M231 173c21 3 28 23 42 25" />
      <path d="M270 190c6-6 12-4 14 2 2 8-4 15-12 16-8 0-12-5-12-11" fill="#7BE0C8" />
    </g>
    <g className="mascot-arm-point" stroke="#1D5860" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M230 173c22-3 31-18 46-27" stroke="#66D3BF" strokeWidth="12" />
      <path d="M230 173c22-3 31-18 46-27" />
      <path d="m271 142 18-10c5-3 9 2 5 7l-13 15c-5 5-12 5-16 0" fill="#7BE0C8" />
    </g>
    <g className="mascot-arm-point-down" stroke="#1D5860" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M230 177c19 11 26 27 40 45" stroke="#66D3BF" strokeWidth="12" />
      <path d="M230 177c19 11 26 27 40 45" />
      <path d="m265 216 14 18c3 4 9 1 8-4l-5-18c-2-5-9-7-14-3" fill="#7BE0C8" />
    </g>

    <g className="mascot-body">
      <rect x="65" y="21" width="170" height="245" rx="29" fill="url(#mascot-case)" stroke="#1D5860" strokeWidth="3" />
      <path d="M81 52v179c0 11 4 18 10 21" stroke="#C8F9E7" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      <path d="M220 50v174" stroke="#238D8E" strokeWidth="3" strokeLinecap="round" opacity=".46" />
      <path d="M94 33h44" stroke="#D7F9E8" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <rect x="81" y="51" width="138" height="116" rx="18" fill="#1F6068" stroke="#194F59" strokeWidth="2" />
      <rect x="89" y="59" width="122" height="100" rx="12" fill="url(#mascot-screen)" />
      <path d="M98 70v18" stroke="#F1FFF0" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      <path d="M100 70h15" stroke="#F1FFF0" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      <g className="mascot-face">
        <g className="mascot-eyes">
          <rect className="mascot-eye" x="122" y="96" width="7" height="14" rx="3.5" fill="#184750" />
          <rect className="mascot-eye" x="171" y="96" width="7" height="14" rx="3.5" fill="#184750" />
        </g>
        <path className="mascot-mouth-idle" d="M138 123c6 10 18 10 24 0" stroke="#184750" strokeWidth="3.5" strokeLinecap="round" />
        <path className="mascot-mouth-focus" d="M142 129h16" stroke="#184750" strokeWidth="3.5" strokeLinecap="round" />
        <g className="mascot-mouth-open">
          <path d="M138 120c5-6 19-6 24 0 5 10 0 21-12 21s-17-11-12-21Z" fill="#184750" />
          <path d="M143 134c5-3 10-3 15 0-4 6-11 7-15 0Z" fill="#F38E88" />
        </g>
        <path className="mascot-mouth-proud" d="M136 121c5 15 23 16 28 0" stroke="#184750" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      <text x="150" y="185" fill="#154A53" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="800" letterSpacing=".65" textAnchor="middle">gerenCIA</text>
      <g className="mascot-controls">
        <path d="M99 200h12v-12h15v12h12v15h-12v12h-15v-12H99z" fill="#1B6470" stroke="#164E59" strokeWidth="2" strokeLinejoin="round" />
        <path d="M113 207h10m-5-5v10" stroke="#A8E9D5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="179" cy="204" r="13" fill="#F39A84" stroke="#AE625C" strokeWidth="2" />
        <circle cx="207" cy="222" r="11" fill="#F4C967" stroke="#AB8648" strokeWidth="2" />
        <rect x="158" y="230" width="23" height="9" rx="4.5" fill="#C5A9EA" stroke="#8C78AF" strokeWidth="1.5" />
        <rect x="188" y="241" width="18" height="5" rx="2.5" fill="#1E6E73" opacity=".55" />
        <circle cx="93" cy="239" r="2" fill="#1D626B" />
        <circle cx="101" cy="239" r="2" fill="#1D626B" />
        <circle cx="109" cy="239" r="2" fill="#1D626B" />
      </g>
    </g>
  </svg>;
}
