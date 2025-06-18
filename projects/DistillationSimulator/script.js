// projects/DistillationSimulator/script.js

class ProfessionalDistillationSimulator {
    constructor() {
        // Core Parameters
        this.feedRate = 100.0;
        this.feedComposition = 0.50; // zF
        this.qValue = 1.0;
        this.refluxRatio = 1.5; // R
        this.distillateComposition = 0.95; // xD
        this.bottomsComposition = 0.05; // xB
        this.relativeVolatility = 2.5; // alpha

        // Calculated Simulation Results
        this.minimumRefluxRatio = null; // Rmin
        this.actualRefluxRatio = this.refluxRatio; // Initially same as input R
        this.numberOfTheoreticalPlates = null;
        this.feedPlateLocation = null;
        this.operatingLinesIntersection = { x: null, y: null };

        // Flow Rates & Loads
        this.distillateFlowRate = null; // D
        this.bottomsFlowRate = null;    // B
        this.condenserLoadFactor = null; // Proportional to V (vapor in rectifying)
        this.reboilerLoadFactor = null;  // Proportional to V_bar (vapor in stripping)
        this.refluxRatioToMinRefluxRatio = null; // R/Rmin

        // UI State & Helpers
        this.errorMessage = null;
        this.tooltipElement = null;
        this.stageData = [];
        this.showGrid = false;
        this.zoomableGroup = null;
        this.currentZoomTransform = d3.zoomIdentity; // Initialize zoom transform
        this.zoomBehavior = null;

        this.componentData = {
            "benzene-toluene": { name: "Benzene-Toluene", alpha_A_B: 2.4, antoine_A: { A: 6.90565, B: 1211.033, C: 220.79 }, antoine_B: { A: 6.95464, B: 1344.800, C: 219.482 } },
            "ethanol-water": { name: "Ethanol-Water", alpha_A_B: 2.8, antoine_A: { A: 8.20417, B: 1642.89, C: 230.30 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "methanol-water": { name: "Methanol-Water", alpha_A_B: 3.5, antoine_A: { A: 8.08097, B: 1582.271, C: 239.726 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "aceticacid-water": { name: "Acetic Acid-Water", alpha_A_B: 2.0, antoine_A: { A: 7.5732, B: 1567.45, C: 225.0 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } }
        };
        this.currentComponentSystem = "benzene-toluene"; // Default

        // D3 Visualization Objects
        this.svg = null;
        this.xScale = null;
        this.yScale = null;
        this.xAxisGroup = null;
        this.yAxisGroup = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };

        this.colors = {
            equilibrium: "var(--primary-color)",
            yEqualsX: "grey",
            rol: "var(--accent-color)",
            sol: "var(--success-color)",
            qLine: "purple",
            plateStep: "rgba(0, 0, 0, 0.6)",
            keyPoints: "red",
            axisText: "var(--text-color)" // Or a specific color like '#333'
        };

        // Defer init until DOM is loaded (handled by external event listener)
    }

    init() {
        this.populateComponentSelector();
        this.setupTabs();
        this.setupEventListeners();
        this.setupTooltips();

        if (this.componentData[this.currentComponentSystem]) {
            this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B;
        }
        this.syncInputsToUI(); // Set initial UI values from properties

        this.updateComponentDataUI(); // Update component data display based on default

        this.setupVisualization();
        if (this.width > 0 && this.height > 0) { // Only calculate if setup was successful
             this.calculateAndDraw();
        }


        if (window.MathJax) {
            window.MathJax.typesetPromise().catch(err => console.error('MathJax initial typeset error:', err));
        }
    }

    setupTooltips() {
        const tooltipDiv = document.createElement('div');
        tooltipDiv.classList.add('tooltip-popup');
        tooltipDiv.setAttribute('id', 'infoTooltip');
        document.body.appendChild(tooltipDiv);
        this.tooltipElement = tooltipDiv;

        const infoIcons = document.querySelectorAll('.info-icon');
        infoIcons.forEach(icon => {
            icon.setAttribute('tabindex', '0'); // Make it focusable
            icon.addEventListener('mouseenter', (e) => this.showTooltip(e));
            icon.addEventListener('mouseleave', () => this.hideTooltip());
            icon.addEventListener('focus', (e) => this.showTooltip(e));
            icon.addEventListener('blur', () => this.hideTooltip());
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideTooltip();
                    if (icon.offsetParent) { // Check if element is focusable before blur
                        icon.blur();
                    }
                }
            });
        });
    }

    showTooltip(event) {
        const icon = event.currentTarget;
        const tooltipText = icon.dataset.tooltip;

        if (!tooltipText || !this.tooltipElement) return;

        this.tooltipElement.textContent = tooltipText;
        this.tooltipElement.style.visibility = 'hidden'; // Prepare for measurement
        this.tooltipElement.classList.add('visible');    // Add class for styling that affects size

        const iconRect = icon.getBoundingClientRect();
        const tooltipWidth = this.tooltipElement.offsetWidth; // Measure after content and class
        const tooltipHeight = this.tooltipElement.offsetHeight;

        let top = iconRect.top + window.scrollY - tooltipHeight - 10; // 10px offset (for arrow + spacing)
        let left = iconRect.left + window.scrollX + (iconRect.width / 2) - (tooltipWidth / 2);

        if (left < 5) left = 5;
        if (left + tooltipWidth > window.innerWidth - 5) left = window.innerWidth - tooltipWidth - 5;
        if (top < window.scrollY + 5) {
            top = iconRect.bottom + window.scrollY + 10;
        }

        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.visibility = 'visible'; // Make it actually visible for opacity transition
    }

    hideTooltip() {
        if (!this.tooltipElement) return;
        this.tooltipElement.classList.remove('visible');
        this.tooltipElement.textContent = ''; // Clear content
    }

    populateComponentSelector() {
        const selectElement = document.getElementById('component-select');
        if (!selectElement) return;

        selectElement.innerHTML = ''; // Clear existing options

        for (const key in this.componentData) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = this.componentData[key].name;
            selectElement.appendChild(option);
        }

        const customOption = document.createElement('option');
        customOption.value = "custom";
        customOption.textContent = "Custom Alpha";
        selectElement.appendChild(customOption);

        selectElement.value = this.currentComponentSystem; // Set initial selection based on property
    }

    syncInputsToUI() {
        document.getElementById('feedRate').value = this.feedRate;
        document.getElementById('feedComposition').value = this.feedComposition;
        document.getElementById('feedCompositionValue').textContent = this.feedComposition.toFixed(2);
        document.getElementById('qValue').value = this.qValue;
        document.getElementById('distillateComposition').value = this.distillateComposition;
        document.getElementById('distillateCompositionValue').textContent = this.distillateComposition.toFixed(2);
        document.getElementById('bottomsComposition').value = this.bottomsComposition;
        document.getElementById('bottomsCompositionValue').textContent = this.bottomsComposition.toFixed(2);
        document.getElementById('refluxRatio').value = this.refluxRatio;
        document.getElementById('relativeVolatility').value = this.relativeVolatility.toFixed(2);

        const gridCheckboxElem = document.getElementById('showGridCheckbox');
        if (gridCheckboxElem) {
            gridCheckboxElem.checked = this.showGrid;
        }
    }

    setupEventListeners() {
        const inputIds = ['feedRate', 'feedComposition', 'qValue', 'distillateComposition', 'bottomsComposition', 'refluxRatio', 'relativeVolatility'];
        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (event) => {
                    if (this.hasOwnProperty(id)) {
                         this[id] = parseFloat(event.target.value);
                    } else if (id === 'feedComposition') {
                        this.feedComposition = parseFloat(event.target.value);
                    }

                    const valueDisplaySpan = document.getElementById(id + 'Value');
                    if (valueDisplaySpan) {
                        valueDisplaySpan.textContent = parseFloat(event.target.value).toFixed(2);
                    }
                    this.calculateAndDraw();
                });
            }
        });

        document.getElementById('component-select').addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            if (selectedValue === "custom") {
                this.currentComponentSystem = "custom";
                this.relativeVolatility = parseFloat(document.getElementById('relativeVolatility').value) || this.relativeVolatility;
                document.getElementById('relativeVolatility').focus();
            } else {
                this.currentComponentSystem = selectedValue;
                if (this.componentData[this.currentComponentSystem] && typeof this.componentData[this.currentComponentSystem].alpha_A_B !== 'undefined') {
                    this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B;
                    document.getElementById('relativeVolatility').value = this.relativeVolatility.toFixed(2);
                } else {
                    console.warn(`System ${this.currentComponentSystem} has no alpha_A_B defined.`);
                }
            }
            this.updateComponentDataUI();
            this.calculateAndDraw();
        });

        window.addEventListener('resize', this.handleResize.bind(this));

        const exportSVGBtn = document.getElementById('exportSVGButton');
        if (exportSVGBtn) exportSVGBtn.addEventListener('click', () => this.exportToSVG());

        const exportPNGBtn = document.getElementById('exportPNGButton');
        if (exportPNGBtn) exportPNGBtn.addEventListener('click', () => this.exportToPNG());

        const exportCSVBtn = document.getElementById('exportCSVButton');
        if (exportCSVBtn) exportCSVBtn.addEventListener('click', () => this.exportToCSV());

        const toggleBtn = document.getElementById('toggleStageDataButton');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleStageDataDisplay());

        const gridCheckbox = document.getElementById('showGridCheckbox');
        if (gridCheckbox) {
            gridCheckbox.addEventListener('change', (e) => {
                this.showGrid = e.target.checked;
                this.drawGrid();
            });
        }
        const resetViewBtn = document.getElementById('resetViewButton');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetZoom();
            });
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
                const activeContent = document.getElementById(button.dataset.tab + '-content');
                if (activeContent) activeContent.classList.add('active');

                if (button.dataset.tab === 'theory' && window.MathJax) {
                    setTimeout(() => {
                        window.MathJax.typesetPromise([document.getElementById('theory-content')])
                            .catch(err => console.error('MathJax typeset error:', err));
                    }, 0);
                }
                if (button.dataset.tab === 'simulator') {
                    this.handleResize();
                }
            });
        });
    }

    updateComponentDataUI() {
        const systemKey = this.currentComponentSystem;
        const propertiesDiv = document.getElementById('system-properties');
        if (!propertiesDiv) return;

        if (systemKey === "custom" || !this.componentData[systemKey]) {
            const currentAlpha = parseFloat(document.getElementById('relativeVolatility').value) || this.relativeVolatility;
            propertiesDiv.innerHTML = `
                <h4>Custom System</h4>
                <p>Relative Volatility (α) is set manually via the input field.</p>
                <p>Current α: ${currentAlpha.toFixed(2)}</p>`;
        } else {
            const system = this.componentData[systemKey];
            propertiesDiv.innerHTML = `
                <h4>${system.name}</h4>
                <p>Rel. Vol. (α<sub>A-B</sub>): ${system.alpha_A_B.toFixed(2)}</p>
                ${system.antoine_A ? `<p>Comp A Antoine: A=${system.antoine_A.A}, B=${system.antoine_A.B}, C=${system.antoine_A.C}</p>` : ''}
                ${system.antoine_B ? `<p>Comp B Antoine: A=${system.antoine_B.A}, B=${system.antoine_B.B}, C=${system.antoine_B.C}</p>` : ''}
                ${system.name === "Ethanol-Water" ? "<p><small>Note: Non-ideal system; alpha is simplified.</small></p>" : ""}
            `;
        }
        if (window.MathJax) {
            window.MathJax.typesetPromise([propertiesDiv]).catch(err => console.error('MathJax error in component UI:', err));
        }
    }

    calculateEquilibrium(x_A) {
        if (this.relativeVolatility === 1.0) return x_A;
        return (this.relativeVolatility * x_A) / (1.0 + (this.relativeVolatility - 1.0) * x_A);
    }

    findXForYOnEquilibrium(y_A) {
        if (this.relativeVolatility === 1.0) return y_A;
        if (y_A <= 0.0) return 0.0;
        if (y_A >= 1.0) return 1.0;

        let denominator = this.relativeVolatility - y_A * (this.relativeVolatility - 1.0);
        if (Math.abs(denominator) < 1e-9) {
            return y_A > 0.5 ? 1.0 : 0.0;
        }
        let x_A = y_A / denominator;
        return Math.max(0.0, Math.min(1.0, x_A));
    }

    calculateOperatingLinesIntersection() {
        const R = this.refluxRatio;
        const xD = this.distillateComposition;
        const zF = this.feedComposition;
        const q = this.qValue;
        let x_intersect, y_intersect;

        const m_ROL = R / (R + 1.0);
        const c_ROL = xD / (R + 1.0);

        if (Math.abs(q - 1.0) < 1e-6) {
            x_intersect = zF;
            y_intersect = m_ROL * x_intersect + c_ROL;
        } else if (Math.abs(q) < 1e-6) {
            y_intersect = zF;
            if (Math.abs(m_ROL) < 1e-9) {
                if (Math.abs(y_intersect - c_ROL) < 1e-6) {
                    x_intersect = zF;
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "ROL and q-line are coincident horizontal lines.";
                } else {
                    x_intersect = null;
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "ROL is horizontal but not equal to horizontal q-line.";
                }
            } else {
                x_intersect = (y_intersect - c_ROL) / m_ROL;
            }
        } else {
            const m_q = q / (q - 1.0);
            const c_q_alt = zF * (1.0 - m_q);

            if (Math.abs(m_ROL - m_q) < 1e-9) {
                if (Math.abs(c_ROL - c_q_alt) < 1e-6 ) {
                     x_intersect = zF;
                     y_intersect = m_ROL * x_intersect + c_ROL;
                     this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "ROL and q-line are coincident sloped lines.";
                } else {
                    x_intersect = null;
                    y_intersect = null;
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "ROL and q-line are parallel. Check parameters.";
                }
            } else {
                x_intersect = (c_q_alt - c_ROL) / (m_ROL - m_q);
                y_intersect = m_ROL * x_intersect + c_ROL;
            }
        }

        if (x_intersect === null || y_intersect === null || isNaN(x_intersect) || isNaN(y_intersect)) {
            this.operatingLinesIntersection = { x: null, y: null };
        } else {
            this.operatingLinesIntersection = {
                x: Math.max(0.0, Math.min(1.0, x_intersect)),
                y: Math.max(0.0, Math.min(1.0, y_intersect))
            };
        }
    }

    calculateMinimumRefluxRatio() {
        const zF = this.feedComposition;
        const xD = this.distillateComposition;
        const q = this.qValue;
        const alpha = this.relativeVolatility;
        let x_q_eq, y_q_eq;

        this.minimumRefluxRatio = null;

        if (Math.abs(q - 1.0) < 1e-6) {
            x_q_eq = zF;
            y_q_eq = this.calculateEquilibrium(x_q_eq);
        } else if (Math.abs(q) < 1e-6) {
            y_q_eq = zF;
            x_q_eq = this.findXForYOnEquilibrium(y_q_eq);
        } else {
            const m_q = q / (q - 1.0);
            const K1 = m_q;
            const K2 = zF * (1.0 - m_q);

            const a_quad = K1 * (alpha - 1.0);
            const b_quad = K1 + K2 * (alpha - 1.0) - alpha;
            const c_quad = K2;

            if (Math.abs(a_quad) < 1e-9) {
                if (Math.abs(b_quad) < 1e-9) {
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Rmin: q-line/eq intersection calculation failed (b_quad=0, c_quad!=0 in linear case).";
                    this.minimumRefluxRatio = Infinity; return;
                }
                x_q_eq = -c_quad / b_quad;
            } else {
                const discriminant = b_quad * b_quad - 4 * a_quad * c_quad;
                if (discriminant < -1e-9) {
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Rmin: No real intersection between q-line and equilibrium curve (negative discriminant).";
                    this.minimumRefluxRatio = Infinity; return;
                }
                const sqrt_discriminant = Math.sqrt(Math.max(0, discriminant));
                const x1 = (-b_quad + sqrt_discriminant) / (2 * a_quad);
                const x2 = (-b_quad - sqrt_discriminant) / (2 * a_quad);

                const x1_valid = (x1 >= -1e-6 && x1 <= 1.0 + 1e-6);
                const x2_valid = (x2 >= -1e-6 && x2 <= 1.0 + 1e-6);

                if (x1_valid && x2_valid) {
                    x_q_eq = (Math.abs(x1 - zF) < Math.abs(x2 - zF)) ? x1 : x2;
                } else if (x1_valid) {
                    x_q_eq = x1;
                } else if (x2_valid) {
                    x_q_eq = x2;
                } else {
                    this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Rmin: q-line/eq intersection point out of [0,1] bounds.";
                    this.minimumRefluxRatio = Infinity; return;
                }
            }
            x_q_eq = Math.max(0.0, Math.min(1.0, x_q_eq));
            y_q_eq = this.calculateEquilibrium(x_q_eq);
        }

        if (x_q_eq === null || y_q_eq === null || isNaN(x_q_eq) || isNaN(y_q_eq)) {
             this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Rmin: Failed to find valid q-line/equilibrium intersection.";
             this.minimumRefluxRatio = Infinity; return;
        }

        if (Math.abs(xD - x_q_eq) < 1e-9) {
            this.minimumRefluxRatio = Infinity;
        } else {
            const m_Rmin_line = (xD - y_q_eq) / (xD - x_q_eq);
            if (m_Rmin_line >= 1.0 || Math.abs(1.0 - m_Rmin_line) < 1e-9) {
                this.minimumRefluxRatio = Infinity;
            } else if (m_Rmin_line < 0 && xD < y_q_eq) {
                 this.minimumRefluxRatio = 0;
            } else {
                this.minimumRefluxRatio = m_Rmin_line / (1.0 - m_Rmin_line);
            }
        }
        if (this.minimumRefluxRatio < 0) this.minimumRefluxRatio = 0;
    }

    setupVisualization() {
        const container = document.getElementById('mccabe-thiele-diagram');
        if (!container) { console.error("Diagram container not found."); this.width = 0; this.height = 0; return; }
        if (container.offsetParent === null ||container.clientWidth === 0 || container.clientHeight === 0) { return; }

        this.width = container.clientWidth - this.margin.left - this.margin.right;
        this.height = container.clientHeight - this.margin.top - this.margin.bottom;
        if (this.width <= 0 || this.height <= 0) { console.warn("Calculated diagram dimensions are not positive. Aborting setup."); return; }

        d3.select(container).select("svg").remove();
        const rootSvgElement = d3.select(container)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.svg = rootSvgElement.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.zoomableGroup = this.svg.append("g").attr("class", "zoomable-content");

        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width]);
        this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);

        this.xAxisGroup = this.zoomableGroup.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale));
        this.xAxisGroup.selectAll("text").style("fill", this.colors.axisText);

        this.yAxisGroup = this.zoomableGroup.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale));
        this.yAxisGroup.selectAll("text").style("fill", this.colors.axisText);

        this.zoomableGroup.append("text").attr("class", "x-axis-label")
            .attr("text-anchor", "middle").attr("x", this.width / 2)
            .attr("y", this.height + this.margin.bottom - 10)
            .text("Liquid Mole Fraction (x)").style("fill", this.colors.axisText);

        this.zoomableGroup.append("text").attr("class", "y-axis-label")
            .attr("text-anchor", "middle").attr("transform", "rotate(-90)")
            .attr("y", -this.margin.left + 20).attr("x", -this.height / 2)
            .text("Vapor Mole Fraction (y)").style("fill", this.colors.axisText);

        this.zoomableGroup.append("line").attr("class", "diagonal-line")
            .attr("x1", this.xScale(0)).attr("y1", this.yScale(0))
            .attr("x2", this.xScale(1)).attr("y2", this.yScale(1))
            .attr("stroke", this.colors.yEqualsX).attr("stroke-dasharray", "2,2");

        this.zoomableGroup.append("g").attr("class", "key-points-group");

        const zoomed = (event) => {
            if (this.zoomableGroup) {
                this.currentZoomTransform = event.transform;
                this.zoomableGroup.attr("transform", event.transform);
            }
        };

        this.zoomBehavior = d3.zoom()
            .scaleExtent([0.2, 10])
            .on("zoom", zoomed);

        rootSvgElement.call(this.zoomBehavior);
        rootSvgElement.call(this.zoomBehavior.transform, this.currentZoomTransform);

        this.drawGrid();
    }

    resetZoom() {
        if (!this.svg || !this.zoomBehavior) { console.warn("SVG or zoom behavior not initialized."); return; }
        const rootSvgElement = d3.select(this.svg.node().closest("svg"));
        if (rootSvgElement.empty()) { console.warn("Root SVG for zoom reset not found."); return; }

        this.currentZoomTransform = d3.zoomIdentity;
        rootSvgElement.transition().duration(300)
            .call(this.zoomBehavior.transform, d3.zoomIdentity);
    }

    drawGrid() {
        if (!this.zoomableGroup || !this.xScale || !this.yScale) return;
        this.zoomableGroup.selectAll('g.grid').remove();
        if (!this.showGrid) return;
        const gridGroup = this.zoomableGroup.insert('g', ':first-child').attr('class', 'grid');
        gridGroup.selectAll("line.x-grid").data(this.xScale.ticks()).enter().append("line")
            .attr("class", "x-grid")
            .attr("x1", d => this.xScale(d)).attr("x2", d => this.xScale(d))
            .attr("y1", 0).attr("y2", this.height);
        gridGroup.selectAll("line.y-grid").data(this.yScale.ticks()).enter().append("line")
            .attr("class", "y-grid")
            .attr("x1", 0).attr("x2", this.width)
            .attr("y1", d => this.yScale(d)).attr("y2", d => this.yScale(d));
    }

    drawEquilibriumCurve() {
        if (!this.zoomableGroup || !this.xScale || !this.yScale) {
            this.setupVisualization();
            if (!this.zoomableGroup || !this.xScale || !this.yScale) {
                console.warn("Cannot draw equilibrium curve: D3 setup incomplete.");
                return;
            }
        }
        this.zoomableGroup.selectAll(".equilibrium-curve").remove();
        const lineGenerator = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));
        const points = [];
        for (let i = 0; i <= 100; i++) {
            let x = i / 100.0;
            points.push({ x: x, y: this.calculateEquilibrium(x) });
        }
        this.zoomableGroup.append("path").datum(points)
            .attr("class", "equilibrium-curve")
            .attr("fill", "none").attr("stroke", this.colors.equilibrium)
            .attr("stroke-width", 2).attr("d", lineGenerator);
    }

    drawOperatingLines() {
        if (!this.zoomableGroup || !this.xScale || !this.yScale || this.operatingLinesIntersection.x === null || isNaN(this.operatingLinesIntersection.x)) {
             console.warn("Cannot draw operating lines: D3 setup or intersection calc incomplete/invalid.");
             return;
        }
        this.zoomableGroup.selectAll(".q-line, .rol-line, .sol-line").remove();

        const { x: xi, y: yi } = this.operatingLinesIntersection;
        const zF = this.feedComposition; const xD = this.distillateComposition; const xB = this.bottomsComposition;

        this.zoomableGroup.append("line").attr("class", "q-line")
            .attr("x1", this.xScale(zF)).attr("y1", this.yScale(zF))
            .attr("x2", this.xScale(xi)).attr("y2", this.yScale(yi))
            .attr("stroke", this.colors.qLine).attr("stroke-dasharray", "4,2").attr("stroke-width", 1.5);
        this.zoomableGroup.append("line").attr("class", "rol-line")
            .attr("x1", this.xScale(xD)).attr("y1", this.yScale(xD))
            .attr("x2", this.xScale(xi)).attr("y2", this.yScale(yi))
            .attr("stroke", this.colors.rol).attr("stroke-width", 1.5);
        this.zoomableGroup.append("line").attr("class", "sol-line")
            .attr("x1", this.xScale(xB)).attr("y1", this.yScale(xB))
            .attr("x2", this.xScale(xi)).attr("y2", this.yScale(yi))
            .attr("stroke", this.colors.sol).attr("stroke-width", 1.5);
    }

    drawTheoreticalPlates() {
        if (!this.zoomableGroup || !this.xScale || !this.yScale || this.operatingLinesIntersection.x === null || isNaN(this.operatingLinesIntersection.x)) {
            console.warn("Cannot draw plates: D3 setup or intersection calc incomplete.");
            return;
        }
        this.zoomableGroup.selectAll(".plate-step").remove();
        this.stageData = [];
        this.feedPlateLocation = 0;
        let plates = 0;
        let currentX = this.distillateComposition;
        let currentY = this.distillateComposition;

        const R = this.actualRefluxRatio;
        const xD = this.distillateComposition;
        const xB = this.bottomsComposition;
        const { x: intersectionX, y: intersectionY } = this.operatingLinesIntersection;

        let m_SOL, c_SOL_term; // For y = m_SOL * x + c_SOL_term
        if (Math.abs(intersectionX - xB) < 1e-9) {
            m_SOL = Infinity;
            c_SOL_term = xB; // Not really a y-intercept, but x-value for vertical line
        } else {
            m_SOL = (intersectionY - xB) / (intersectionX - xB); // Slope using (xB,xB) and intersection
            c_SOL_term = xB - m_SOL * xB; // y-intercept based on line passing through (xB, xB)
        }

        while (currentX > xB + 1e-6 && currentY > xB + 1e-6 && plates < 100) {
            plates++;
            let prevX_H = currentX;
            currentX = this.findXForYOnEquilibrium(currentY);

            this.zoomableGroup.append("line").attr("class", "plate-step")
                .attr("x1", this.xScale(prevX_H)).attr("y1", this.yScale(currentY))
                .attr("x2", this.xScale(currentX)).attr("y2", this.yScale(currentY))
                .attr("stroke", this.colors.plateStep).attr("stroke-width", 0.5);

            this.stageData.push({ stage: plates, x: currentX, y: currentY });

            if (currentX <= xB + 1e-6) break;

            let prevY_V = currentY;

            if (this.feedPlateLocation === 0 && currentX < intersectionX + 1e-6 && currentY >= intersectionY - 1e-6 ) {
                this.feedPlateLocation = plates;
            }

            if (this.feedPlateLocation === 0 || currentX >= intersectionX - 1e-6) {
                currentY = (R / (R + 1.0)) * currentX + (xD / (R + 1.0));
            } else {
                if (m_SOL === Infinity) {
                    currentY = xB;
                } else {
                     currentY = m_SOL * currentX + c_SOL_term; // y = m*x + c' where c' = y1 - m*x1
                }
            }

            this.zoomableGroup.append("line").attr("class", "plate-step")
                .attr("x1", this.xScale(currentX)).attr("y1", this.yScale(prevY_V))
                .attr("x2", this.xScale(currentX)).attr("y2", this.yScale(currentY))
                .attr("stroke", this.colors.plateStep).attr("stroke-width", 0.5);

            if (currentY <= xB + 1e-6 && currentX <= xB + 1e-5) break;
        }
        this.numberOfTheoreticalPlates = plates;
    }

    drawKeyPoints() {
        if (!this.zoomableGroup || !this.xScale || !this.yScale || this.errorMessage) return;
        const keyPointsData = [];
        if (this.distillateComposition !== null) keyPointsData.push({ x: this.distillateComposition, y: this.distillateComposition, label: "xD", color: this.colors.rol });
        if (this.bottomsComposition !== null) keyPointsData.push({ x: this.bottomsComposition, y: this.bottomsComposition, label: "xB", color: this.colors.sol });
        if (this.feedComposition !== null) keyPointsData.push({ x: this.feedComposition, y: this.feedComposition, label: "zF", color: this.colors.qLine });
        if (this.operatingLinesIntersection && isFinite(this.operatingLinesIntersection.x) && isFinite(this.operatingLinesIntersection.y)) {
            keyPointsData.push({ x: this.operatingLinesIntersection.x, y: this.operatingLinesIntersection.y, label: "Intersection", color: this.colors.keyPoints });
        }

        const keyPointsGroup = this.zoomableGroup.select(".key-points-group");
        keyPointsGroup.selectAll("circle").remove();
        keyPointsGroup.selectAll("circle").data(keyPointsData).enter().append("circle")
            .attr("cx", d => this.xScale(d.x))
            .attr("cy", d => this.yScale(d.y))
            .attr("r", 5)
            .attr("fill", d => d.color)
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .style("opacity", 0.8);
    }

    calculateFlowRatesAndLoads() {
        this.distillateFlowRate = null; this.bottomsFlowRate = null;
        this.condenserLoadFactor = null; this.reboilerLoadFactor = null;
        this.refluxRatioToMinRefluxRatio = null;

        const F = this.feedRate; const zF = this.feedComposition;
        const xD = this.distillateComposition; const xB = this.bottomsComposition;

        if (Math.abs(xD - xB) < 1e-6) {
            this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "xD and xB are too close for flow rate calculation.";
            return;
        }
        let D_calc = F * (zF - xB) / (xD - xB);
        let B_calc = F - D_calc;

        if (D_calc < 0) { D_calc = 0; B_calc = F; }
        if (B_calc < 0) { B_calc = 0; D_calc = F; }
        if (D_calc > F) { D_calc = F; B_calc = 0; }
        if (B_calc > F) { B_calc = F; D_calc = 0; }

        if ( (F * (zF - xB) / (xD - xB)) < -1e-6 || (F - (F * (zF - xB) / (xD - xB))) < -1e-6 ) {
             this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Calculated D or B is negative. Check zF relative to xD and xB.";
             this.distillateFlowRate = NaN; this.bottomsFlowRate = NaN; return;
        }

        this.distillateFlowRate = D_calc;
        this.bottomsFlowRate = B_calc;

        const L = this.actualRefluxRatio * this.distillateFlowRate;
        const V = L + this.distillateFlowRate;
        this.condenserLoadFactor = V;

        const L_bar = L + this.qValue * F;
        const V_bar = L_bar - this.bottomsFlowRate;
        this.reboilerLoadFactor = V_bar;

        if (this.minimumRefluxRatio !== null && isFinite(this.minimumRefluxRatio)) {
            if (Math.abs(this.minimumRefluxRatio) < 1e-6) {
                this.refluxRatioToMinRefluxRatio = (Math.abs(this.actualRefluxRatio) < 1e-6) ? 1.0 : Infinity;
            } else {
                this.refluxRatioToMinRefluxRatio = this.actualRefluxRatio / this.minimumRefluxRatio;
            }
        }
    }

    calculateAndDraw() {
        this.errorMessage = null;

        const stageDataContainer = document.getElementById('stageDataTableContainer');
        if (stageDataContainer && stageDataContainer.style.display !== 'none') {
            stageDataContainer.style.display = 'none';
            const btn = document.getElementById('toggleStageDataButton');
            if (btn) btn.textContent = 'Show Stage-by-Stage Data';
        }

        // Input Validation
        if (this.feedRate <= 0) { this.errorMessage = "Feed rate (F) must be positive."; }
        else if (this.distillateComposition <= this.bottomsComposition + 1e-6) { this.errorMessage = "Distillate composition (xD) must be greater than bottoms composition (xB)."; }
        else if (this.feedComposition < this.bottomsComposition - 1e-6 || this.feedComposition > this.distillateComposition + 1e-6 ) { this.errorMessage = "Feed composition (zF) must be between xB and xD."; }
        else if (this.refluxRatio < 0) { this.errorMessage = "Reflux ratio (R) must be non-negative."; }
        else if (this.relativeVolatility <= 1.0 && Math.abs(this.distillateComposition - this.bottomsComposition) > 1e-6 ) {
             this.errorMessage = "Relative volatility (α) must be > 1 for separation (unless xD=zF=xB).";
        } else if (this.relativeVolatility <=0) {
             this.errorMessage = "Relative volatility (α) must be positive.";
        }

        if (this.errorMessage) {
            this.updateResultsDisplay();
            if (this.zoomableGroup) this.zoomableGroup.selectAll("*").remove();
            else if (this.svg) this.svg.selectAll("*").remove();
            return;
        }

        this.actualRefluxRatio = this.refluxRatio;

        this.calculateMinimumRefluxRatio();
        if (this.errorMessage) { this.updateResultsDisplay(); if (this.zoomableGroup) this.zoomableGroup.selectAll("*").remove(); else if (this.svg) this.svg.selectAll("*").remove(); return; }

        this.calculateFlowRatesAndLoads();
        if (this.errorMessage) { this.updateResultsDisplay(); if (this.zoomableGroup) this.zoomableGroup.selectAll("*").remove(); else if (this.svg) this.svg.selectAll("*").remove(); return; }

        this.calculateOperatingLinesIntersection();
        if (this.errorMessage) { this.updateResultsDisplay(); if (this.zoomableGroup) this.zoomableGroup.selectAll("*").remove(); else if (this.svg) this.svg.selectAll("*").remove(); return; }

        if (!this.zoomableGroup || this.width <= 0 || this.height <= 0) {
            this.setupVisualization();
            if (!this.zoomableGroup || this.width <= 0 || this.height <= 0) {
                this.errorMessage = "Diagram container error or not ready for drawing.";
                this.updateResultsDisplay();
                return;
            }
        }

        // Clear dynamic elements from zoomableGroup before redrawing
        if (this.zoomableGroup) {
             this.zoomableGroup.selectAll(".equilibrium-curve, .operating-line, .q-line, .plate-step, .key-points-group > *").remove();
             // Grid is handled by drawGrid itself (it also clears existing)
        }

        this.drawGrid();
        this.drawEquilibriumCurve();
        this.drawOperatingLines();
        this.drawTheoreticalPlates();
        this.drawKeyPoints();
        this.updateResultsDisplay();
        this.updateLegend();
    }

    updateResultsDisplay() {
        const resultsDiv = document.querySelector('.results-grid');
        if (!resultsDiv) return;
        resultsDiv.innerHTML = '';

        if (this.errorMessage) {
            resultsDiv.innerHTML = `<div class="error-message" style="color:var(--error-color);grid-column:1/-1; font-weight:bold;">Error: ${this.errorMessage}</div>`;
            return;
        }

        function createResultItem(label, value, unit = '') {
            const item = document.createElement('div');
            item.innerHTML = `<strong>${label}:</strong> ${value} ${unit}`;
            return item;
        }

        resultsDiv.appendChild(createResultItem('Feed Rate (F)', this.feedRate.toFixed(2), 'mol/hr'));
        resultsDiv.appendChild(createResultItem('Feed Comp. (z<sub>F</sub>)', this.feedComposition.toFixed(2)));
        resultsDiv.appendChild(createResultItem('Feed Cond. (q)', this.qValue.toFixed(1)));
        resultsDiv.appendChild(createResultItem('Dist. Comp. (x<sub>D</sub>)', this.distillateComposition.toFixed(2)));
        resultsDiv.appendChild(createResultItem('Bott. Comp. (x<sub>B</sub>)', this.bottomsComposition.toFixed(2)));
        resultsDiv.appendChild(createResultItem('Rel. Vol. (α)', this.relativeVolatility.toFixed(2)));
        resultsDiv.appendChild(createResultItem('Reflux Ratio (R)', this.actualRefluxRatio.toFixed(2)));

        let rMinValueText = 'N/A';
        if (this.minimumRefluxRatio !== null) {
            if (isFinite(this.minimumRefluxRatio) && !isNaN(this.minimumRefluxRatio)) {
                rMinValueText = this.minimumRefluxRatio.toFixed(2);
            } else if (this.minimumRefluxRatio === Infinity) {
                rMinValueText = 'Infinity';
            }
        }
        resultsDiv.appendChild(createResultItem('Min. Reflux (R<sub>min</sub>)', rMinValueText));

        resultsDiv.appendChild(createResultItem('Distillate Rate (D)', (this.distillateFlowRate !== null && !isNaN(this.distillateFlowRate)) ? this.distillateFlowRate.toFixed(2) : 'N/A', (this.distillateFlowRate !== null && !isNaN(this.distillateFlowRate)) ? 'mol/hr' : ''));
        resultsDiv.appendChild(createResultItem('Bottoms Rate (B)', (this.bottomsFlowRate !== null && !isNaN(this.bottomsFlowRate)) ? this.bottomsFlowRate.toFixed(2) : 'N/A', (this.bottomsFlowRate !== null && !isNaN(this.bottomsFlowRate)) ? 'mol/hr' : ''));
        resultsDiv.appendChild(createResultItem('Condenser Load Factor', (this.condenserLoadFactor !== null && !isNaN(this.condenserLoadFactor)) ? this.condenserLoadFactor.toFixed(2) : 'N/A', (this.condenserLoadFactor !== null && !isNaN(this.condenserLoadFactor)) ? '(rel. units)' : ''));
        resultsDiv.appendChild(createResultItem('Reboiler Load Factor', (this.reboilerLoadFactor !== null && !isNaN(this.reboilerLoadFactor)) ? this.reboilerLoadFactor.toFixed(2) : 'N/A', (this.reboilerLoadFactor !== null && !isNaN(this.reboilerLoadFactor)) ? '(rel. units)' : ''));

        let rToRminText = 'N/A';
        if (this.refluxRatioToMinRefluxRatio === Infinity) {
            rToRminText = 'Infinity (R<sub>min</sub> ≈ 0)';
        } else if (this.refluxRatioToMinRefluxRatio !== null && !isNaN(this.refluxRatioToMinRefluxRatio) && isFinite(this.refluxRatioToMinRefluxRatio)) {
            rToRminText = this.refluxRatioToMinRefluxRatio.toFixed(2);
        }
        resultsDiv.appendChild(createResultItem('R/R<sub>min</sub> Ratio', rToRminText));

        resultsDiv.appendChild(createResultItem('Total Plates (N<sub>total</sub>)', this.numberOfTheoreticalPlates !== null ? this.numberOfTheoreticalPlates : 'N/A'));
        resultsDiv.appendChild(createResultItem('Feed Plate # (N<sub>feed</sub>)', (this.feedPlateLocation !== null && this.feedPlateLocation > 0) ? this.feedPlateLocation : 'N/A'));

        if (window.MathJax) {
            window.MathJax.typesetPromise([resultsDiv]).catch(err => console.error('MathJax typeset error in results:', err.message));
        }
    }

    updateLegend() { /* ... same as before ... */ const lD=document.querySelector('.visualization-panel .legend');if(!lD)return;lD.innerHTML='';const lI=[{label:"Equilibrium Curve",color:this.colors.equilibrium,class:"legend-eq"},{label:"y = x Line",color:this.colors.yEqualsX,class:"legend-diag"},{label:"Rectifying Op. Line",color:this.colors.rol,class:"legend-rol"},{label:"Stripping Op. Line",color:this.colors.sol,class:"legend-sol"},{label:"q-Line",color:this.colors.qLine,class:"legend-qline"},{label:"Plate Steps",color:this.colors.plateStep,class:"legend-plates"},{label:"Key Points",color:this.colors.keyPoints,class:"legend-keypoints"}];const sId='dynamic-legend-styles';let sS=document.getElementById(sId);if(!sS){sS=document.createElement('style');sS.id=sId;document.head.appendChild(sS)}let cR="";lI.forEach(i=>{const s=document.createElement('span');s.classList.add(i.class);s.textContent=i.label;s.dataset.color=i.color;lD.appendChild(s);cR+=`.${i.class}::before { background-color: ${i.color} !important; content: ''; width: 12px; height: 12px; border: 1px solid #ccc; display: inline-block; margin-right: 5px; vertical-align: middle; border-radius: 2px; }\n`});sS.innerHTML=cR}
    handleResize() { if(document.getElementById('simulator-content').classList.contains('active')){this.setupVisualization();this.calculateAndDraw()}}
    exportToSVG() { /* ... same as before ... */ if(!this.svg){alert("No diagram to export.");return}try{const S=this.svg.node().closest("svg");if(!S){alert("SVG element not found.");return}let s=new XMLSerializer().serializeToString(S);const b=new Blob([s],{type:"image/svg+xml;charset=utf-8"}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","mccabe_thiele_diagram.svg");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}catch(e){console.error("SVG Export Error:",e);alert("Error exporting SVG.")}}
    exportToPNG() { /* ... same as before ... */ if(!this.svg){alert("No diagram to export.");return}try{const sE=this.svg.node().closest("svg");if(!sE){alert("SVG element not found.");return}const sCW=sE.clientWidth,sCH=sE.clientHeight;const sS=new XMLSerializer().serializeToString(sE),sB=new Blob([sS],{type:'image/svg+xml;charset=utf-8'}),sU=URL.createObjectURL(sB);const i=new Image;i.onload=()=>{const c=document.createElement('canvas'),sF=window.devicePixelRatio||1;c.width=sCW*sF;c.height=sCH*sF;const x=c.getContext('2d');x.scale(sF,sF);x.fillStyle='white';x.fillRect(0,0,sCW,sCH);x.drawImage(i,0,0,sCW,sCH);URL.revokeObjectURL(sU);const pU=c.toDataURL('image/png'),l=document.createElement('a');l.download='mccabe_thiele_diagram.png';l.href=pU;document.body.appendChild(l);l.click();document.body.removeChild(l)};i.onerror=e=>{console.error("PNG Export: Image load error",e);alert("Error loading SVG for PNG export.");URL.revokeObjectURL(sU)};i.src=sU}catch(e){console.error("PNG Export Error:",e);alert("Error exporting PNG.")}}
    exportToCSV() { /* ... same as before ... */ if(this.errorMessage){alert(`Cannot export data due to error: ${this.errorMessage}`);return}if(this.minimumRefluxRatio===null&&this.numberOfTheoreticalPlates===null&&this.distillateFlowRate===null){alert("No calculation results to export.");return}let C="Parameter,Value,Unit\n";const D=[["Feed Rate (F)",this.feedRate.toFixed(2),"mol/hr"],["Feed Comp. (zF)",this.feedComposition.toFixed(2),""],["Feed Cond. (q)",this.qValue.toFixed(1),""],["Distillate Comp. (xD)",this.distillateComposition.toFixed(2),""],["Bottoms Comp. (xB)",this.bottomsComposition.toFixed(2),""],["Rel. Vol. (alpha)",this.relativeVolatility.toFixed(2),""],["Actual Reflux (R)",this.actualRefluxRatio.toFixed(2),""],["Min. Reflux (Rmin)",this.minimumRefluxRatio!==null&&isFinite(this.minimumRefluxRatio)?this.minimumRefluxRatio.toFixed(2):this.minimumRefluxRatio===Infinity?"Infinity":"N/A",""],["Distillate Flow Rate (D)",this.distillateFlowRate!==null&&!isNaN(this.distillateFlowRate)?this.distillateFlowRate.toFixed(2):"N/A","mol/hr"],["Bottoms Flow Rate (B)",this.bottomsFlowRate!==null&&!isNaN(this.bottomsFlowRate)?this.bottomsFlowRate.toFixed(2):"N/A","mol/hr"],["Condenser Load Factor",this.condenserLoadFactor!==null&&!isNaN(this.condenserLoadFactor)?this.condenserLoadFactor.toFixed(2):"N/A","(rel. units)"],["Reboiler Load Factor",this.reboilerLoadFactor!==null&&!isNaN(this.reboilerLoadFactor)?this.reboilerLoadFactor.toFixed(2):"N/A","(rel. units)"],["R/Rmin Ratio",this.refluxRatioToMinRefluxRatio===Infinity?"Infinity (Rmin approx 0)":this.refluxRatioToMinRefluxRatio!==null&&!isNaN(this.refluxRatioToMinRefluxRatio)?this.refluxRatioToMinRefluxRatio.toFixed(2):"N/A",""],["Total Theoretical Plates (Ntotal)",this.numberOfTheoreticalPlates!==null?this.numberOfTheoreticalPlates:"N/A",""],["Feed Plate Location (Nfeed)",this.feedPlateLocation!==null&&this.feedPlateLocation>0?this.feedPlateLocation:"N/A","from top"]];D.forEach(r=>{C+=r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")+"\n"});const b=new Blob([C],{type:'text/csv;charset=utf-8;'}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","distillation_simulation_data.csv");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}
    toggleStageDataDisplay() { const c=document.getElementById('stageDataTableContainer'),b=document.getElementById('toggleStageDataButton');if(!c||!b)return;if(c.style.display==='none'){if(this.stageData&&this.stageData.length>0&&!this.errorMessage){this.populateStageDataTable();c.style.display='block';b.textContent='Hide Stage-by-Stage Data'}else if(this.errorMessage)alert("Cannot show stage data due to existing calculation error.");else alert("No stage data available. Run a valid simulation first.")}else{c.style.display='none';b.textContent='Show Stage-by-Stage Data'}}
    populateStageDataTable() { const tB=document.getElementById('stageDataTable')?.querySelector('tbody');if(!tB)return;tB.innerHTML='';this.stageData.forEach(d=>{const r=tB.insertRow(),cS=r.insertCell(),cX=r.insertCell(),cY=r.insertCell();cS.textContent=d.stage;cX.textContent=d.x.toFixed(4);cY.textContent=d.y.toFixed(4)})}
}

document.addEventListener('DOMContentLoaded', () => {
    window.distillationSimulator = new ProfessionalDistillationSimulator();
});
