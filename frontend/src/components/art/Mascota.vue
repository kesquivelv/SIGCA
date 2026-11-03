<!-- Mascota original: una oreja sonriente que brota (escucha + crecimiento) -->
<template>
  <svg viewBox="-40 -10 400 350" role="img" aria-label="Ilustración de una oreja sonriente con ondas de sonido y un brote en la cabeza">
    <ellipse cx="160" cy="318" rx="110" ry="12" fill="#3a2b22" opacity=".12" />
    <circle cx="165" cy="170" r="150" fill="#dbe5cf" stroke="#3a2b22" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" />

    <g class="onda" fill="none" stroke="#4f6b4a" stroke-width="9" stroke-linecap="round">
      <path d="M30 130q-24 40 0 80" />
      <path d="M-4 105q-46 65 0 130" opacity=".7" />
    </g>
    <g class="onda" fill="none" stroke="#b8532f" stroke-width="7" stroke-linecap="round" style="animation-delay:.9s">
      <path d="M-30 88q-70 82 0 164" opacity=".5" />
    </g>

    <g class="mascota">
      <!-- oreja: borde (hélix), concha interior y lóbulo con arete -->
      <path d="M150 50C78 50 56 118 66 178c8 50 42 78 62 104 20 26 62 26 76-10 10-26-4-42 18-63 36-34 46-56 42-88-8-56-58-71-114-71z"
        fill="#e3a82b" stroke="#3a2b22" stroke-width="6" stroke-linejoin="round" />
      <path d="M160 94C118 94 104 140 112 176c6 28 26 46 48 62 22 14 46-6 54-30 10-30 24-48 18-76-6-28-36-38-72-38z"
        fill="#f8e3a8" stroke="#3a2b22" stroke-width="5" stroke-linejoin="round" />
      <path d="M96 84c14-18 34-26 56-26" fill="none" stroke="#fcf6e8" stroke-width="7" stroke-linecap="round" opacity=".8" />
      <circle cx="150" cy="282" r="9" fill="#b8532f" stroke="#3a2b22" stroke-width="4" />
      <!-- cara -->
      <ellipse cx="150" cy="152" rx="8" ry="12" fill="#3a2b22" />
      <ellipse cx="204" cy="150" rx="8" ry="12" fill="#3a2b22" />
      <circle cx="152" cy="147" r="3" fill="#fcf6e8" /><circle cx="206" cy="145" r="3" fill="#fcf6e8" />
      <circle cx="134" cy="184" r="12" fill="#f0c9b6" />
      <circle cx="222" cy="182" r="12" fill="#f0c9b6" />
      <path d="M156 186q24 26 50-2" fill="none" stroke="#3a2b22" stroke-width="6" stroke-linecap="round" />
    </g>
    <!-- brote que crece junto a la oreja -->
    <g stroke="#3a2b22" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M268 312q-2-22 6-34" fill="none" />
      <path d="M274 280q-24-6-30 14 22 6 30-14z" fill="#9bb08c" />
      <path d="M274 284q22-14 36 4-16 16-36-4z" fill="#4f6b4a" />
    </g>

    <!-- globos de diálogo -->
    <g>
      <path d="M236 6h96q18 0 18 18v36q0 18-18 18h-60l-22 22 2-22h-16q-18 0-18-18V24q0-18 18-18z" fill="#fcf6e8" stroke="#3a2b22" stroke-width="5" stroke-linejoin="round" />
      <text x="286" y="58" text-anchor="middle" font-family="Caveat, cursive" font-weight="600" font-size="38" fill="#b8532f">¡Hola!</text>
    </g>
    <g transform="translate(284 148) rotate(8)">
      <circle cx="0" cy="0" r="26" fill="#f0c9b6" stroke="#3a2b22" stroke-width="4.5" />
      <path d="M-6 10V-12l14-4v22" fill="none" stroke="#3a2b22" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="-9" cy="11" r="5" fill="#3a2b22" /><circle cx="5" cy="7" r="5" fill="#3a2b22" />
    </g>
    <g fill="#e3a82b" stroke="#3a2b22" stroke-width="3" stroke-linejoin="round">
      <path d="M-6 28l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" />
      <path d="M318 250l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
    </g>
  </svg>
</template>
