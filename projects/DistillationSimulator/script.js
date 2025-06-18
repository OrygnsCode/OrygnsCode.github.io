class ProfessionalDistillationSimulator {
    constructor() {
        this.parameters = {
            feedComposition: 0.5,
            qValue: 1.0,
            distillateComposition: 0.9,
            bottomsComposition: 0.1,
            refluxRatio: 2.0,
            relativeVolatility: 2.5,
            feedFlowRate: 1000,
            columnPressure: 1.0
        };

        this.results = {
            minRefluxRatio: 0,
            theoreticalPlates: 0,
            feedPlateLocation: 0,
            columnEfficiency: 0,
            condenserDuty: 0,
            reboilerDuty: 0,
            distillateFlowRate: 0,
            bottomsFlowRate: 0
        };

        this.componentData = {
            'ethanol-water': {
                light: 'Ethanol',
                heavy: 'Water',
                alpha: 2.5,
                heatOfVaporization: 38.56 // kJ/mol
            },
            'benzene-toluene': {
                light: 'Benzene',
                heavy: 'Toluene',
                alpha: 2.4,
                heatOfVaporization: 30.72
            },
            'acetone-water': {
                light: 'Acetone',
                heavy: 'Water',
                alpha: 6.8,
                heatOfVaporization: 29.1
            },
            'methanol-water': {
                light: 'Methanol',
                heavy: 'Water',
                alpha: 3.2,
                heatOfVaporization: 35.21
            }
        };

        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = {top: 30, right: 40, bottom: 80, left: 80};
        this.currentPlate = 0;
        this.animationEnabled = true;
        this.gridVisible = true;

        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupEventListeners();
        this.setupDualInputs();
        this.setupVisualization();
        this.setupComponentData();
        this.updateCalculations();
        this.updateVisualization();
        this.initializeMathJax();
    }

    initializeMathJax() {
        if (window.MathJax) {
            MathJax.typesetPromise().catch((err) => {
                console.log('MathJax typeset failed: ' + err.message);
            });
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active tab content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${targetTab}-tab`).classList.add('active');

                // Re-render diagram if switching to simulator
                if (targetTab === 'simulator') {
                    setTimeout(() => {
                        this.setupVisualization();
                        this.updateVisualization();
                    }, 100);
                }
            });
        });
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('resetBtn').addEventListener('click', () => this.resetParameters());
        document.getElementById('optimizeBtn').addEventListener('click', () => this.optimizeRefluxRatio());

        // Diagram controls
        document.getElementById('zoomReset').addEventListener('click', () => this.resetZoom());
        document.getElementById('toggleGrid').addEventListener('click', () => this.toggleGrid());
        document.getElementById('toggleAnimation').addEventListener('click', () => this.toggleAnimation());

        // Export buttons
        document.getElementById('exportSVG').addEventListener('click', () => this.exportSVG());
        document.getElementById('exportPNG').addEventListener('click', () => this.exportPNG());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportPDF());
        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportResultsBtn').addEventListener('click', () => this.exportResults());

        // Component selector
        document.getElementById('componentPair').addEventListener('change', (e) => {
            this.loadComponentData(e.target.value);
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupDualInputs() {
        Object.keys(this.parameters).forEach(param => {
            const slider = document.getElementById(param);
            const input = document.getElementById(param + 'Input');
            const display = document.getElementById(param + 'Value');

            if (slider && input && display) {
                // Sync slider to input
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.updateParameter(param, value);
                    input.value = value;
                    this.updateDisplay(param, value);
                });

                // Sync input to slider
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                        const min = parseFloat(slider.min);
                        const max = parseFloat(slider.max);
                        const clampedValue = Math.min(Math.max(value, min), max);

                        slider.value = clampedValue;
                        this.updateParameter(param, clampedValue);
                        this.updateDisplay(param, clampedValue);

                        if (value !== clampedValue) {
                            input.value = clampedValue;
                        }
                    }
                });

                // Initialize display
                this.updateDisplay(param, this.parameters[param]);
            }
        });
    }

    updateParameter(param, value) {
        this.parameters[param] = value;
        this.updateCalculations();
        this.updateVisualization();
    }

    updateDisplay(param, value) {
        const display = document.getElementById(param + 'Value');
        if (display) {
            const decimals = this.getDecimalPlaces(param);
            display.textContent = value.toFixed(decimals);
        }
    }

    getDecimalPlaces(param) {
        const decimalMap = {
            feedComposition: 3,
            distillateComposition: 3,
            bottomsComposition: 3,
            qValue: 2,
            refluxRatio: 2,
            relativeVolatility: 2,
            feedFlowRate: 0,
            columnPressure: 1
        };
        return decimalMap[param] || 2;
    }

    setupVisualization() {
        const container = document.getElementById('mcCabeThieleDiagram');
        if (!container) {
            console.warn("McCabe-Thiele diagram container not found on this page.");
            return;
        }
        const containerRect = container.getBoundingClientRect();

        this.width = containerRect.width - this.margin.left - this.margin.right;
        this.height = containerRect.height - this.margin.top - this.margin.bottom;

        // Clear existing SVG
        d3.select(container).selectAll("*").remove();

        this.svg = d3.select(container)
            .append('svg')
            .attr('width', containerRect.width)
            .attr('height', containerRect.height);

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Setup scales
        this.xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([this.height, 0]);

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                if (this.g) {
                    this.g.attr('transform',
                        `translate(${this.margin.left},${this.margin.top}) ${event.transform}`);
                }
            });

        this.svg.call(this.zoom);

        // Add chart elements
        this.addGrid();
        this.addAxes();
        this.addDiagonalLine();
    }

    addGrid() {
        if (!this.g) return;
        const gridGroup = this.g.append('g').attr('class', 'grid-group');

        // Vertical grid lines
        gridGroup.append('g')
            .attr('class', 'grid vertical-grid')
            .selectAll('line')
            .data(this.xScale.ticks(10))
            .enter()
            .append('line')
            .attr('x1', d => this.xScale(d))
            .attr('x2', d => this.xScale(d))
            .attr('y1', 0)
            .attr('y2', this.height);

        // Horizontal grid lines
        gridGroup.append('g')
            .attr('class', 'grid horizontal-grid')
            .selectAll('line')
            .data(this.yScale.ticks(10))
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('x2', this.width)
            .attr('y1', d => this.yScale(d))
            .attr('y2', d => this.yScale(d));
    }

    addAxes() {
        if (!this.g) return;
        // X-axis
        this.g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale)
                .ticks(10)
                .tickFormat(d3.format('.1f')));

        // Y-axis
        this.g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(this.yScale)
                .ticks(10)
                .tickFormat(d3.format('.1f')));

        // Axis labels
        this.g.append('text')
            .attr('class', 'axis-label x-label')
            .attr('text-anchor', 'middle')
            .attr('x', this.width / 2)
            .attr('y', this.height + 60)
            .text('Liquid Mole Fraction of Light Component, x');

        this.g.append('text')
            .attr('class', 'axis-label y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.height / 2)
            .attr('y', -50)
            .text('Vapor Mole Fraction of Light Component, y');
    }

    addDiagonalLine() {
        if (!this.g) return;
        this.g.append('line')
            .attr('class', 'diagonal-line')
            .attr('x1', 0)
            .attr('y1', this.height)
            .attr('x2', this.width)
            .attr('y2', 0)
            .style('stroke', '#9ca3af')
            .style('stroke-width', 1)
            .style('stroke-dasharray', '5,5')
            .style('opacity', 0.7);
    }

    calculateEquilibrium(x, alpha) {
        return (alpha * x) / (1 + (alpha - 1) * x);
    }

    calculateMinimumRefluxRatio() {
        const { feedComposition, distillateComposition, qValue, relativeVolatility } = this.parameters;
        const yStarFeed = this.calculateEquilibrium(feedComposition, relativeVolatility);
        let xIntersect, yIntersect;

        if (qValue === 1) {
            xIntersect = feedComposition;
            yIntersect = yStarFeed;
        } else if (qValue === 0) { // Saturated vapor
             xIntersect = feedComposition;
             yIntersect = feedComposition; // Intersection is on diagonal
             // This yIntersect is for q-line with diagonal. Actual y* for pinch is yStarFeed
             const Rmin_num = distillateComposition - yStarFeed;
             const Rmin_den = yStarFeed - feedComposition;
             if (Math.abs(Rmin_den) < 1e-6) return 1E6; // Avoid division by zero, very high Rmin
             return Math.max(Rmin_num / Rmin_den, 0.1);

        } else { // Subcooled liquid or superheated vapor
            const qLineSlope = qValue / (qValue - 1);
            const qLineIntercept = -feedComposition / (qValue - 1);

            let x = feedComposition; // Initial guess
            for (let i = 0; i < 20; i++) { // Newton-Raphson or other solver
                const yEq = this.calculateEquilibrium(x, relativeVolatility);
                const yLineVal = qLineSlope * x + qLineIntercept;
                const f = yEq - yLineVal;
                if (Math.abs(f) < 1e-6) break;
                const dydx_eq = relativeVolatility / Math.pow(1 + (relativeVolatility - 1) * x, 2);
                const fp = dydx_eq - qLineSlope;
                if (Math.abs(fp) < 1e-6) { x = (x==feedComposition) ? distillateComposition : feedComposition; break;} // Avoid division by zero or stall
                x = x - f / fp;
                x = Math.max(0, Math.min(1, x)); // Clamp x to [0,1]
            }
            xIntersect = x;
            yIntersect = this.calculateEquilibrium(x, relativeVolatility);
        }

        if (Math.abs(yIntersect - xIntersect) < 1e-6) return 1E6; // Avoid division by zero
        const minReflux = (distillateComposition - yIntersect) / (yIntersect - xIntersect);
        return Math.max(minReflux, 0.1);
    }

    calculateOperatingLines() {
        const { feedComposition, distillateComposition, bottomsComposition, refluxRatio, qValue } = this.parameters;
        const rectifyingSlope = refluxRatio / (refluxRatio + 1);
        const rectifyingIntercept = distillateComposition / (refluxRatio + 1);
        let xIntersect, yIntersect;

        if (Math.abs(qValue - 1) < 1e-6) { // Saturated liquid feed (q=1)
            xIntersect = feedComposition;
            yIntersect = rectifyingSlope * xIntersect + rectifyingIntercept;
        } else if (Math.abs(qValue) < 1e-6) { // Saturated vapor feed (q=0)
            xIntersect = feedComposition;
            yIntersect = xIntersect; // y=x for q=0 line
             // The intersection relevant for operating lines is where feed comp meets rectifying line
            yIntersect = rectifyingSlope * feedComposition + rectifyingIntercept;

        } else { // Other feed conditions
            const qLineSlope = qValue / (qValue - 1);
            const qLineIntercept = -feedComposition / (qValue - 1);
            if (Math.abs(rectifyingSlope - qLineSlope) < 1e-6) { // Parallel lines
                 xIntersect = feedComposition; // Default to feed x
                 yIntersect = rectifyingSlope * xIntersect + rectifyingIntercept;
            } else {
                xIntersect = (qLineIntercept - rectifyingIntercept) / (rectifyingSlope - qLineSlope);
                yIntersect = rectifyingSlope * xIntersect + rectifyingIntercept;
            }
        }

        // Clamp intersection to be physically meaningful (between bottoms and distillate)
        xIntersect = Math.max(bottomsComposition, Math.min(distillateComposition, xIntersect));
        yIntersect = Math.max(bottomsComposition, Math.min(distillateComposition, yIntersect));


        let strippingSlope, strippingIntercept;
        if (Math.abs(xIntersect - bottomsComposition) < 1e-6) { // Avoid division by zero
            strippingSlope = 1E6; // Effectively vertical line
        } else {
            strippingSlope = (yIntersect - bottomsComposition) / (xIntersect - bottomsComposition);
        }
        strippingIntercept = bottomsComposition - strippingSlope * bottomsComposition;

        return {
            rectifying: { slope: rectifyingSlope, intercept: rectifyingIntercept },
            stripping: { slope: strippingSlope, intercept: strippingIntercept },
            qLine: { slope: (Math.abs(qValue - 1) < 1e-6) ? Infinity : qValue / (qValue - 1), intercept: -feedComposition / (qValue - 1) },
            intersection: { x: xIntersect, y: yIntersect }
        };
    }

    calculateTheoreticalPlates() {
        const { distillateComposition, bottomsComposition, relativeVolatility } = this.parameters;
        const opLines = this.calculateOperatingLines();
        let plates = 0;
        let x = distillateComposition;
        let y = distillateComposition; // Start at y=x=xD
        let feedPlateFound = false;
        let feedPlateLocation = 0;
        const steps = [];

        while (x > bottomsComposition && plates < 150) { // Increased plate limit
            const yEq = this.calculateEquilibrium(x, relativeVolatility); // y* at current x
            steps.push({ x1: x, y1: y, x2: x, y2: yEq, type: 'vertical', plate: plates + 1 });
            y = yEq; // Move to equilibrium curve

            let xNext;
            if (x >= opLines.intersection.x || (Math.abs(x - opLines.intersection.x) < 1e-3 && x > opLines.intersection.x)) { // Rectifying section or very close to intersection on rectifying side
                if (Math.abs(opLines.rectifying.slope) < 1e-6) { xNext = bottomsComposition -1; break;} // Horizontal line, will get stuck
                xNext = (y - opLines.rectifying.intercept) / opLines.rectifying.slope;
            } else { // Stripping section
                if (!feedPlateFound) {
                    feedPlateLocation = plates + 1;
                    feedPlateFound = true;
                }
                if (Math.abs(opLines.stripping.slope) < 1e-6) { xNext = bottomsComposition -1; break;} // Horizontal line
                xNext = (y - opLines.stripping.intercept) / opLines.stripping.slope;
            }
            steps.push({ x1: x, y1: y, x2: xNext, y2: y, type: 'horizontal', plate: plates + 1 });

            if (xNext >= x && x < distillateComposition) { plates = 150; break; } // Prevent infinite loop if stepping backward or stalling not at xD

            x = xNext;
            plates++;
             if (x <= bottomsComposition + 1e-5) break; // Add tolerance for comparison
        }
         if (!feedPlateFound && plates > 0) feedPlateLocation = plates; // If only stripping/rectifying

        return { plates, steps, feedPlateLocation };
    }

    calculateHeatDuties() {
        const { feedFlowRate, feedComposition, distillateComposition, bottomsComposition, refluxRatio } = this.parameters;
        if (distillateComposition <= bottomsComposition) { // Invalid spec
             return { condenserDuty: NaN, reboilerDuty: NaN, distillateFlowRate: NaN, bottomsFlowRate: NaN };
        }

        const distillateFlowRate = feedFlowRate * (feedComposition - bottomsComposition) /
                                  (distillateComposition - bottomsComposition);
        const bottomsFlowRate = feedFlowRate - distillateFlowRate;

        if (distillateFlowRate < 0 || bottomsFlowRate < 0) { // Indicates infeasible separation based on mass balance
            return { condenserDuty: NaN, reboilerDuty: NaN, distillateFlowRate: distillateFlowRate, bottomsFlowRate: bottomsFlowRate };
        }

        const selectedComponentKey = document.getElementById('componentPair').value;
        let heatOfVap = 35.0; // Default kJ/mol
        if (this.componentData[selectedComponentKey] && this.componentData[selectedComponentKey].heatOfVaporization) {
            heatOfVap = this.componentData[selectedComponentKey].heatOfVaporization;
        }

        const refluxFlow = refluxRatio * distillateFlowRate;
        const vaporRateCondenser = refluxFlow + distillateFlowRate; // kmol/hr
        const condenserDuty = vaporRateCondenser * heatOfVap * 1000 / 3600; // kW (kJ/s)

        // Reboiler duty: V' = L' - B. L' = R*D + q*F (approx for q line derivation)
        // V_reboil typically slightly higher than V_condenser due to feed enthalpy.
        // Simplified: Q_R often taken as Q_C + P_feed_enthalpy_contribution
        // For now, a common heuristic or relation to Qc
        const reboilerDuty = condenserDuty * 1.15; // Approximation, can be more detailed

        return {
            condenserDuty,
            reboilerDuty,
            distillateFlowRate,
            bottomsFlowRate
        };
    }

    updateCalculations() {
        try {
            this.results.minRefluxRatio = this.calculateMinimumRefluxRatio();
            const plateCalc = this.calculateTheoreticalPlates();
            this.results.theoreticalPlates = plateCalc.plates;
            this.results.feedPlateLocation = plateCalc.feedPlateLocation;
            this.results.plateSteps = plateCalc.steps;

            // Approximate Column Efficiency
            if (this.parameters.refluxRatio > this.results.minRefluxRatio) {
                 this.results.columnEfficiency = Math.min(95, 70 + 20 * (this.parameters.refluxRatio / this.results.minRefluxRatio - 1));
            } else {
                 this.results.columnEfficiency = 65; // Lower if R < Rmin (though not typical operation)
            }
            this.results.columnEfficiency = Math.max(50, this.results.columnEfficiency);


            const duties = this.calculateHeatDuties();
            this.results.condenserDuty = duties.condenserDuty;
            this.results.reboilerDuty = duties.reboilerDuty;
            this.results.distillateFlowRate = duties.distillateFlowRate;
            this.results.bottomsFlowRate = duties.bottomsFlowRate;

            this.updateResultsDisplay();
        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError(`Calculation error: ${error.message}. Check inputs.`);
        }
    }

    updateResultsDisplay() {
        const formatVal = (val, dec) => isNaN(val) ? 'Error' : val.toFixed(dec);

        const resultElements = {
            minRefluxRatio: formatVal(this.results.minRefluxRatio, 2),
            theoreticalPlates: isNaN(this.results.theoreticalPlates) ? 'Error' : this.results.theoreticalPlates.toString(),
            feedPlateLocation: isNaN(this.results.feedPlateLocation) ? 'Error' :this.results.feedPlateLocation.toString(),
            columnEfficiency: formatVal(this.results.columnEfficiency, 1),
            condenserDuty: formatVal(this.results.condenserDuty, 1),
            reboilerDuty: formatVal(this.results.reboilerDuty, 1)
        };

        Object.entries(resultElements).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
                element.classList.add('fade-in');
                setTimeout(()=>element.classList.remove('fade-in'), 500);
            }
        });
    }

    updateVisualization() {
        if (!this.svg || !this.g) {
             this.setupVisualization(); // Attempt to re-init if svg/g is missing
             if(!this.svg || !this.g) return; // If still missing, exit
        }

        this.g.selectAll('.curve, .operating-line, .plate-step, .key-point, .point-label, .plates-group').remove();
        this.drawEquilibriumCurve();
        this.drawOperatingLines();
        this.drawTheoreticalPlates();
        this.drawKeyPoints();
    }

    drawEquilibriumCurve() {
        if (!this.g) return;
        const { relativeVolatility } = this.parameters;
        const data = [];
        for (let x = 0; x <= 1; x += 0.005) {
            data.push([x, this.calculateEquilibrium(x, relativeVolatility)]);
        }
        const line = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
            .curve(d3.curveMonotoneX); // Smoother curve

        this.g.append('path')
            .datum(data)
            .attr('class', 'curve equilibrium-curve')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', 'var(--primary-blue)')
            .style('stroke-width', 2.5)
            .style('opacity', 0).transition().duration(this.animationEnabled ? 800:0).style('opacity', 1);
    }

    drawOperatingLines() {
        if (!this.g) return;
        const opLines = this.calculateOperatingLines();
        const { feedComposition, distillateComposition, bottomsComposition, qValue } = this.parameters;
        const lineGen = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));

        // Rectifying
        this.g.append('path')
            .datum([{x: distillateComposition, y: distillateComposition}, {x: opLines.intersection.x, y: opLines.intersection.y}])
            .attr('class', 'operating-line rectifying-line')
            .attr('d', lineGen)
            .style('stroke', 'var(--secondary-orange)')
            .style('stroke-width', 2)
            .style('opacity', 0).transition().duration(this.animationEnabled ? 800:0).delay(this.animationEnabled ? 200:0).style('opacity', 1);

        // Stripping
        this.g.append('path')
            .datum([{x: opLines.intersection.x, y: opLines.intersection.y}, {x: bottomsComposition, y: bottomsComposition}])
            .attr('class', 'operating-line stripping-line')
            .attr('d', lineGen)
            .style('stroke', 'var(--secondary-green)')
            .style('stroke-width', 2)
            .style('opacity', 0).transition().duration(this.animationEnabled ? 800:0).delay(this.animationEnabled ? 400:0).style('opacity', 1);

        // Q-line
        let qLineP1 = {x: feedComposition, y: feedComposition};
        let qLineP2 = {x: opLines.intersection.x, y: opLines.intersection.y};
         if (Math.abs(qValue - 1) < 1e-6) { // q=1 (saturated liquid)
            qLineP1 = {x: feedComposition, y: bottomsComposition}; // Start from xF on bottoms line
            qLineP2 = {x: feedComposition, y: distillateComposition}; // Go up to xD
            if (opLines.intersection.y < feedComposition) qLineP1.y = opLines.intersection.y; else qLineP2.y = opLines.intersection.y;

        } else if (Math.abs(qValue) < 1e-6) { // q=0 (saturated vapor)
             qLineP1 = {x: feedComposition, y: feedComposition};
             qLineP2 = {x: opLines.intersection.x, y: opLines.intersection.y}; // Should be y=x
        }


        this.g.append('path')
            .datum([qLineP1, qLineP2])
            .attr('class', 'operating-line q-line')
            .attr('d', lineGen)
            .style('stroke', 'var(--warning)')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '6,3')
            .style('opacity', 0).transition().duration(this.animationEnabled ? 800:0).delay(this.animationEnabled ? 600:0).style('opacity', 1);
    }

    drawTheoreticalPlates() {
        if (!this.g || !this.results.plateSteps || this.results.theoreticalPlates > 100) { // Limit drawing if too many plates
             if(this.results.theoreticalPlates > 100) console.warn("Plate drawing skipped, too many plates.");
             return;
        }
        const plateGroup = this.g.append('g').attr('class', 'plates-group');
        this.results.plateSteps.forEach((step, index) => {
            plateGroup.append('line')
                .attr('class', 'plate-step')
                .attr('x1', this.xScale(step.x1))
                .attr('y1', this.yScale(step.y1))
                .attr('x2', this.xScale(step.x1)) // Start with zero length for animation
                .attr('y2', this.yScale(step.y1))
                .style('stroke', 'var(--secondary-red)')
                .style('stroke-width', 1.5)
                .style('opacity', 0.7)
                .transition()
                .delay(this.animationEnabled ? (800 + index * 80) : 0)
                .duration(this.animationEnabled ? 150 : 0)
                .attr('x2', this.xScale(step.x2))
                .attr('y2', this.yScale(step.y2));
        });
    }

    drawKeyPoints() {
        if (!this.g) return;
        const { feedComposition, distillateComposition, bottomsComposition } = this.parameters;
        const opLines = this.calculateOperatingLines();
        const pointsData = [
            { x: feedComposition, y: feedComposition, label: 'Feed (xF)', color: 'var(--warning)', cssClass: 'feed-point' },
            { x: distillateComposition, y: distillateComposition, label: 'Distillate (xD)', color: 'var(--secondary-orange)', cssClass: 'distillate-point' },
            { x: bottomsComposition, y: bottomsComposition, label: 'Bottoms (xB)', color: 'var(--secondary-green)', cssClass: 'bottoms-point' },
            { x: opLines.intersection.x, y: opLines.intersection.y, label: 'Intersection', color: 'var(--secondary-purple)', cssClass: 'intersection-point' }
        ];

        const pointsGroup = this.g.append('g').attr('class', 'key-points-group');
        pointsData.forEach((p, i) => {
            pointsGroup.append('circle')
                .attr('cx', this.xScale(p.x))
                .attr('cy', this.yScale(p.y))
                .attr('r', 0)
                .style('fill', p.color)
                .attr('class', `key-point ${p.cssClass}`)
                .style('stroke', 'white')
                .style('stroke-width', 1.5)
                .transition()
                .duration(this.animationEnabled ? 500:0)
                .delay(this.animationEnabled ? (1000 + i * 100):0)
                .attr('r', 5);

            pointsGroup.append('text')
                .attr('x', this.xScale(p.x) + 8)
                .attr('y', this.yScale(p.y) - 8)
                .attr('class', 'point-label')
                .style('fill', p.color)
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .style('opacity', 0)
                .text(p.label)
                .transition()
                .duration(this.animationEnabled ? 500:0)
                .delay(this.animationEnabled ? (1200 + i * 100):0)
                .style('opacity', 1);
        });
    }

    resetParameters() {
        this.parameters = {
            feedComposition: 0.5, qValue: 1.0, distillateComposition: 0.9,
            bottomsComposition: 0.1, refluxRatio: 2.0, relativeVolatility: 2.5,
            feedFlowRate: 1000, columnPressure: 1.0
        };
        Object.keys(this.parameters).forEach(param => {
            const slider = document.getElementById(param);
            const input = document.getElementById(`${param}Input`);
            if (slider) slider.value = this.parameters[param];
            if (input) input.value = this.parameters[param];
            this.updateDisplay(param, this.parameters[param]);
        });
        this.updateCalculations();
        this.updateVisualization();
        this.showNotification('Parameters reset to default values.', 'info');
    }

    optimizeRefluxRatio() {
        const minReflux = this.results.minRefluxRatio;
        if (isNaN(minReflux) || minReflux <= 0) {
             this.showNotification('Cannot optimize: Minimum reflux ratio is invalid.', 'error');
             return;
        }
        const optimalReflux = Math.min(minReflux * 1.35, 12); // Typical 1.2-1.5 Rmin, cap at 12
        this.parameters.refluxRatio = parseFloat(optimalReflux.toFixed(2));

        ['refluxRatio'].forEach(param => { // Update only refluxRatio
            const slider = document.getElementById(param);
            const input = document.getElementById(`${param}Input`);
            if (slider) slider.value = this.parameters[param];
            if (input) input.value = this.parameters[param];
            this.updateDisplay(param, this.parameters[param]);
        });

        this.updateCalculations();
        this.updateVisualization();
        this.showNotification(`Reflux ratio optimized to ${this.parameters.refluxRatio.toFixed(2)}.`, 'success');
    }

    resetZoom() {
        if (!this.svg || !this.zoom) return;
        this.svg.transition().duration(this.animationEnabled ? 750:0).call(this.zoom.transform, d3.zoomIdentity);
    }

    toggleGrid() {
        if (!this.g) return;
        this.gridVisible = !this.gridVisible;
        this.g.select('.grid-group').style('opacity', this.gridVisible ? 1 : 0);
        document.getElementById('toggleGrid').textContent = this.gridVisible ? 'Hide Grid' : 'Show Grid';
    }

    toggleAnimation() {
        this.animationEnabled = !this.animationEnabled;
        document.getElementById('toggleAnimation').textContent = this.animationEnabled ? 'Anim: On' : 'Anim: Off';
        this.showNotification(`Animations ${this.animationEnabled ? 'enabled' : 'disabled'}.`, 'info');
    }

    setupComponentData() {
        // Default values are set in constructor. This could populate a dropdown if needed.
        // For now, just ensure initial alpha is used.
        this.loadComponentData(document.getElementById('componentPair').value);
    }

    loadComponentData(pairKey) {
        const lightCompEl = document.getElementById('lightComponent');
        const heavyCompEl = document.getElementById('heavyComponent');
        const alphaEl = document.getElementById('typicalAlpha');

        if (pairKey === 'custom') {
            if(lightCompEl) lightCompEl.textContent = 'Custom';
            if(heavyCompEl) heavyCompEl.textContent = 'Custom';
            if(alphaEl) alphaEl.textContent = 'User Defined';
            // Keep current user-defined alpha or default if none
        } else {
            const data = this.componentData[pairKey];
            if (data) {
                if(lightCompEl) lightCompEl.textContent = data.light;
                if(heavyCompEl) heavyCompEl.textContent = data.heavy;
                if(alphaEl) alphaEl.textContent = data.alpha.toFixed(1);

                this.parameters.relativeVolatility = data.alpha;
                ['relativeVolatility'].forEach(param => {
                     const slider = document.getElementById(param);
                     const input = document.getElementById(`${param}Input`);
                     if (slider) slider.value = this.parameters[param];
                     if (input) input.value = this.parameters[param];
                     this.updateDisplay(param, this.parameters[param]);
                });
            }
        }
        this.updateCalculations();
        this.updateVisualization();
    }

    exportSVG() {
        if (!this.svg) { this.showNotification('Diagram not available for export.', 'error'); return; }
        const svgNode = this.svg.node().cloneNode(true); // Clone node to preserve original
        d3.select(svgNode).selectAll('.axis, .grid, .axis-label, .point-label').remove(); // Remove elements for cleaner export if needed, or style them

        // Embed styles directly for better portability
        const styles = document.getElementById('professional-theme-styles'); // Assume you add an ID to your <style> tag
        if (styles) {
            const defs = svgNode.querySelector('defs') || svgNode.insertBefore(document.createElementNS(d3.namespaces.svg, 'defs'), svgNode.firstChild);
            const styleElement = document.createElementNS(d3.namespaces.svg, 'style');
            styleElement.textContent = styles.textContent; // This might be complex with CSS variables, consider inlining resolved styles
            defs.appendChild(styleElement);
        }

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgNode);
        // Basic CSS inlining for critical parts if external sheet or complex vars are an issue
         svgString = svgString.replace(/var\(--primary-blue\)/g, '#1e3a8a');
         svgString = svgString.replace(/var\(--secondary-orange\)/g, '#ea580c');
         svgString = svgString.replace(/var\(--secondary-green\)/g, '#059669');
         svgString = svgString.replace(/var\(--warning\)/g, '#f59e0b');
         svgString = svgString.replace(/var\(--secondary-red\)/g, '#dc2626');


        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mccabe-thiele-diagram-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showNotification('SVG Diagram exported successfully!', 'success');
    }

    exportPNG() {
        if (!this.svg) { this.showNotification('Diagram not available for export.', 'error'); return; }
        const svgNode = this.svg.node();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const svgRect = svgNode.getBoundingClientRect();
        const scale = 2; // For higher resolution PNG
        canvas.width = svgRect.width * scale;
        canvas.height = svgRect.height * scale;

        context.fillStyle = 'white'; // Background for PNG
        context.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src); // Clean up blob URL
            canvas.toBlob(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `mccabe-thiele-diagram-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                this.showNotification('PNG Diagram exported successfully!', 'success');
            }, 'image/png');
        };
        img.onerror = () => {
             URL.revokeObjectURL(img.src);
             this.showNotification('Error creating image for PNG export.', 'error');
        }

        // Create a string from the SVG, replacing CSS variables with their actual values for better rendering in canvas
        let svgString = new XMLSerializer().serializeToString(svgNode);
        svgString = svgString.replace(/var\(--primary-blue\)/g, '#1e3a8a');
        svgString = svgString.replace(/var\(--secondary-orange\)/g, '#ea580c');
        svgString = svgString.replace(/var\(--secondary-green\)/g, '#059669');
        svgString = svgString.replace(/var\(--warning\)/g, '#f59e0b');
        svgString = svgString.replace(/var\(--secondary-red\)/g, '#dc2626');
        svgString = svgString.replace(/var\(--text-primary\)/g, '#111827');
        svgString = svgString.replace(/var\(--text-secondary\)/g, '#4b5563');
        svgString = svgString.replace(/var\(--border-primary\)/g, '#e5e7eb');


        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        img.src = URL.createObjectURL(svgBlob);
    }


    exportPDF() {
        this.showNotification('PDF export is via Print Dialog (Ctrl/Cmd+P). Choose "Save as PDF".', 'info');
        // Actual PDF generation client-side is complex, often relying on libraries like jsPDF + svg2pdf
        // For this example, we guide user to print-to-PDF.
    }

    exportCSV() {
        const headers = ['Parameter', 'Value', 'Units', '', 'Result', 'Value', 'Units'];
        const params = this.parameters;
        const res = this.results;
        const data = [
            ['Feed Composition (xF)', params.feedComposition.toFixed(3), 'mol/mol', '', 'Min. Reflux (Rmin)', res.minRefluxRatio.toFixed(2), ''],
            ['Feed Quality (q)', params.qValue.toFixed(2), '', '', 'Theoretical Plates (NT)', res.theoreticalPlates, 'stages'],
            ['Distillate Comp (xD)', params.distillateComposition.toFixed(3), 'mol/mol', '', 'Feed Plate (NF)', res.feedPlateLocation, 'from top'],
            ['Bottoms Comp (xB)', params.bottomsComposition.toFixed(3), 'mol/mol', '', 'Column Efficiency', res.columnEfficiency.toFixed(1), '%'],
            ['Reflux Ratio (R)', params.refluxRatio.toFixed(2), '', '', 'Condenser Duty (Qc)', res.condenserDuty.toFixed(1), 'kW'],
            ['Relative Volatility (alpha)', params.relativeVolatility.toFixed(2), '', '', 'Reboiler Duty (Qr)', res.reboilerDuty.toFixed(1), 'kW'],
            ['Feed Flow Rate (F)', params.feedFlowRate, 'kmol/h', '', 'Distillate Rate (D)', res.distillateFlowRate.toFixed(2), 'kmol/h'],
            ['Column Pressure', params.columnPressure.toFixed(1), 'bar', '', 'Bottoms Rate (B)', res.bottomsFlowRate.toFixed(2), 'kmol/h']
        ];

        const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `distillation_summary_data_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        this.showNotification('Summary data exported as CSV.', 'success');
    }

    exportResults() { this.exportCSV(); } // Alias

    handleResize() {
        if(this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (document.getElementById('simulator-tab').classList.contains('active')) {
                 this.setupVisualization(); // Re-init scales and SVG size
                 this.updateVisualization(); // Redraw everything
            }
        }, 250);
    }

    displayError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') { // Default to info
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`; // Use a distinct class
        notification.textContent = message;

        // Basic styling for the toast
        notification.style.cssText = `
            position: fixed;
            bottom: 20px; /* Changed from top to bottom */
            right: 20px;
            background-color: ${type === 'error' ? 'var(--error)' : (type === 'success' ? 'var(--success)' : 'var(--info)')};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: var(--shadow-md);
            z-index: 2000; /* Ensure it's on top */
            opacity: 0;
            transform: translateY(20px); /* Start off-screen */
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10); // Small delay to ensure transition happens

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Wait for transition to finish
        }, 3500); // Display for 3.5 seconds
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the professional-theme-styles ID exists on the style tag for SVG export
    const styleTag = document.querySelector('link[href="style.css"]');
    if(styleTag){
        // To make its content accessible for SVG export, we might need to fetch it if it's external.
        // For this setup, we'll assume critical styles for SVG are manually handled or inlined.
        // If style.css was an internal <style> tag, it would be easier.
        // The current exportSVG tries to replace var() calls, which is a partial solution.
    }
    new ProfessionalDistillationSimulator();
});
