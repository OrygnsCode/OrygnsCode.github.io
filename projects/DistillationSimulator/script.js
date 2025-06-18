// projects/DistillationSimulator/script.js

class ProfessionalDistillationSimulator {
    constructor() {
        this.feedRate = 100;
        this.feedComposition = 0.5;
        this.qValue = 1.0;
        this.refluxRatio = 1.5;
        this.distillateComposition = 0.95;
        this.bottomsComposition = 0.05;
        this.relativeVolatility = 2.5;

        this.minimumRefluxRatio = null;
        this.actualRefluxRatio = this.refluxRatio;
        this.numberOfTheoreticalPlates = null;
        this.feedPlateLocation = null;
        this.operatingLinesIntersection = { x: null, y: null };
        this.errorMessage = null;
        this.tooltipElement = null; // Added for tooltip

        this.componentData = { /* ... existing component data ... */
            "benzene-toluene": { name: "Benzene-Toluene", alpha_A_B: 2.4, antoine_A: { A: 6.90565, B: 1211.033, C: 220.79 }, antoine_B: { A: 6.95464, B: 1344.800, C: 219.482 } },
            "ethanol-water": { name: "Ethanol-Water", alpha_A_B: 2.8, antoine_A: { A: 8.20417, B: 1642.89, C: 230.30 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "methanol-water": { name: "Methanol-Water", alpha_A_B: 3.5, antoine_A: { A: 8.08097, B: 1582.271, C: 239.726 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "aceticacid-water": { name: "Acetic Acid-Water", alpha_A_B: 2.0, antoine_A: { A: 7.5732, B: 1567.45, C: 225.0 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } }
        };
        this.currentComponentSystem = "benzene-toluene";

        this.svg = null; this.xScale = null; this.yScale = null;
        this.width = 0; this.height = 0;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };

        this.colors = { /* ... existing colors ... */
            equilibrium: "var(--primary-color)", yEqualsX: "grey", rol: "var(--accent-color)",
            sol: "var(--success-color)", qLine: "purple", plateStep: "rgba(0, 0, 0, 0.6)",
            keyPoints: "red", axisText: "var(--text-color)"
        };
        this.init();
    }

    init() {
        this.populateComponentSelector();
        this.setupTabs();
        this.setupEventListeners();
        this.setupTooltips(); // Call new method
        if (this.componentData[this.currentComponentSystem]) {
            this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B;
        }
        this.syncInputsToUI();
        this.setupVisualization();
        this.updateComponentDataUI();
        this.calculateAndDraw();
        if (window.MathJax) window.MathJax.typesetPromise();
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
                if (e.key === 'Escape') this.hideTooltip();
            });
        });
    }

    showTooltip(event) {
        const icon = event.currentTarget;
        const tooltipText = icon.dataset.tooltip;

        if (!tooltipText || !this.tooltipElement) return;

        this.tooltipElement.textContent = tooltipText;
        this.tooltipElement.classList.add('visible');

        const iconRect = icon.getBoundingClientRect();
        // Must get tooltipRect *after* content is set and it's made visible (even if opacity 0) to get correct dimensions
        // Temporarily make it visible but off-screen to measure
        this.tooltipElement.style.visibility = 'visible';
        this.tooltipElement.style.opacity = '0';      // Keep it invisible for measurement
        this.tooltipElement.style.top = '-9999px';    // Move off-screen
        this.tooltipElement.style.left = '-9999px';

        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        let top = iconRect.top + window.scrollY - tooltipRect.height - 8; // 8px offset above
        let left = iconRect.left + window.scrollX + (iconRect.width / 2) - (tooltipRect.width / 2);

        if (top < window.scrollY) { // If tooltip goes above viewport top (considering scroll)
            top = iconRect.bottom + window.scrollY + 8; // Flip below
        }
        if (left < window.scrollX) left = window.scrollX + 5; // Adjust left if off-screen
        if (left + tooltipRect.width > window.scrollX + window.innerWidth) {
            left = window.scrollX + window.innerWidth - tooltipRect.width - 5; // Adjust right if off-screen
        }

        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.opacity = '1'; // Now make it fully visible with transition
    }

    hideTooltip() {
        if (!this.tooltipElement) return;
        this.tooltipElement.classList.remove('visible');
        // Opacity transition will take care of fading out. Visibility is handled by CSS transition delay.
    }

    // ... (rest of the methods: populateComponentSelector, syncInputsToUI, setupEventListeners, etc. remain largely the same)
    // Make sure to paste the minified/full versions of other methods here if they were omitted in the prompt
    // For brevity, I'm assuming the other methods are present and correct as per previous steps.
    // The following are stubs for methods that were minified in previous prompts, ensure full versions are used.
    populateComponentSelector() { /* ... full version ... */
        const selectElement = document.getElementById('component-select');
        if (!selectElement) return;
        selectElement.innerHTML = '';
        for (const key in this.componentData) {
            const option = document.createElement('option');
            option.value = key; option.textContent = this.componentData[key].name;
            selectElement.appendChild(option);
        }
        const customOption = document.createElement('option');
        customOption.value = "custom"; customOption.textContent = "Custom Alpha";
        selectElement.appendChild(customOption);
        selectElement.value = this.currentComponentSystem;
    }
    syncInputsToUI() { /* ... full version ... */
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
    }
    setupEventListeners() { /* ... full version including export listeners ... */
        const ids = ['feedRate', 'feedComposition', 'qValue', 'distillateComposition', 'bottomsComposition', 'refluxRatio', 'relativeVolatility'];
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    if (this.hasOwnProperty(id)) { this[id] = parseFloat(e.target.value); }
                    if (document.getElementById(id + 'Value')) { document.getElementById(id + 'Value').textContent = parseFloat(e.target.value).toFixed(2); }
                    this.calculateAndDraw();
                });
            }
        });
        document.getElementById('component-select').addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            if (selectedValue === "custom") {
                this.currentComponentSystem = "custom";
                this.relativeVolatility = parseFloat(document.getElementById('relativeVolatility').value);
                document.getElementById('relativeVolatility').focus();
            } else {
                this.currentComponentSystem = selectedValue;
                if (this.componentData[this.currentComponentSystem] && typeof this.componentData[this.currentComponentSystem].alpha_A_B !== 'undefined') {
                    this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B;
                    document.getElementById('relativeVolatility').value = this.relativeVolatility.toFixed(2);
                } else { console.warn(`System ${this.currentComponentSystem} has no alpha_A_B defined.`);}
            }
            this.updateComponentDataUI(); this.calculateAndDraw();
        });
        window.addEventListener('resize', this.handleResize.bind(this));
        const exportSVGBtn = document.getElementById('exportSVGButton'); if (exportSVGBtn) exportSVGBtn.addEventListener('click', () => this.exportToSVG());
        const exportPNGBtn = document.getElementById('exportPNGButton'); if (exportPNGBtn) exportPNGBtn.addEventListener('click', () => this.exportToPNG());
        const exportCSVBtn = document.getElementById('exportCSVButton'); if (exportCSVBtn) exportCSVBtn.addEventListener('click', () => this.exportToCSV());
    }
    setupTabs() { /* ... full version ... */
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(button.dataset.tab + '-content').classList.add('active');
                if (button.dataset.tab === 'theory' && window.MathJax) { setTimeout(() => { window.MathJax.typesetPromise([document.getElementById('theory-content')]).catch(err => console.error('MathJax typeset error:', err)); }, 0); }
                if (button.dataset.tab === 'simulator') { this.handleResize(); }
            });
        });
    }
    updateComponentDataUI() { /* ... full version ... */
        const systemKey = this.currentComponentSystem;
        const propertiesDiv = document.getElementById('system-properties');
        if (!propertiesDiv) return;
        if (systemKey === "custom" || !this.componentData[systemKey]) {
            propertiesDiv.innerHTML = `<h4>Custom System</h4><p>Relative Volatility (α) is set manually.</p><p>Current α: ${parseFloat(document.getElementById('relativeVolatility').value).toFixed(2)}</p>`;
        } else {
            const system = this.componentData[systemKey];
            propertiesDiv.innerHTML = `<h4>${system.name}</h4><p>Rel. Vol. (α<sub>A-B</sub>): ${system.alpha_A_B.toFixed(2)}</p>${system.antoine_A ? `<p>Comp A Antoine: A=${system.antoine_A.A}, B=${system.antoine_A.B}, C=${system.antoine_A.C}</p>` : ''}${system.antoine_B ? `<p>Comp B Antoine: A=${system.antoine_B.A}, B=${system.antoine_B.B}, C=${system.antoine_B.C}</p>` : ''}${system.name === "Ethanol-Water" ? "<p><small>Note: Non-ideal system; alpha is simplified.</small></p>" : ""}`;
        }
         if (window.MathJax) { window.MathJax.typesetPromise([propertiesDiv]).catch(err => console.error('MathJax error:', err));}
    }
    calculateEquilibrium(x_A) { /* ... full version ... */ return (this.relativeVolatility === 1.0) ? x_A : (this.relativeVolatility * x_A) / (1.0 + (this.relativeVolatility - 1.0) * x_A); }
    findXForYOnEquilibrium(y_A) { /* ... full version ... */ if (this.relativeVolatility === 1.0) return y_A; if (y_A <= 0) return 0.0; if (y_A >= 1.0) return 1.0; let d = this.relativeVolatility - y_A * (this.relativeVolatility - 1.0); return (Math.abs(d) < 1e-9) ? (y_A > 0.5 ? 1.0 : 0.0) : Math.max(0.0, Math.min(1.0, y_A / d)); }
    calculateOperatingLinesIntersection() { /* ... full version ... */ const R=this.refluxRatio,xD=this.distillateComposition,zF=this.feedComposition,q=this.qValue;let x,y;const mR=R/(R+1),cR=xD/(R+1);if(Math.abs(q-1)<1e-6){x=zF;y=mR*x+cR}else if(Math.abs(q)<1e-6){y=zF;if(Math.abs(mR)<1e-9){x=Math.abs(y-cR)<1e-6?zF:null;if(x==null)this.errorMessage="ROL horizontal, not equal to q-line."}else x=(y-cR)/mR}else{const mQ=q/(q-1),cQ=zF-mQ*zF;if(Math.abs(mR-mQ)<1e-9){x=zF;y=mR*x+cR;this.errorMessage="ROL/q-line parallel."}else{x=(cQ-cR)/(mR-mQ);y=mR*x+cR}}if(x==null||y==null){}else this.operatingLinesIntersection={x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))}}
    calculateMinimumRefluxRatio() { /* ... full version ... */ const zF=this.feedComposition,xD=this.distillateComposition,q=this.qValue,a=this.relativeVolatility;let xQ,yQ;if(Math.abs(q-1)<1e-6){xQ=zF;yQ=this.calculateEquilibrium(xQ)}else if(Math.abs(q)<1e-6){yQ=zF;xQ=this.findXForYOnEquilibrium(yQ)}else{const mQ=q/(q-1),K1=mQ,K2=zF-mQ*zF,aQ=K1*(a-1),bQ=K1+K2*(a-1)-a,cQ=K2;if(Math.abs(aQ)<1e-9){if(Math.abs(bQ)<1e-9){xQ=zF;if(Math.abs(K2)>1e-9){this.errorMessage="Rmin: q-line/eq intersection fail (lin case).";this.minimumRefluxRatio=Infinity;return}}else xQ=-cQ/bQ}else{const D=bQ*bQ-4*aQ*cQ;if(D<0){this.errorMessage="Rmin: No real q-line/eq intersection.";this.minimumRefluxRatio=Infinity;return}const x1=(-bQ+Math.sqrt(D))/(2*aQ),x2=(-bQ-Math.sqrt(D))/(2*aQ);if(x1>=0&&x1<=1&&(!(x2>=0&&x2<=1)||Math.abs(x1-zF)<Math.abs(x2-zF)))xQ=x1;else if(x2>=0&&x2<=1)xQ=x2;else{this.errorMessage="Rmin: q-line/eq intersection out of bounds.";this.minimumRefluxRatio=Infinity;return}}yQ=this.calculateEquilibrium(xQ)}if(Math.abs(xD-xQ)<1e-9){this.minimumRefluxRatio=Infinity;return}const mRmin=(xD-yQ)/(xD-xQ);if(mRmin>=1||Math.abs(1-mRmin)<1e-9)this.minimumRefluxRatio=Infinity;else if(mRmin<0)this.minimumRefluxRatio=0;else this.minimumRefluxRatio=mRmin/(1-mRmin);if(this.minimumRefluxRatio<0)this.minimumRefluxRatio=0}
    setupVisualization() { /* ... full version ... */
        const container = document.getElementById('mccabe-thiele-diagram'); if (!container) return;
        this.width = container.clientWidth - this.margin.left - this.margin.right; this.height = container.clientHeight - this.margin.top - this.margin.bottom;
        d3.select(container).select("svg").remove(); this.svg = d3.select(container).append("svg").attr("width", this.width + this.margin.left + this.margin.right).attr("height", this.height + this.margin.top + this.margin.bottom).append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`);
        if (this.width <= 0 || this.height <= 0) { console.error("SVG dimensions invalid."); return; }
        this.xScale = d3.scaleLinear().domain([0, 1]).range([0, this.width]); this.yScale = d3.scaleLinear().domain([0, 1]).range([this.height, 0]);
        this.svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${this.height})`).call(d3.axisBottom(this.xScale)).selectAll("text").style("fill", this.colors.axisText);
        this.svg.append("g").attr("class", "y-axis").call(d3.axisLeft(this.yScale)).selectAll("text").style("fill", this.colors.axisText);
        this.svg.append("text").attr("text-anchor","middle").attr("x",this.width/2).attr("y",this.height+this.margin.bottom-10).text("Liquid Mole Fraction (x)").style("fill",this.colors.axisText);
        this.svg.append("text").attr("text-anchor","middle").attr("transform","rotate(-90)").attr("y",-this.margin.left+20).attr("x",-this.height/2).text("Vapor Mole Fraction (y)").style("fill",this.colors.axisText);
        this.svg.append("line").attr("class","diagonal-line").attr("x1",this.xScale(0)).attr("y1",this.yScale(0)).attr("x2",this.xScale(1)).attr("y2",this.yScale(1)).attr("stroke",this.colors.yEqualsX).attr("stroke-dasharray","2,2");
        this.svg.append("g").attr("class", "key-points-group");
    }
    drawEquilibriumCurve() { /* ... full version ... */ if(!this.svg||!this.xScale)this.setupVisualization();if(!this.svg||!this.xScale)return;this.svg.selectAll(".equilibrium-curve").remove();const L=d3.line().x(d=>this.xScale(d.x)).y(d=>this.yScale(d.y));const P=[];for(let i=0;i<=100;i++){let x=i/100;P.push({x:x,y:this.calculateEquilibrium(x)})}this.svg.append("path").datum(P).attr("class","equilibrium-curve").attr("fill","none").attr("stroke",this.colors.equilibrium).attr("stroke-width",2).attr("d",L)}
    drawOperatingLines() { /* ... full version ... */ if(!this.svg||!this.xScale||this.operatingLinesIntersection.x===null)return;this.svg.selectAll(".q-line, .rol-line, .sol-line").remove();const{x:xi,y:yi}=this.operatingLinesIntersection;const zF=this.feedComposition,xD=this.distillateComposition,xB=this.bottomsComposition;this.svg.append("line").attr("class","q-line").attr("x1",this.xScale(zF)).attr("y1",this.yScale(zF)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.qLine).attr("stroke-dasharray","4,2").attr("stroke-width",1.5);this.svg.append("line").attr("class","rol-line").attr("x1",this.xScale(xD)).attr("y1",this.yScale(xD)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.rol).attr("stroke-width",1.5);this.svg.append("line").attr("class","sol-line").attr("x1",this.xScale(xB)).attr("y1",this.yScale(xB)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.sol).attr("stroke-width",1.5)}
    drawTheoreticalPlates() { /* ... full version ... */ if(!this.svg||!this.xScale||this.operatingLinesIntersection.x===null)return;this.svg.selectAll(".plate-step").remove();this.feedPlateLocation=0;let p=0,cX=this.distillateComposition,cY=this.distillateComposition;const R=this.actualRefluxRatio,xD=this.distillateComposition,xB=this.bottomsComposition,{x:xi,y:yi}=this.operatingLinesIntersection;let mS,cS;if(Math.abs(xi-xB)<1e-9){mS=Infinity;cS=xB}else{mS=(yi-xB)/(xi-xB);cS=xB-mS*xB}while(cX>xB+1e-6&&cY>xB+1e-6&&p<50){p++;let pX=cX;cX=this.findXForYOnEquilibrium(cY);this.svg.append("line").attr("class","plate-step").attr("x1",this.xScale(pX)).attr("y1",this.yScale(cY)).attr("x2",this.xScale(cX)).attr("y2",this.yScale(cY)).attr("stroke",this.colors.plateStep).attr("stroke-width",.5);if(cX<=xB+1e-6)break;let pY=cY;if(this.feedPlateLocation===0&&cX<xi+1e-6&&cY>yi-1e-6)this.feedPlateLocation=p;if(this.feedPlateLocation===0||cX>=xi-1e-6)cY=R/(R+1)*cX+xD/(R+1);else{if(mS===Infinity)cY=xB;else cY=mS*cX+cS}this.svg.append("line").attr("class","plate-step").attr("x1",this.xScale(cX)).attr("y1",this.yScale(pY)).attr("x2",this.xScale(cX)).attr("y2",this.yScale(cY)).attr("stroke",this.colors.plateStep).attr("stroke-width",.5);if(cY<=xB+1e-6)break}this.numberOfTheoreticalPlates=p}
    drawKeyPoints() { /* ... full version ... */ if(!this.svg||!this.xScale||this.errorMessage)return;const kPD=[];if(this.distillateComposition!==null)kPD.push({x:this.distillateComposition,y:this.distillateComposition,l:"xD",c:this.colors.rol});if(this.bottomsComposition!==null)kPD.push({x:this.bottomsComposition,y:this.bottomsComposition,l:"xB",c:this.colors.sol});if(this.feedComposition!==null)kPD.push({x:this.feedComposition,y:this.feedComposition,l:"zF",c:this.colors.qLine});if(this.operatingLinesIntersection&&isFinite(this.operatingLinesIntersection.x)&&isFinite(this.operatingLinesIntersection.y))kPD.push({x:this.operatingLinesIntersection.x,y:this.operatingLinesIntersection.y,l:"Int",c:this.colors.keyPoints});const kPG=this.svg.select(".key-points-group");kPG.selectAll("circle").remove();kPG.selectAll("circle").data(kPD).enter().append("circle").attr("cx",d=>this.xScale(d.x)).attr("cy",d=>this.yScale(d.y)).attr("r",5).attr("fill",d=>d.c).attr("stroke","black").attr("stroke-width",.5).style("opacity",.8)}
    calculateAndDraw() { /* ... full version ... */
        this.errorMessage = null;
        if (this.svg) this.svg.selectAll(".plate-step, .q-line, .rol-line, .sol-line, .key-points-group circle").remove();
        else this.setupVisualization();
        if (this.distillateComposition <= this.bottomsComposition) { this.errorMessage = "xD must be > xB."; }
        else if (this.feedComposition < this.bottomsComposition || this.feedComposition > this.distillateComposition) { this.errorMessage = "zF must be between xB and xD."; }
        else if (this.refluxRatio < 0) { this.errorMessage = "Reflux ratio (R) must be non-negative."; }
        else if (this.relativeVolatility <= 0) { this.errorMessage = "Relative volatility (α) must be positive.";}
        if (this.errorMessage) { this.updateResultsDisplay(); return; }
        this.actualRefluxRatio = this.refluxRatio;
        this.calculateMinimumRefluxRatio(); if (this.errorMessage) { this.updateResultsDisplay(); return; }
        this.calculateOperatingLinesIntersection(); if (this.errorMessage) { this.updateResultsDisplay(); return; }
        if (!this.svg || this.width <= 0 || this.height <= 0) { this.setupVisualization(); if (this.width <= 0 || this.height <= 0) { this.errorMessage = "Diagram container error."; this.updateResultsDisplay(); return; }}
        this.drawEquilibriumCurve(); this.drawOperatingLines(); this.drawTheoreticalPlates(); this.drawKeyPoints();
        this.updateResultsDisplay(); this.updateLegend();
    }
    updateResultsDisplay() { /* ... full version ... */ const resultsDiv=document.querySelector('.results-grid');if(!resultsDiv)return;resultsDiv.innerHTML='';if(this.errorMessage){resultsDiv.innerHTML=`<div class="error-message" style="color:var(--error-color);grid-column:1/-1">${this.errorMessage}</div>`;return}function c(l,v,u=''){const i=document.createElement('div');i.innerHTML=`<strong>${l}:</strong> ${v} ${u}`;return i}resultsDiv.appendChild(c('Feed Rate (F)',this.feedRate.toFixed(2),'mol/hr'));resultsDiv.appendChild(c('Feed Comp. (z<sub>F</sub>)',this.feedComposition.toFixed(2)));resultsDiv.appendChild(c('Feed Cond. (q)',this.qValue.toFixed(2)));resultsDiv.appendChild(c('Dist. Comp. (x<sub>D</sub>)',this.distillateComposition.toFixed(2)));resultsDiv.appendChild(c('Bott. Comp. (x<sub>B</sub>)',this.bottomsComposition.toFixed(2)));resultsDiv.appendChild(c('Rel. Vol. (α)',this.relativeVolatility.toFixed(2)));resultsDiv.appendChild(c('Reflux Ratio (R)',this.actualRefluxRatio.toFixed(2)));let rMV='N/A';if(this.minimumRefluxRatio!==null){if(isFinite(this.minimumRefluxRatio)&&!isNaN(this.minimumRefluxRatio))rMV=this.minimumRefluxRatio.toFixed(2);else if(this.minimumRefluxRatio===Infinity)rMV='Infinity'}resultsDiv.appendChild(c('Min. Reflux (R<sub>min</sub>)',rMV));resultsDiv.appendChild(c('Total Plates (N<sub>total</sub>)',this.numberOfTheoreticalPlates!==null?this.numberOfTheoreticalPlates:'N/A'));resultsDiv.appendChild(c('Feed Plate # (N<sub>feed</sub>)',this.feedPlateLocation!==null&&this.feedPlateLocation>0?this.feedPlateLocation:'N/A'));if(window.MathJax){window.MathJax.typesetPromise([resultsDiv]).catch(e=>console.error('MathJax err: '+e.message))}}
    updateLegend() { /* ... full version ... */
        const legendDiv = document.querySelector('.visualization-panel .legend'); if (!legendDiv) return; legendDiv.innerHTML = '';
        const legendItems = [
            { label: "Equilibrium Curve", color: this.colors.equilibrium, class: "legend-eq" }, { label: "y = x Line", color: this.colors.yEqualsX, class: "legend-diag" },
            { label: "Rectifying Op. Line", color: this.colors.rol, class: "legend-rol" }, { label: "Stripping Op. Line", color: this.colors.sol, class: "legend-sol" },
            { label: "q-Line", color: this.colors.qLine, class: "legend-qline" }, { label: "Plate Steps", color: this.colors.plateStep, class: "legend-plates" },
            { label: "Key Points", color: this.colors.keyPoints, class: "legend-keypoints" }
        ];
        const styleSheetId = 'dynamic-legend-styles'; let styleSheet = document.getElementById(styleSheetId);
        if (!styleSheet) { styleSheet = document.createElement('style'); styleSheet.id = styleSheetId; document.head.appendChild(styleSheet); }
        let cssRules = "";
        legendItems.forEach(item => {
            const span = document.createElement('span'); span.classList.add(item.class); span.textContent = item.label;
            span.dataset.color = item.color; legendDiv.appendChild(span);
            cssRules += `.${item.class}::before { background-color: ${item.color} !important; content: ''; width: 12px; height: 12px; border: 1px solid #ccc; display: inline-block; margin-right: 5px; vertical-align: middle; }\n`;
        });
        styleSheet.innerHTML = cssRules;
    }
    handleResize() { /* ... full version ... */ if(document.getElementById('simulator-content').classList.contains('active')){this.setupVisualization();this.calculateAndDraw()}}
    exportToSVG() { /* ... full version ... */ if(!this.svg){alert("No diagram to export.");return}try{const S=this.svg.node().closest("svg");if(!S){alert("SVG element not found.");return}let s=new XMLSerializer().serializeToString(S);const b=new Blob([s],{type:"image/svg+xml;charset=utf-8"}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","mccabe_thiele_diagram.svg");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}catch(e){console.error("SVG Export Error:",e);alert("Error exporting SVG.")}}
    exportToPNG() { /* ... full version ... */ if(!this.svg){alert("No diagram to export.");return}try{const S=this.svg.node().closest("svg");if(!S){alert("SVG element not found.");return}const s=new XMLSerializer().serializeToString(S),b=new Blob([s],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(b);const i=new Image;i.onload=()=>{const c=document.createElement('canvas'),f=window.devicePixelRatio||1;c.width=S.clientWidth*f;c.height=S.clientHeight*f;const x=c.getContext('2d');x.scale(f,f);x.drawImage(i,0,0,S.clientWidth,S.clientHeight);URL.revokeObjectURL(u);const p=c.toDataURL('image/png'),l=document.createElement('a');l.download='mccabe_thiele_diagram.png';l.href=p;document.body.appendChild(l);l.click();document.body.removeChild(l)};i.onerror=e=>{console.error("PNG Export: Image load error",e);alert("Error loading SVG for PNG export.");URL.revokeObjectURL(u)};i.src=u}catch(e){console.error("PNG Export Error:",e);alert("Error exporting PNG.")}}
    exportToCSV() { /* ... full version ... */ if(this.errorMessage){alert(`Cannot export data: ${this.errorMessage}`);return}if(this.minimumRefluxRatio===null&&this.numberOfTheoreticalPlates===null){alert("No results to export.");return}let C="Parameter,Value,Unit\n";const D=[["Feed Rate (F)",this.feedRate.toFixed(2),"mol/hr"],["Feed Comp. (zF)",this.feedComposition.toFixed(2),""],["Feed Cond. (q)",this.qValue.toFixed(2),""],["Distillate Comp. (xD)",this.distillateComposition.toFixed(2),""],["Bottoms Comp. (xB)",this.bottomsComposition.toFixed(2),""],["Rel. Vol. (alpha)",this.relativeVolatility.toFixed(2),""],["Actual Reflux (R)",this.actualRefluxRatio.toFixed(2),""],["Min. Reflux (Rmin)",this.minimumRefluxRatio!==null&&isFinite(this.minimumRefluxRatio)?this.minimumRefluxRatio.toFixed(2):this.minimumRefluxRatio===Infinity?"Infinity":"N/A",""],["Total Plates (Ntotal)",this.numberOfTheoreticalPlates!==null?this.numberOfTheoreticalPlates:"N/A",""],["Feed Plate (Nfeed)",this.feedPlateLocation!==null&&this.feedPlateLocation>0?this.feedPlateLocation:"N/A","from top"]];D.forEach(r=>{C+=r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")+"\n"});const b=new Blob([C],{type:'text/csv;charset=utf-8;'}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","distillation_simulation_data.csv");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}
}

document.addEventListener('DOMContentLoaded', () => {
    window.distillationSimulator = new ProfessionalDistillationSimulator();
});
