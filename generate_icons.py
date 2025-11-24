import os

# Define the icons with their SVG content (paths/shapes)
# Style: Neon Cyan/Purple stroke, transparent fill, glow effect.
icons = {
    "client-portal-v2": '''
        <rect x="10" y="10" width="80" height="60" rx="5" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <line x1="10" y1="30" x2="90" y2="30" stroke="#00f3ff" stroke-width="2"/>
        <circle cx="30" cy="50" r="10" stroke="#bc13fe" stroke-width="2" fill="none"/>
        <rect x="50" y="45" width="30" height="10" fill="#bc13fe" opacity="0.5"/>
    ''',
    "app-AIDrumMachine": '''
        <circle cx="50" cy="50" r="35" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <circle cx="50" cy="50" r="25" stroke="#bc13fe" stroke-width="2" fill="none"/>
        <line x1="50" y1="15" x2="50" y2="85" stroke="#00f3ff" stroke-width="2"/>
        <line x1="15" y1="50" x2="85" y2="50" stroke="#00f3ff" stroke-width="2"/>
    ''',
    "app-AIPiano": '''
        <rect x="15" y="20" width="70" height="60" rx="2" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <line x1="29" y1="20" x2="29" y2="50" stroke="#00f3ff" stroke-width="2"/>
        <line x1="43" y1="20" x2="43" y2="50" stroke="#00f3ff" stroke-width="2"/>
        <line x1="57" y1="20" x2="57" y2="50" stroke="#00f3ff" stroke-width="2"/>
        <line x1="71" y1="20" x2="71" y2="50" stroke="#00f3ff" stroke-width="2"/>
        <rect x="33" y="20" width="6" height="35" fill="#bc13fe"/>
        <rect x="61" y="20" width="6" height="35" fill="#bc13fe"/>
    ''',
    "game-2048": '''
        <rect x="15" y="15" width="70" height="70" rx="5" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <line x1="50" y1="15" x2="50" y2="85" stroke="#00f3ff" stroke-width="1"/>
        <line x1="15" y1="50" x2="85" y2="50" stroke="#00f3ff" stroke-width="1"/>
        <text x="50" y="55" font-family="monospace" font-size="20" fill="#bc13fe" text-anchor="middle" alignment-baseline="middle">2048</text>
    ''',
    "game-Align": '''
        <line x1="50" y1="10" x2="50" y2="90" stroke="#bc13fe" stroke-width="2" stroke-dasharray="5,5"/>
        <circle cx="30" cy="50" r="10" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <circle cx="70" cy="50" r="10" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <line x1="40" y1="50" x2="60" y2="50" stroke="#00f3ff" stroke-width="2"/>
    ''',
    "game-AstroDuel": '''
        <path d="M50 20 L70 80 L50 70 L30 80 Z" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <circle cx="50" cy="45" r="5" fill="#bc13fe"/>
        <line x1="50" y1="70" x2="50" y2="85" stroke="#bc13fe" stroke-width="2"/>
    ''',
    "game-Billards": '''
        <circle cx="40" cy="40" r="20" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <circle cx="65" cy="65" r="20" stroke="#bc13fe" stroke-width="2" fill="none"/>
        <line x1="20" y1="80" x2="80" y2="20" stroke="#ffffff" stroke-width="2" stroke-opacity="0.5"/>
    ''',
    "game-EndlessBoxyRun": '''
        <rect x="20" y="50" width="20" height="20" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <line x1="10" y1="70" x2="90" y2="70" stroke="#bc13fe" stroke-width="2"/>
        <rect x="60" y="40" width="15" height="30" stroke="#bc13fe" stroke-width="2" fill="none"/>
    ''',
    "game-InteractivePiano": '''
        <path d="M20 30 Q50 10 80 30 T80 70 Q50 90 20 70 T20 30" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <circle cx="50" cy="50" r="10" fill="#bc13fe"/>
    ''',
    "game-MotorBall": '''
        <circle cx="50" cy="50" r="30" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <path d="M50 20 L50 80 M20 50 L80 50" stroke="#00f3ff" stroke-width="1"/>
        <circle cx="50" cy="50" r="10" fill="#bc13fe"/>
    ''',
    "game-Tetris": '''
        <rect x="30" y="30" width="20" height="20" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <rect x="50" y="30" width="20" height="20" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <rect x="50" y="50" width="20" height="20" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <rect x="70" y="50" width="20" height="20" stroke="#bc13fe" stroke-width="2" fill="none"/>
    ''',
    "game-simon": '''
        <path d="M50 50 L50 10 A40 40 0 0 1 90 50 Z" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <path d="M50 50 L90 50 A40 40 0 0 1 50 90 Z" stroke="#bc13fe" stroke-width="2" fill="none"/>
        <path d="M50 50 L50 90 A40 40 0 0 1 10 50 Z" stroke="#00f3ff" stroke-width="2" fill="none"/>
        <path d="M50 50 L10 50 A40 40 0 0 1 50 10 Z" stroke="#bc13fe" stroke-width="2" fill="none"/>
    ''',
    "game-snake": '''
        <path d="M20 80 Q20 20 50 50 T80 20" stroke="#00f3ff" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="80" cy="20" r="3" fill="#bc13fe"/>
    ''',
    "game-stickhero": '''
        <rect x="20" y="60" width="15" height="30" fill="#00f3ff"/>
        <rect x="65" y="60" width="15" height="30" fill="#00f3ff"/>
        <line x1="35" y1="60" x2="65" y2="60" stroke="#bc13fe" stroke-width="2"/>
        <circle cx="50" cy="55" r="3" fill="#bc13fe"/>
    '''
}

output_dir = "assets/icons"
os.makedirs(output_dir, exist_ok=True)

svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
        <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    <g filter="url(#glow)">
        {content}
    </g>
</svg>'''

for name, content in icons.items():
    filename = f"{output_dir}/{name}.svg"
    with open(filename, "w") as f:
        f.write(svg_template.format(content=content))
    print(f"Generated {filename}")
