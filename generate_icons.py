import os

assets_dir = 'apps/circuit-lab/assets'
os.makedirs(assets_dir, exist_ok=True)

icons = {
    'wire_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="50" x2="90" y2="50" stroke="#b87333" stroke-width="8" stroke-linecap="round"/>
    </svg>''',
    
    'battery_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="60" height="40" fill="#444" rx="5"/>
        <rect x="80" y="40" width="10" height="20" fill="#aaa"/>
        <text x="50" y="55" fill="white" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle">9V</text>
    </svg>''',
    
    'bulb_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="25" fill="none" stroke="#555" stroke-width="2"/>
        <path d="M40 65 L60 65 L55 80 L45 80 Z" fill="#888"/>
        <path d="M40 40 L45 30 L55 30 L60 40" fill="none" stroke="#333" stroke-width="2"/>
    </svg>''',
    
    'resistor_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polyline points="10,50 30,50 35,30 45,70 55,30 65,70 70,50 90,50" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/>
    </svg>''',
    
    'switch_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="50" x2="30" y2="50" stroke="#333" stroke-width="4"/>
        <line x1="70" y1="50" x2="90" y2="50" stroke="#333" stroke-width="4"/>
        <line x1="30" y1="50" x2="65" y2="20" stroke="#333" stroke-width="4"/>
        <circle cx="30" cy="50" r="3" fill="black"/>
        <circle cx="70" cy="50" r="3" fill="black"/>
    </svg>''',
    
    'voltmeter_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#f1c40f"/>
        <text x="50" y="55" fill="#333" font-family="Arial" font-size="40" text-anchor="middle" dominant-baseline="middle">V</text>
    </svg>''',
    
    'ammeter_icon.svg': '''<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#e74c3c"/>
        <text x="50" y="55" fill="white" font-family="Arial" font-size="40" text-anchor="middle" dominant-baseline="middle">A</text>
    </svg>'''
}

for filename, content in icons.items():
    with open(os.path.join(assets_dir, filename), 'w') as f:
        f.write(content)
        print(f"Generated {filename}")
