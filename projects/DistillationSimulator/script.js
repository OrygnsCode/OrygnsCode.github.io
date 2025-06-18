// projects/DistillationSimulator/script.js

class ProfessionalDistillationSimulator {
    constructor() {
        // Default Parameters
        this.feedRate = 100; // F
        this.feedComposition = 0.5; // zF
        this.qValue = 1.0; // Feed condition (e.g., 1 for saturated liquid, 0 for saturated vapor)
        this.refluxRatio = 1.5; // R = L/D
        this.distillateComposition = 0.95; // xD
        this.bottomsComposition = 0.05; // xB
        this.relativeVolatility = 2.5; // alpha (for VLE calculation)

        // Results
        this.minimumRefluxRatio = null;
        this.actualRefluxRatio = null;
        this.numberOfTheoreticalPlates = null;
        this.feedPlateLocation = null;

        // Component Data (example)
        this.componentData = {
            "benzene-toluene": {
                name: "Benzene-Toluene",
                alpha_A_B: 2.4, // Relative volatility of Benzene to Toluene
                antoine_A: { A: 6.90565, B: 1211.033, C: 220.79 }, // Benzene
                antoine_B: { A: 6.95464, B: 1344.800, C: 219.482 }  // Toluene
            },
            "ethanol-water": {
                name: "Ethanol-Water",
                alpha_A_B: 2.8, // This is a simplification; Ethanol-Water is non-ideal
                // More accurate VLE data would be needed for Ethanol-Water (e.g., Wilson, NRTL models or data tables)
                antoine_A: { A: 8.20417, B: 1642.89, C: 230.30 }, // Ethanol
                antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 }  // Water
            }
        };
        this.currentComponentSystem = "benzene-toluene"; // Default system

        // D3 Elements
        this.svg = null;
        this.xScale = null;
        this.yScale = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };

        this.init();
    }

    init() {
        this.setupTabs();
        this.setupEventListeners();
        this.setupVisualization();
        this.updateComponentDataUI();
        this.calculateAndDraw(); // Initial calculation and drawing

        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(button.dataset.tab + '-content').classList.add('active');

                if (button.dataset.tab === 'theory' && window.MathJax) {
                    window.MathJax.typesetPromise(); // Re-typeset MathJax for theory tab
                }
                if (button.dataset.tab === 'simulator') {
                    this.handleResize(); // Redraw if switching to simulator tab
                }
            });
        });
    }

    setupEventListeners() {
        // Input sliders and fields
        document.getElementById('feedRate').addEventListener('input', (e) => {
            this.feedRate = parseFloat(e.target.value);
            this.calculateAndDraw();
        });
        document.getElementById('feedComposition').addEventListener('input', (e) => {
            this.feedComposition = parseFloat(e.target.value);
            document.getElementById('feedCompositionValue').textContent = this.feedComposition.toFixed(2);
            this.calculateAndDraw();
        });
        // Mockup for other inputs - these need to be added to HTML
        // For example:
        // document.getElementById('qValue').addEventListener('input', (e) => { this.qValue = parseFloat(e.target.value); this.calculateAndDraw(); });
        // document.getElementById('refluxRatio').addEventListener('input', (e) => { this.refluxRatio = parseFloat(e.target.value); this.calculateAndDraw(); });
        // document.getElementById('distillateComposition').addEventListener('input', (e) => { this.distillateComposition = parseFloat(e.target.value); this.calculateAndDraw(); });
        // document.getElementById('bottomsComposition').addEventListener('input', (e) => { this.bottomsComposition = parseFloat(e.target.value); this.calculateAndDraw(); });

        document.getElementById('component-select').addEventListener('change', (e) => {
            this.currentComponentSystem = e.target.value;
            this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B;
            this.updateComponentDataUI();
            this.calculateAndDraw();
        });

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    updateComponentDataUI() {
        const system = this.componentData[this.currentComponentSystem];
        const propertiesDiv = document.getElementById('system-properties');
        if (!propertiesDiv) return;

        propertiesDiv.innerHTML = `
            <h4>${system.name}</h4>
            <p>Relative Volatility (α<sub>A-B</sub>): ${system.alpha_A_B.toFixed(2)}</p>
            ${system.antoine_A ? `<p><strong>Component A (e.g., Benzene) Antoine Constants:</strong> A=${system.antoine_A.A}, B=${system.antoine_A.B}, C=${system.antoine_A.C}</p>` : ''}
            ${system.antoine_B ? `<p><strong>Component B (e.g., Toluene) Antoine Constants:</strong> A=${system.antoine_B.A}, B=${system.antoine_B.B}, C=${system.antoine_B.C}</p>` : ''}
            ${system.name === "Ethanol-Water" ? "<p><small>Note: Ethanol-Water system is non-ideal. The provided alpha is a simplification. Accurate VLE data is complex.</small></p>" : ""}
        `;
         if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }

    calculateEquilibrium(x_A) {
        // Simple VLE: y_A = (alpha * x_A) / (1 + (alpha - 1) * x_A)
        if (x_A === 1.0) return 1.0; // Avoid division by zero issues if alpha is such
        return (this.relativeVolatility * x_A) / (1 + (this.relativeVolatility - 1) * x_A);
    }

    setupVisualization() {
        const container = document.getElementById('mccabe-thiele-diagram');
        if (!container) return;

        this.width = container.clientWidth - this.margin.left - this.margin.right;
        this.height = container.clientHeight - this.margin.top - this.margin.bottom;

        // Clear previous SVG if any
        d3.select(container).select("svg").remove();

        this.svg = d3.select(container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Scales
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

        // Axes
        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale));
        this.svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale));

        // Axis labels
        this.svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", this.width / 2 + this.margin.left/2) // Centered
            .attr("y", this.height + this.margin.bottom - 10)
            .text("Liquid Mole Fraction (x)");

        this.svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -this.margin.left + 20)
            .attr("x", -this.height / 2)
            .text("Vapor Mole Fraction (y)");

        // Diagonal line (y=x)
        this.svg.append("line")
            .attr("class", "diagonal-line")
            .attr("x1", this.xScale(0))
            .attr("y1", this.yScale(0))
            .attr("x2", this.xScale(1))
            .attr("y2", this.yScale(1))
            .attr("stroke", "grey")
            .attr("stroke-dasharray", "2,2");
    }

    drawEquilibriumCurve() {
        if (!this.svg) this.setupVisualization(); // Ensure SVG is setup

        this.svg.selectAll(".equilibrium-curve").remove(); // Clear previous curve

        const lineGenerator = d3.line()
            .x(d => this.xScale(d.x))
            .y(d => this.yScale(d.y));

        const points = [];
        for (let i = 0; i <= 100; i++) {
            let x = i / 100;
            points.push({ x: x, y: this.calculateEquilibrium(x) });
        }

        this.svg.append("path")
            .datum(points)
            .attr("class", "equilibrium-curve")
            .attr("fill", "none")
            .attr("stroke", "var(--primary-color)")
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);
    }

    drawOperatingLines() {
        if (!this.svg) return;
        this.svg.selectAll(".operating-line").remove(); // Clear previous lines
        this.svg.selectAll(".q-line").remove();

        // q-line: y = q/(q-1) * x - zF/(q-1)  OR x = zF if q=1 (vertical) OR y = zF if q=0 (horizontal)
        // Intersection of q-line with equilibrium curve is important.
        // Intersection of q-line with y=x line is (zF, zF).

        // Rectifying Operating Line (ROL): y = (R/(R+1))x + xD/(R+1)
        // Starts at (xD, xD) on y=x line.
        // Intercept on y-axis: xD / (R+1)
        const rol_y_intercept = this.distillateComposition / (this.refluxRatio + 1);
        this.svg.append("line")
            .attr("class", "operating-line rol")
            .attr("x1", this.xScale(this.distillateComposition))
            .attr("y1", this.yScale(this.distillateComposition)) // Starts at (xD,xD)
            .attr("x2", this.xScale(0)) // To y-axis
            .attr("y2", this.yScale(rol_y_intercept))
            .attr("stroke", "var(--accent-color)")
            .attr("stroke-width", 1.5);

        // Stripping Operating Line (SOL): y = L'/V' * x - B*xB / V'  where L'/V' = (Rmin+1) / (Rmin*q + 1) ... complex
        // Simplified: Connects (xB, xB) to the intersection of q-line and ROL.
        // For now, this is a placeholder. Proper calculation of intersection is needed.
        // Placeholder: Draw from (xB, xB) to a point on equilibrium curve (e.g. at xB, y_eq(xB))
        // This needs to be refined with actual intersection point of q-line and ROL.
        this.svg.append("line")
            .attr("class", "operating-line sol")
            .attr("x1", this.xScale(this.bottomsComposition))
            .attr("y1", this.yScale(this.bottomsComposition)) // Starts at (xB, xB)
            // This x2,y2 is a placeholder for the intersection point
            .attr("x2", this.xScale(this.feedComposition))
            .attr("y2", this.yScale(this.calculateEquilibrium(this.feedComposition)))
            .attr("stroke", "var(--success-color)")
            .attr("stroke-width", 1.5);

        // Draw q-line (simplified for saturated liquid q=1, vertical line at x=zF)
        if (this.qValue === 1) {
            this.svg.append("line")
                .attr("class", "q-line")
                .attr("x1", this.xScale(this.feedComposition))
                .attr("y1", this.yScale(this.feedComposition)) // from y=x line
                .attr("x2", this.xScale(this.feedComposition))
                .attr("y2", this.yScale(this.calculateEquilibrium(this.feedComposition))) // to equilibrium curve
                .attr("stroke", "purple")
                .attr("stroke-dasharray", "4,2")
                .attr("stroke-width", 1.5);
        }
        // Add logic for other q values (slope q/(q-1))
    }

    drawTheoreticalPlates() {
        if (!this.svg) return;
        this.svg.selectAll(".plate-step").remove(); // Clear previous plates

        let plates = 0;
        let currentX = this.distillateComposition;
        let currentY = this.distillateComposition;

        // Stepping downwards from distillate (rectifying section)
        // This is a simplified stepping logic and needs refinement for accuracy and intersection checks
        while (currentX > this.bottomsComposition && currentY > this.calculateEquilibrium(this.bottomsComposition) && plates < 50) { // Safety break
            plates++;
            // Horizontal step to equilibrium curve
            let nextX_on_eq = this.findXForYOnEquilibrium(currentY);
            if (nextX_on_eq === null) break; // Should not happen if currentY is valid

            this.svg.append("line") // Horizontal line
                .attr("class", "plate-step")
                .attr("x1", this.xScale(currentX))
                .attr("y1", this.yScale(currentY))
                .attr("x2", this.xScale(nextX_on_eq))
                .attr("y2", this.yScale(currentY))
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);

            currentX = nextX_on_eq;
            // Vertical step to operating line
            // This needs to check which operating line to use (ROL or SOL) based on feed plate.
            // For now, simplified to use ROL logic (or a placeholder)
            let rol_y_intercept = this.distillateComposition / (this.refluxRatio + 1);
            let nextY_on_op = (this.refluxRatio / (this.refluxRatio + 1)) * currentX + rol_y_intercept;

            if (nextY_on_op < this.bottomsComposition) break; // Stop if going below bottoms

            this.svg.append("line") // Vertical line
                .attr("class", "plate-step")
                .attr("x1", this.xScale(currentX))
                .attr("y1", this.yScale(currentY))
                .attr("x2", this.xScale(currentX))
                .attr("y2", this.yScale(nextY_on_op))
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);

            currentY = nextY_on_op;

            if (currentX <= this.feedComposition) {
                // Transition to Stripping Operating Line (SOL) logic would be needed here
                // This is a major simplification point.
            }
        }
        this.numberOfTheoreticalPlates = plates;
        this.updateResultsDisplay();
    }

    // Helper to find x for a given y on equilibrium curve (inverse of calculateEquilibrium)
    // y = (alpha * x) / (1 + (alpha - 1) * x)  => y * (1 + (alpha-1)x) = alpha * x
    // y + y*(alpha-1)x = alpha*x => y = alpha*x - y*(alpha-1)x => y = x * (alpha - y*(alpha-1))
    // x = y / (alpha - y*(alpha-1))
    findXForYOnEquilibrium(y) {
        if (y === 1.0 && this.relativeVolatility === 1.0) return 1.0; // Special case if alpha = 1
        if (y === 1.0) return 1.0; // if y is 1, x must be 1
        let denominator = this.relativeVolatility - y * (this.relativeVolatility - 1);
        if (Math.abs(denominator) < 1e-9) return null; // Avoid division by zero, or if y is unreachable
        let x = y / denominator;
        return Math.max(0, Math.min(1, x)); // Clamp between 0 and 1
    }


    calculateMinimumRefluxRatio() {
        // Rmin is when operating line passes through (zF, y_eq_at_zF) and (xD, xD)
        // Slope of this line = (xD - y_eq_at_zF) / (xD - zF)
        // Also, slope = Rmin / (Rmin + 1)
        // So, Rmin / (Rmin + 1) = (xD - y_eq_at_zF) / (xD - zF)
        // Let m = (xD - y_eq_at_zF) / (xD - zF)
        // Rmin = m / (1 - m)
        const y_eq_at_zF = this.calculateEquilibrium(this.feedComposition);
        if (this.distillateComposition - this.feedComposition === 0) { // Avoid division by zero
            this.minimumRefluxRatio = Infinity; // Or handle as an error/special case
            return;
        }
        const m = (this.distillateComposition - y_eq_at_zF) / (this.distillateComposition - this.feedComposition);
        if (1 - m === 0 || m < 0) { // If m >= 1, Rmin is negative or infinite, indicates issue
            this.minimumRefluxRatio = Infinity;
        } else {
            this.minimumRefluxRatio = m / (1 - m);
        }
    }

    calculateAndDraw() {
        // Perform calculations
        this.calculateMinimumRefluxRatio();
        this.actualRefluxRatio = this.refluxRatio * (this.minimumRefluxRatio === Infinity ? 1.5 : this.minimumRefluxRatio); // Example: R = 1.5 * Rmin

        // Update D3 visualization
        if (!this.svg || this.width === 0) this.setupVisualization(); // Ensure SVG is ready
        this.drawEquilibriumCurve();
        this.drawOperatingLines(); // This needs R, xD, xB, q-line intersection
        this.drawTheoreticalPlates(); // This needs ROL, SOL, equilibrium curve

        this.updateResultsDisplay();
        this.updateLegend();
    }

    updateResultsDisplay() {
        const resultsDiv = document.querySelector('.results-grid');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = `
            <div><strong>Min. Reflux Ratio (R<sub>min</sub>):</strong> ${this.minimumRefluxRatio !== null && isFinite(this.minimumRefluxRatio) ? this.minimumRefluxRatio.toFixed(2) : 'N/A'}</div>
            <div><strong>Actual Reflux Ratio (R):</strong> ${this.actualRefluxRatio !== null && isFinite(this.actualRefluxRatio) ? this.actualRefluxRatio.toFixed(2) : 'N/A'}</div>
            <div><strong>Theor. Plates (N):</strong> ${this.numberOfTheoreticalPlates !== null ? this.numberOfTheoreticalPlates : 'N/A'}</div>
            <div><strong>Feed Plate (approx):</strong> ${this.feedPlateLocation !== null ? this.feedPlateLocation : 'N/A (Above Reboiler)'}</div>
        `;
         if (window.MathJax) {
            window.MathJax.typesetPromise(); // For R_min
        }
    }

    updateLegend() {
        const legendDiv = document.querySelector('.visualization-panel .legend');
        if (!legendDiv) return;
        legendDiv.innerHTML = `
            <span style="--legend-color: var(--primary-color);">Equilibrium Curve</span>
            <span style="--legend-color: var(--accent-color);">Rectifying Operating Line</span>
            <span style="--legend-color: var(--success-color);">Stripping Operating Line</span>
            <span style="--legend-color: purple;">q-Line</span>
            <span style="--legend-color: grey;">y=x Line</span>
            <span style="--legend-color: black;">Plate Steps</span>
        `;
        // Add ::before styles directly or use JS to set background color of swatches
        // This is a bit hacky, better to define classes for each legend item
        const styleSheetId = 'dynamic-legend-styles';
        let styleSheet = document.getElementById(styleSheetId);
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = styleSheetId;
            document.head.appendChild(styleSheet);
        }

        let cssRules = "";
        legendDiv.querySelectorAll('span').forEach(span => {
            const color = span.style.getPropertyValue('--legend-color');
            if (color) {
                // Create a more specific class to avoid conflicts if multiple legends existed
                const uniqueClass = `legend-item-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
                span.classList.add(uniqueClass); // Add class to span
                // Add rule to stylesheet
                cssRules += `.${uniqueClass}::before { background-color: ${color} !important; }\n`;
            }
        });
        styleSheet.innerHTML = cssRules;
    }


    handleResize() {
        if (document.getElementById('simulator-content').classList.contains('active')) {
            this.setupVisualization(); // Re-initialize scales and SVG container size
            this.calculateAndDraw();   // Redraw everything
        }
    }

    // Utility functions for export (placeholder)
    exportToSVG() { console.log("Export to SVG clicked"); }
    exportToPNG() { console.log("Export to PNG clicked"); }
    // ... more utilities
}

// Instantiate the simulator when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.distillationSimulator = new ProfessionalDistillationSimulator();
});
