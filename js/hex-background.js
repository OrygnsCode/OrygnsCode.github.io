document.addEventListener('DOMContentLoaded', function() {
    // Section 1: Hex Grid Generation
    const hexBackground = document.getElementById('hex-background');
    if (!hexBackground) {
        console.error("Hex background container #hex-background not found.");
        return;
    }

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");

    const hexRadius = 80; // Increased hexagon size
    const hexWidth = Math.sqrt(3) * hexRadius;
    const hexHeight = 2 * hexRadius;
    const vertSpacing = hexHeight * 3/4;
    const horizSpacing = hexWidth;

    const hexPathData = `M 0 ${-hexRadius}
                         L ${hexWidth/2} ${-hexRadius/2}
                         L ${hexWidth/2} ${hexRadius/2}
                         L 0 ${hexRadius}
                         L ${-hexWidth/2} ${hexRadius/2}
                         L ${-hexWidth/2} ${-hexRadius/2}
                         Z`;

    const screenWidth = window.innerWidth + (hexWidth * 2);
    const screenHeight = window.innerHeight + (hexHeight * 2);

    const numRows = Math.ceil(screenHeight / vertSpacing) + 1;
    const numCols = Math.ceil(screenWidth / horizSpacing) + 1;

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            const xOffset = (r % 2 === 0) ? 0 : horizSpacing / 2;
            const cx = (c * horizSpacing) + xOffset - (hexWidth); // Adjusted offset for better coverage
            const cy = (r * vertSpacing) - (hexHeight); // Adjusted offset for better coverage

            const hexPath = document.createElementNS(svgNS, "path");
            hexPath.setAttribute("d", hexPathData);
            hexPath.setAttribute("transform", `translate(${cx}, ${cy})`);
            hexPath.classList.add('hexagon-path');
            hexPath.setAttribute('data-row', r);
            hexPath.setAttribute('data-col', c);
            svg.appendChild(hexPath);
        }
    }
    hexBackground.appendChild(svg);

    // Section 2: GSAP Pulse Animation
    if (typeof gsap !== 'undefined') {
        const allHexPaths = Array.from(svg.querySelectorAll('.hexagon-path'));
        if (allHexPaths.length === 0) {
            console.warn("No hexagon paths found for animation.");
            return;
        }

        function pulseHexagon(hexElement) {
            if (!hexElement) return;

            const currentStyle = getComputedStyle(hexElement);
            let currentStrokeColor = currentStyle.stroke;
            let dynamicBaseOpacity = 0.1;

            if (currentStrokeColor && currentStrokeColor.startsWith('rgba')) {
                const parts = currentStrokeColor.match(/[\d.]+/g);
                if (parts && parts.length === 4) {
                    dynamicBaseOpacity = parseFloat(parts[3]);
                }
            } else {
                const isDarkMode = document.body.classList.contains('dark-mode');
                dynamicBaseOpacity = isDarkMode ? 0.1 : 0.15;
            }

            gsap.timeline()
                .to(hexElement, {
                    strokeOpacity: Math.min(1, dynamicBaseOpacity + 0.7), // Increased opacity boost
                    strokeWidth: 3.5, // Increased stroke width for pulse
                    duration: 0.15, // Faster pulse up
                    ease: "power1.out"
                })
                .to(hexElement, {
                    strokeOpacity: dynamicBaseOpacity,
                    strokeWidth: 2, // Return to new base stroke width (from CSS change)
                    duration: 0.25, // Faster pulse down
                    ease: "power1.in"
                });
        }

        gsap.to({}, {
            duration: 0.05, // Faster ticker
            repeat: -1,
            ease: "linear",
            onRepeat: () => {
                const randomIndex = Math.floor(Math.random() * allHexPaths.length);
                const randomHex = allHexPaths[randomIndex];
                if (randomHex && !gsap.isTweening(randomHex)) {
                    pulseHexagon(randomHex);
                }
            }
        });
    } else {
        console.warn("GSAP not loaded, skipping hex pulse animation.");
    }
});
