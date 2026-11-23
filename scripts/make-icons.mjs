import { execFileSync } from 'node:child_process'
const svg = 'public/icons/icon.svg'
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
  execFileSync('rsvg-convert', ['-w', size, '-h', size, svg, '-o', `public/icons/${name}.png`])
}
