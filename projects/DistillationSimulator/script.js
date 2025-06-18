
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
                this.g.attr('transform', 
                    `translate(${this.margin.left},${this.margin.top}) ${event.transform}`);
            });
            
        this.svg.call(this.zoom);
        
        // Add chart elements
        this.addGrid();
        this.addAxes();
        this.addDiagonalLine();
    }
    
    addGrid() {
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
    
    // Enhanced Chemical Engineering Calculations
    calculateEquilibrium(x, alpha) {
        return (alpha * x) / (1 + (alpha - 1) * x);
    }
    
    calculateMinimumRefluxRatio() {
        const { feedComposition, distillateComposition, qValue, relativeVolatility } = this.parameters;
        
        // Calculate y* at feed composition
        const yStarFeed = this.calculateEquilibrium(feedComposition, relativeVolatility);
        
        // Calculate q-line intersection with equilibrium curve
        let xIntersect, yIntersect;
        
        if (qValue === 1) {
            // Saturated liquid feed
            xIntersect = feedComposition;
            yIntersect = yStarFeed;
        } else {
            // Solve intersection iteratively
            const qLineSlope = qValue / (qValue - 1);
            const qLineIntercept = -feedComposition / (qValue - 1);
            
            // Newton-Raphson method to find intersection
            let x = feedComposition;
            for (let i = 0; i < 10; i++) {
                const yEq = this.calculateEquilibrium(x, relativeVolatility);
                const yLine = qLineSlope * x + qLineIntercept;
                const f = yEq - yLine;
                
                if (Math.abs(f) < 1e-6) break;
                
                const dydx = relativeVolatility / Math.pow(1 + (relativeVolatility - 1) * x, 2);
                const fp = dydx - qLineSlope;
                x = x - f / fp;
            }
            
            xIntersect = x;
            yIntersect = this.calculateEquilibrium(x, relativeVolatility);
        }
        
        const minReflux = (distillateComposition - yIntersect) / (yIntersect - xIntersect);
        return Math.max(minReflux, 0.1);
    }
    
    calculateOperatingLines() {
        const { feedComposition, distillateComposition, bottomsComposition, refluxRatio, qValue } = this.parameters;
        
        // Rectifying section operating line
        const rectifyingSlope = refluxRatio / (refluxRatio + 1);
        const rectifyingIntercept = distillateComposition / (refluxRatio + 1);
        
        // q-line
        const qLineSlope = qValue / (qValue - 1);
        const qLineIntercept = -feedComposition / (qValue - 1);
        
        // Intersection of rectifying line and q-line
        const xIntersect = (qLineIntercept - rectifyingIntercept) / (rectifyingSlope - qLineSlope);
        const yIntersect = rectifyingSlope * xIntersect + rectifyingIntercept;
        
        // Stripping section operating line
        const strippingSlope = (yIntersect - bottomsComposition) / (xIntersect - bottomsComposition);
        const strippingIntercept = bottomsComposition - strippingSlope * bottomsComposition;
        
        return {
            rectifying: { slope: rectifyingSlope, intercept: rectifyingIntercept },
            stripping: { slope: strippingSlope, intercept: strippingIntercept },
            qLine: { slope: qLineSlope, intercept: qLineIntercept },
            intersection: { x: xIntersect, y: yIntersect }
        };
    }
    
    calculateTheoreticalPlates() {
        const { distillateComposition, bottomsComposition, relativeVolatility } = this.parameters;
        const operatingLines = this.calculateOperatingLines();
        
        let plates = 0;
        let x = distillateComposition;
        let y = distillateComposition;
        let feedPlateFound = false;
        let feedPlateLocation = 0;
        
        const steps = [];
        const plateData = [];
        
        while (x > bottomsComposition && plates < 100) {
            // Step down to equilibrium curve
            const yNew = this.calculateEquilibrium(x, relativeVolatility);
            steps.push({ x1: x, y1: y, x2: x, y2: yNew, type: 'vertical', plate: plates + 1 });
            y = yNew;
            
            // Step horizontally to operating line
            let xNew;
            if (x > operatingLines.intersection.x) {
                // Rectifying section
                xNew = (y - operatingLines.rectifying.intercept) / operatingLines.rectifying.slope;
            } else {
                // Stripping section
                xNew = (y - operatingLines.stripping.intercept) / operatingLines.stripping.slope;
                if (!feedPlateFound) {
                    feedPlateLocation = plates + 1;
                    feedPlateFound = true;
                }
            }
            
            steps.push({ x1: x, y1: y, x2: xNew, y2: y, type: 'horizontal', plate: plates + 1 });
            
            // Store plate data
            plateData.push({
                plate: plates + 1,
                x: x,
                y: y,
                section: x > operatingLines.intersection.x ? 'rectifying' : 'stripping'
            });
            
            x = xNew;
            plates++;
            
            if (x <= bottomsComposition || Math.abs(x - bottomsComposition) < 1e-6) break;
        }
        
        return { plates, steps, feedPlateLocation, plateData };
    }
    
    calculateHeatDuties() {
        const { feedFlowRate, feedComposition, distillateComposition, bottomsComposition } = this.parameters;
        
        // Material balance
        const distillateFlowRate = feedFlowRate * (feedComposition - bottomsComposition) / 
                                  (distillateComposition - bottomsComposition);
        const bottomsFlowRate = feedFlowRate - distillateFlowRate;
        
        // Simplified duty calculations (assuming constant heat of vaporization)
        const heatOfVaporization = 35.0; // kJ/mol (approximate for light hydrocarbons)
        const refluxFlowRate = this.parameters.refluxRatio * distillateFlowRate;
        
        const condenserDuty = (refluxFlowRate + distillateFlowRate) * heatOfVaporization / 3600; // kW
        const reboilerDuty = condenserDuty * 1.1; // Approximate, accounting for column heat losses
        
        return {
            condenserDuty,
            reboilerDuty,
            distillateFlowRate,
            bottomsFlowRate
        };
    }
    
    updateCalculations() {
        try {
            // Calculate minimum reflux ratio
            this.results.minRefluxRatio = this.calculateMinimumRefluxRatio();
            
            // Calculate theoretical plates
            const plateData = this.calculateTheoreticalPlates();
            this.results.theoreticalPlates = plateData.plates;
            this.results.feedPlateLocation = plateData.feedPlateLocation;
            this.results.plateSteps = plateData.steps;
            this.results.plateData = plateData.plateData;
            
            // Calculate column efficiency
            const efficiency = Math.min(95, Math.max(65, 
                90 - (this.parameters.refluxRatio - this.results.minRefluxRatio) * 1.5));
            this.results.columnEfficiency = efficiency;
            
            // Calculate heat duties
            const duties = this.calculateHeatDuties();
            this.results.condenserDuty = duties.condenserDuty;
            this.results.reboilerDuty = duties.reboilerDuty;
            this.results.distillateFlowRate = duties.distillateFlowRate;
            this.results.bottomsFlowRate = duties.bottomsFlowRate;
            
            // Update results display
            this.updateResultsDisplay();
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.displayError('Calculation error. Please check input parameters.');
        }
    }
    
    updateResultsDisplay() {
        const resultElements = {
            minRefluxRatio: this.results.minRefluxRatio.toFixed(3),
            theoreticalPlates: this.results.theoreticalPlates.toString(),
            feedPlateLocation: this.results.feedPlateLocation.toString(),
            columnEfficiency: this.results.columnEfficiency.toFixed(1),
            condenserDuty: this.results.condenserDuty.toFixed(1),
            reboilerDuty: this.results.reboilerDuty.toFixed(1)
        };
        
        Object.entries(resultElements).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
                element.classList.add('fade-in');
            }
        });
    }
    
    updateVisualization() {
        if (!this.svg) return;
        
        // Clear previous curves and lines
        this.g.selectAll('.curve, .operating-line, .plate-step, .key-point, .point-label').remove();
        
        // Draw components
        this.drawEquilibriumCurve();
        this.drawOperatingLines();
        this.drawTheoreticalPlates();
        this.drawKeyPoints();
    }
    
    drawEquilibriumCurve() {
        const { relativeVolatility } = this.parameters;
        const data = [];
        
        for (let x = 0; x <= 1; x += 0.005) {
            const y = this.calculateEquilibrium(x, relativeVolatility);
            data.push([x, y]);
        }
        
        const line = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]))
            .curve(d3.curveCardinal.tension(0.1));
            
        this.g.append('path')
            .datum(data)
            .attr('class', 'curve equilibrium-curve')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#1e3a8a')
            .style('stroke-width', 3)
            .style('opacity', 0)
            .transition()
            .duration(1000)
            .style('opacity', 1);
    }
    
    drawOperatingLines() {
        const operatingLines = this.calculateOperatingLines();
        const { feedComposition, distillateComposition, bottomsComposition } = this.parameters;
        
        // Rectifying operating line
        const rectData = [
            [operatingLines.intersection.x, operatingLines.intersection.y],
            [distillateComposition, distillateComposition]
        ];
        
        const line = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));
            
        this.g.append('path')
            .datum(rectData)
            .attr('class', 'operating-line rectifying-line')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#ea580c')
            .style('stroke-width', 2.5)
            .style('opacity', 0)
            .transition()
            .duration(1200)
            .style('opacity', 1);
            
        // Stripping operating line
        const stripData = [
            [bottomsComposition, bottomsComposition],
            [operatingLines.intersection.x, operatingLines.intersection.y]
        ];
        
        this.g.append('path')
            .datum(stripData)
            .attr('class', 'operating-line stripping-line')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#059669')
            .style('stroke-width', 2.5)
            .style('opacity', 0)
            .transition()
            .duration(1400)
            .style('opacity', 1);
            
        // q-line
        const qData = [
            [feedComposition, feedComposition],
            [operatingLines.intersection.x, operatingLines.intersection.y]
        ];
        
        this.g.append('path')
            .datum(qData)
            .attr('class', 'operating-line q-line')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', '#f59e0b')
            .style('stroke-width', 2.5)
            .style('stroke-dasharray', '8,4')
            .style('opacity', 0)
            .transition()
            .duration(1600)
            .style('opacity', 1);
    }
    
    drawTheoreticalPlates() {
        if (!this.results.plateSteps) return;
        
        const plateGroup = this.g.append('g').attr('class', 'plates-group');
        
        this.results.plateSteps.forEach((step, index) => {
            plateGroup.append('line')
                .attr('class', 'plate-step')
                .attr('x1', this.xScale(step.x1))
                .attr('y1', this.yScale(step.y1))
                .attr('x2', this.xScale(step.x1))
                .attr('y2', this.yScale(step.y1))
                .style('stroke', '#dc2626')
                .style('stroke-width', 2)
                .style('opacity', 0.8)
                .transition()
                .delay(index * 50)
                .duration(300)
                .attr('x2', this.xScale(step.x2))
                .attr('y2', this.yScale(step.y2));
        });
    }
    
    drawKeyPoints() {
        const { feedComposition, distillateComposition, bottomsComposition } = this.parameters;
        const operatingLines = this.calculateOperatingLines();
        
        const points = [
            { x: feedComposition, y: feedComposition, label: 'Feed', color: '#f59e0b', class: 'feed-point' },
            { x: distillateComposition, y: distillateComposition, label: 'Distillate', color: '#ea580c', class: 'distillate-point' },
            { x: bottomsComposition, y: bottomsComposition, label: 'Bottoms', color: '#059669', class: 'bottoms-point' },
            { x: operatingLines.intersection.x, y: operatingLines.intersection.y, label: 'Intersection', color: '#7c3aed', class: 'intersection-point' }
        ];
        
        const pointsGroup = this.g.append('g').attr('class', 'points-group');
        
        points.forEach((point, index) => {
            // Point circle
            pointsGroup.append('circle')
                .attr('class', `key-point ${point.class}`)
                .attr('cx', this.xScale(point.x))
                .attr('cy', this.yScale(point.y))
                .attr('r', 0)
                .style('fill', point.color)
                .style('stroke', '#ffffff')
                .style('stroke-width', 2)
                .transition()
                .delay(1800 + index * 100)
                .duration(300)
                .attr('r', 6);
                
            // Point label
            pointsGroup.append('text')
                .attr('class', 'point-label')
                .attr('x', this.xScale(point.x) + 12)
                .attr('y', this.yScale(point.y) - 8)
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', point.color)
                .style('opacity', 0)
                .text(point.label)
                .transition()
                .delay(1800 + index * 100 + 300)
                .duration(300)
                .style('opacity', 1);
        });
    }
    
    // Utility Methods
    resetParameters() {
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
        
        // Update all inputs
        Object.keys(this.parameters).forEach(param => {
            const slider = document.getElementById(param);
            const input = document.getElementById(param + 'Input');
            
            if (slider && input) {
                slider.value = this.parameters[param];
                input.value = this.parameters[param];
                this.updateDisplay(param, this.parameters[param]);
            }
        });
        
        this.updateCalculations();
        this.updateVisualization();
    }
    
    optimizeRefluxRatio() {
        const minReflux = this.results.minRefluxRatio;
        const optimalReflux = minReflux * 1.5; // Typical optimal is 1.2-1.5 times minimum
        
        this.parameters.refluxRatio = Math.min(optimalReflux, 15);
        
        const slider = document.getElementById('refluxRatio');
        const input = document.getElementById('refluxRatioInput');
        
        if (slider && input) {
            slider.value = this.parameters.refluxRatio;
            input.value = this.parameters.refluxRatio;
            this.updateDisplay('refluxRatio', this.parameters.refluxRatio);
        }
        
        this.updateCalculations();
        this.updateVisualization();
        
        // Show optimization message
        this.showNotification('Reflux ratio optimized for economic operation');
    }
    
    resetZoom() {
        this.svg.transition().duration(750).call(
            this.zoom.transform,
            d3.zoomIdentity
        );
    }
    
    toggleGrid() {
        const gridGroup = this.g.select('.grid-group');
        const currentOpacity = gridGroup.style('opacity') || 1;
        const newOpacity = currentOpacity == 1 ? 0 : 1;
        
        gridGroup.transition()
            .duration(300)
            .style('opacity', newOpacity);
            
        this.gridVisible = newOpacity == 1;
    }
    
    toggleAnimation() {
        this.animationEnabled = !this.animationEnabled;
        const btn = document.getElementById('toggleAnimation');
        btn.textContent = this.animationEnabled ? 'Disable Animation' : 'Enable Animation';
        btn.classList.toggle('active');
    }
    
    setupComponentData() {
        const selector = document.getElementById('componentPair');
        const lightComponent = document.getElementById('lightComponent');
        const heavyComponent = document.getElementById('heavyComponent');
        const typicalAlpha = document.getElementById('typicalAlpha');
        
        // Set default to custom
        lightComponent.textContent = 'Custom';
        heavyComponent.textContent = 'Custom';
        typicalAlpha.textContent = 'User Defined';
    }
    
    loadComponentData(pairKey) {
        if (pairKey === 'custom') {
            document.getElementById('lightComponent').textContent = 'Custom';
            document.getElementById('heavyComponent').textContent = 'Custom';
            document.getElementById('typicalAlpha').textContent = 'User Defined';
            return;
        }
        
        const data = this.componentData[pairKey];
        if (data) {
            document.getElementById('lightComponent').textContent = data.light;
            document.getElementById('heavyComponent').textContent = data.heavy;
            document.getElementById('typicalAlpha').textContent = data.alpha.toFixed(1);
            
            // Update relative volatility parameter
            this.parameters.relativeVolatility = data.alpha;
            const slider = document.getElementById('relativeVolatility');
            const input = document.getElementById('relativeVolatilityInput');
            
            if (slider && input) {
                slider.value = data.alpha;
                input.value = data.alpha;
                this.updateDisplay('relativeVolatility', data.alpha);
            }
            
            this.updateCalculations();
            this.updateVisualization();
        }
    }
    
    // Export Methods
    exportSVG() {
        const svgNode = this.svg.node();
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgNode);
        
        // Add CSS styles to SVG
        const cssStyles = `
            <style>
                .axis text { font-family: Inter, sans-serif; font-size: 12px; }
                .axis path, .axis line { fill: none; stroke: #6b7280; stroke-width: 1px; }
                .grid line { stroke: #e5e7eb; stroke-opacity: 0.7; stroke-width: 1px; }
                .axis-label { font-family: Inter, sans-serif; font-size: 14px; font-weight: 600; }
            </style>
        `;
        
        const finalSvg = svgString.replace('<svg', cssStyles + '<svg');
        
        const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mccabe-thiele-diagram-${Date.now()}.svg`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('SVG exported successfully');
    }
    
    exportPNG() {
        const svgNode = this.svg.node();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const svgRect = svgNode.getBoundingClientRect();
        const scale = 2; // Higher resolution
        canvas.width = svgRect.width * scale;
        canvas.height = svgRect.height * scale;
        
        const img = new Image();
        const svgBlob = new Blob([new XMLSerializer().serializeToString(svgNode)], 
                                 { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            context.scale(scale, scale);
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0);
            
            canvas.toBlob(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `mccabe-thiele-diagram-${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(link.href);
                this.showNotification('PNG exported successfully');
            });
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }
    
    exportPDF() {
        // For now, just export as high-resolution PNG
        // In a real implementation, you might use jsPDF or similar
        this.exportPNG();
        this.showNotification('PDF export not yet implemented. PNG exported instead.');
    }
    
    exportCSV() {
        const csvData = [
            ['Parameter', 'Value', 'Units'],
            ['Feed Composition', this.parameters.feedComposition.toFixed(3), 'mol/mol'],
            ['Distillate Composition', this.parameters.distillateComposition.toFixed(3), 'mol/mol'],
            ['Bottoms Composition', this.parameters.bottomsComposition.toFixed(3), 'mol/mol'],
            ['Feed Quality', this.parameters.qValue.toFixed(2), '—'],
            ['Reflux Ratio', this.parameters.refluxRatio.toFixed(2), '—'],
            ['Relative Volatility', this.parameters.relativeVolatility.toFixed(2), '—'],
            ['Feed Flow Rate', this.parameters.feedFlowRate.toString(), 'kmol/h'],
            ['Column Pressure', this.parameters.columnPressure.toFixed(1), 'bar'],
            ['', '', ''],
            ['Results', '', ''],
            ['Minimum Reflux Ratio', this.results.minRefluxRatio.toFixed(3), '—'],
            ['Theoretical Plates', this.results.theoreticalPlates.toString(), 'stages'],
            ['Feed Plate Location', this.results.feedPlateLocation.toString(), 'from top'],
            ['Column Efficiency', this.results.columnEfficiency.toFixed(1), '%'],
            ['Condenser Duty', this.results.condenserDuty.toFixed(1), 'kW'],
            ['Reboiler Duty', this.results.reboilerDuty.toFixed(1), 'kW']
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `distillation-parameters-${Date.now()}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('CSV data exported successfully');
    }
    
    exportResults() {
        this.exportCSV();
    }
    
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.setupVisualization();
            this.updateVisualization();
        }, 250);
    }
    
    displayError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalDistillationSimulator();
});
