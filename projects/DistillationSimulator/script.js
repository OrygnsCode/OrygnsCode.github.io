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
        this.tooltipElement = null; 
        this.stageData = [];

        // New properties for D, B, loads, R/Rmin
        this.distillateFlowRate = null; 
        this.bottomsFlowRate = null;    
        this.condenserLoadFactor = null; 
        this.reboilerLoadFactor = null;  
        this.refluxRatioToMinRefluxRatio = null; 

        this.componentData = { /* ... */ 
            "benzene-toluene": { name: "Benzene-Toluene", alpha_A_B: 2.4, antoine_A: { A: 6.90565, B: 1211.033, C: 220.79 }, antoine_B: { A: 6.95464, B: 1344.800, C: 219.482 } },
            "ethanol-water": { name: "Ethanol-Water", alpha_A_B: 2.8, antoine_A: { A: 8.20417, B: 1642.89, C: 230.30 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "methanol-water": { name: "Methanol-Water", alpha_A_B: 3.5, antoine_A: { A: 8.08097, B: 1582.271, C: 239.726 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } },
            "aceticacid-water": { name: "Acetic Acid-Water", alpha_A_B: 2.0, antoine_A: { A: 7.5732, B: 1567.45, C: 225.0 }, antoine_B: { A: 8.07131, B: 1730.63, C: 233.426 } }
        };
        this.currentComponentSystem = "benzene-toluene";
        this.svg = null; this.xScale = null; this.yScale = null;
        this.width = 0; this.height = 0;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };
        this.colors = { /* ... */ 
            equilibrium: "var(--primary-color)", yEqualsX: "grey", rol: "var(--accent-color)",
            sol: "var(--success-color)", qLine: "purple", plateStep: "rgba(0, 0, 0, 0.6)",
            keyPoints: "red", axisText: "var(--text-color)"
        };
        this.init();
    }

    init() { /* ... same as before ... */ 
        this.populateComponentSelector(); this.setupTabs(); this.setupEventListeners(); this.setupTooltips(); 
        if (this.componentData[this.currentComponentSystem]) { this.relativeVolatility = this.componentData[this.currentComponentSystem].alpha_A_B; }
        this.syncInputsToUI(); this.setupVisualization(); this.updateComponentDataUI(); this.calculateAndDraw();
        if (window.MathJax) window.MathJax.typesetPromise().catch(err => console.error('MathJax initial typeset error:', err));
    }
    
    setupTooltips() { /* ... same as before ... */ 
        const tooltipDiv = document.createElement('div'); tooltipDiv.classList.add('tooltip-popup'); tooltipDiv.setAttribute('id', 'infoTooltip');
        document.body.appendChild(tooltipDiv); this.tooltipElement = tooltipDiv;
        const infoIcons = document.querySelectorAll('.info-icon');
        infoIcons.forEach(icon => {
            icon.setAttribute('tabindex', '0'); 
            icon.addEventListener('mouseenter', (e) => this.showTooltip(e)); icon.addEventListener('mouseleave', () => this.hideTooltip());
            icon.addEventListener('focus', (e) => this.showTooltip(e)); icon.addEventListener('blur', () => this.hideTooltip());
            icon.addEventListener('keydown', (e) => { if (e.key === 'Escape') { this.hideTooltip(); if (icon.offsetParent) icon.blur(); }});
        });
    }
    showTooltip(event) { /* ... same as before ... */ 
        const icon = event.currentTarget; const tooltipText = icon.dataset.tooltip;
        if (!tooltipText || !this.tooltipElement) return; this.tooltipElement.textContent = tooltipText;
        this.tooltipElement.style.visibility = 'hidden'; this.tooltipElement.classList.add('visible'); 
        const tooltipWidth = this.tooltipElement.offsetWidth; const tooltipHeight = this.tooltipElement.offsetHeight;
        const iconRect = icon.getBoundingClientRect();
        let top = iconRect.top + window.scrollY - tooltipHeight - 10; let left = iconRect.left + window.scrollX + (iconRect.width / 2) - (tooltipWidth / 2);
        if (left < 5) left = 5; if (left + tooltipWidth > window.innerWidth - 5) left = window.innerWidth - tooltipWidth - 5;
        if (top < window.scrollY + 5) { top = iconRect.bottom + window.scrollY + 10; }
        this.tooltipElement.style.left = `${left}px`; this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.visibility = 'visible'; 
    }
    hideTooltip() { /* ... same as before ... */ if (!this.tooltipElement) return; this.tooltipElement.classList.remove('visible'); this.tooltipElement.textContent = ''; }
    populateComponentSelector() { /* ... same as before ... */ const sE=document.getElementById('component-select');if(!sE)return;sE.innerHTML='';for(const k in this.componentData){const o=document.createElement('option');o.value=k;o.textContent=this.componentData[k].name;sE.appendChild(o)}const cO=document.createElement('option');cO.value="custom";cO.textContent="Custom Alpha";sE.appendChild(cO);sE.value=this.currentComponentSystem}
    syncInputsToUI() { /* ... same as before ... */ document.getElementById('feedRate').value=this.feedRate;document.getElementById('feedComposition').value=this.feedComposition;document.getElementById('feedCompositionValue').textContent=this.feedComposition.toFixed(2);document.getElementById('qValue').value=this.qValue;document.getElementById('distillateComposition').value=this.distillateComposition;document.getElementById('distillateCompositionValue').textContent=this.distillateComposition.toFixed(2);document.getElementById('bottomsComposition').value=this.bottomsComposition;document.getElementById('bottomsCompositionValue').textContent=this.bottomsComposition.toFixed(2);document.getElementById('refluxRatio').value=this.refluxRatio;document.getElementById('relativeVolatility').value=this.relativeVolatility.toFixed(2)}
    setupEventListeners() { /* ... same as before ... */ const i=['feedRate','feedComposition','qValue','distillateComposition','bottomsComposition','refluxRatio','relativeVolatility'];i.forEach(d=>{const e=document.getElementById(d);if(e){e.addEventListener('input',t=>{if(this.hasOwnProperty(d))this[d]=parseFloat(t.target.value);if(document.getElementById(d+'Value'))document.getElementById(d+'Value').textContent=parseFloat(t.target.value).toFixed(2);this.calculateAndDraw()})}});document.getElementById('component-select').addEventListener('change',e=>{const s=e.target.value;if(s==="custom"){this.currentComponentSystem="custom";this.relativeVolatility=parseFloat(document.getElementById('relativeVolatility').value);document.getElementById('relativeVolatility').focus()}else{this.currentComponentSystem=s;if(this.componentData[this.currentComponentSystem]&&typeof this.componentData[this.currentComponentSystem].alpha_A_B!=='undefined'){this.relativeVolatility=this.componentData[this.currentComponentSystem].alpha_A_B;document.getElementById('relativeVolatility').value=this.relativeVolatility.toFixed(2)}else console.warn(`System ${this.currentComponentSystem} has no alpha_A_B defined.`)}this.updateComponentDataUI();this.calculateAndDraw()});window.addEventListener('resize',this.handleResize.bind(this));const eS=document.getElementById('exportSVGButton');if(eS)eS.addEventListener('click',()=>this.exportToSVG());const eP=document.getElementById('exportPNGButton');if(eP)eP.addEventListener('click',()=>this.exportToPNG());const eC=document.getElementById('exportCSVButton');if(eC)eC.addEventListener('click',()=>this.exportToCSV());const tB=document.getElementById('toggleStageDataButton');if(tB)tB.addEventListener('click',()=>this.toggleStageDataDisplay())}
    setupTabs() { /* ... same as before ... */ const tB=document.querySelectorAll('.tab-button'),tC=document.querySelectorAll('.tab-content');tB.forEach(b=>{b.addEventListener('click',()=>{tB.forEach(b=>b.classList.remove('active'));b.classList.add('active');tC.forEach(c=>c.classList.remove('active'));document.getElementById(b.dataset.tab+'-content').classList.add('active');if(b.dataset.tab==='theory'&&window.MathJax)setTimeout(()=>{window.MathJax.typesetPromise([document.getElementById('theory-content')]).catch(e=>console.error('MathJax typeset error:',e))},0);if(b.dataset.tab==='simulator')this.handleResize()})})}
    updateComponentDataUI() { /* ... same as before ... */ const sK=this.currentComponentSystem,pD=document.getElementById('system-properties');if(!pD)return;if(sK==="custom"||!this.componentData[sK])pD.innerHTML=`<h4>Custom System</h4><p>Relative Volatility (α) is set manually.</p><p>Current α: ${parseFloat(document.getElementById('relativeVolatility').value).toFixed(2)}</p>`;else{const s=this.componentData[sK];pD.innerHTML=`<h4>${s.name}</h4><p>Rel. Vol. (α<sub>A-B</sub>): ${s.alpha_A_B.toFixed(2)}</p>${s.antoine_A?`<p>Comp A Antoine: A=${s.antoine_A.A}, B=${s.antoine_A.B}, C=${s.antoine_A.C}</p>`:''}${s.antoine_B?`<p>Comp B Antoine: A=${s.antoine_B.A}, B=${s.antoine_B.B}, C=${s.antoine_B.C}</p>`:''}${s.name==="Ethanol-Water"?"<p><small>Note: Non-ideal system; alpha is simplified.</small></p>":""}`}if(window.MathJax)window.MathJax.typesetPromise([pD]).catch(e=>console.error('MathJax error:',e))}
    calculateEquilibrium(x_A) { /* ... same as before ... */ return (this.relativeVolatility === 1.0) ? x_A : (this.relativeVolatility * x_A) / (1.0 + (this.relativeVolatility - 1.0) * x_A); }
    findXForYOnEquilibrium(y_A) { /* ... same as before ... */ if (this.relativeVolatility === 1.0) return y_A; if (y_A <= 0) return 0.0; if (y_A >= 1.0) return 1.0; let d = this.relativeVolatility - y_A * (this.relativeVolatility - 1.0); return (Math.abs(d) < 1e-9) ? (y_A > 0.5 ? 1.0 : 0.0) : Math.max(0.0, Math.min(1.0, y_A / d)); }
    calculateOperatingLinesIntersection() { /* ... same as before ... */ const R=this.refluxRatio,xD=this.distillateComposition,zF=this.feedComposition,q=this.qValue;let x,y;const mR=R/(R+1),cR=xD/(R+1);if(Math.abs(q-1)<1e-6){x=zF;y=mR*x+cR}else if(Math.abs(q)<1e-6){y=zF;if(Math.abs(mR)<1e-9){x=Math.abs(y-cR)<1e-6?zF:null;if(x==null)this.errorMessage="ROL horizontal, not equal to q-line."}else x=(y-cR)/mR}else{const mQ=q/(q-1),cQ=zF-mQ*zF;if(Math.abs(mR-mQ)<1e-9){x=zF;y=mR*x+cR;this.errorMessage="ROL/q-line parallel."}else{x=(cQ-cR)/(mR-mQ);y=mR*x+cR}}if(x==null||y==null){}else this.operatingLinesIntersection={x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))}}
    calculateMinimumRefluxRatio() { /* ... same as before ... */ const zF=this.feedComposition,xD=this.distillateComposition,q=this.qValue,a=this.relativeVolatility;let xQ,yQ;if(Math.abs(q-1)<1e-6){xQ=zF;yQ=this.calculateEquilibrium(xQ)}else if(Math.abs(q)<1e-6){yQ=zF;xQ=this.findXForYOnEquilibrium(yQ)}else{const mQ=q/(q-1),K1=mQ,K2=zF-mQ*zF,aQ=K1*(a-1),bQ=K1+K2*(a-1)-a,cQ=K2;if(Math.abs(aQ)<1e-9){if(Math.abs(bQ)<1e-9){xQ=zF;if(Math.abs(K2)>1e-9){this.errorMessage="Rmin: q-line/eq intersection fail (lin case).";this.minimumRefluxRatio=Infinity;return}}else xQ=-cQ/bQ}else{const D=bQ*bQ-4*aQ*cQ;if(D<0){this.errorMessage="Rmin: No real q-line/eq intersection.";this.minimumRefluxRatio=Infinity;return}const x1=(-bQ+Math.sqrt(D))/(2*aQ),x2=(-bQ-Math.sqrt(D))/(2*aQ);if(x1>=0&&x1<=1&&(!(x2>=0&&x2<=1)||Math.abs(x1-zF)<Math.abs(x2-zF)))xQ=x1;else if(x2>=0&&x2<=1)xQ=x2;else{this.errorMessage="Rmin: q-line/eq intersection out of bounds.";this.minimumRefluxRatio=Infinity;return}}yQ=this.calculateEquilibrium(xQ)}if(Math.abs(xD-xQ)<1e-9){this.minimumRefluxRatio=Infinity;return}const mRmin=(xD-yQ)/(xD-xQ);if(mRmin>=1||Math.abs(1-mRmin)<1e-9)this.minimumRefluxRatio=Infinity;else if(mRmin<0)this.minimumRefluxRatio=0;else this.minimumRefluxRatio=mRmin/(1-mRmin);if(this.minimumRefluxRatio<0)this.minimumRefluxRatio=0}
    setupVisualization() { /* ... same as before ... */ const c=document.getElementById('mccabe-thiele-diagram');if(!c)return;this.width=c.clientWidth-this.margin.left-this.margin.right;this.height=c.clientHeight-this.margin.top-this.margin.bottom;d3.select(c).select("svg").remove();this.svg=d3.select(c).append("svg").attr("width",this.width+this.margin.left+this.margin.right).attr("height",this.height+this.margin.top+this.margin.bottom).append("g").attr("transform",`translate(${this.margin.left},${this.margin.top})`);if(this.width<=0||this.height<=0){console.error("SVG dimensions invalid.");return}this.xScale=d3.scaleLinear().domain([0,1]).range([0,this.width]);this.yScale=d3.scaleLinear().domain([0,1]).range([this.height,0]);this.svg.append("g").attr("class","x-axis").attr("transform",`translate(0,${this.height})`).call(d3.axisBottom(this.xScale)).selectAll("text").style("fill",this.colors.axisText);this.svg.append("g").attr("class","y-axis").call(d3.axisLeft(this.yScale)).selectAll("text").style("fill",this.colors.axisText);this.svg.append("text").attr("text-anchor","middle").attr("x",this.width/2).attr("y",this.height+this.margin.bottom-10).text("Liquid Mole Fraction (x)").style("fill",this.colors.axisText);this.svg.append("text").attr("text-anchor","middle").attr("transform","rotate(-90)").attr("y",-this.margin.left+20).attr("x",-this.height/2).text("Vapor Mole Fraction (y)").style("fill",this.colors.axisText);this.svg.append("line").attr("class","diagonal-line").attr("x1",this.xScale(0)).attr("y1",this.yScale(0)).attr("x2",this.xScale(1)).attr("y2",this.yScale(1)).attr("stroke",this.colors.yEqualsX).attr("stroke-dasharray","2,2");this.svg.append("g").attr("class","key-points-group")}
    drawEquilibriumCurve() { /* ... same as before ... */ if(!this.svg||!this.xScale)this.setupVisualization();if(!this.svg||!this.xScale)return;this.svg.selectAll(".equilibrium-curve").remove();const L=d3.line().x(d=>this.xScale(d.x)).y(d=>this.yScale(d.y));const P=[];for(let i=0;i<=100;i++){let x=i/100;P.push({x:x,y:this.calculateEquilibrium(x)})}this.svg.append("path").datum(P).attr("class","equilibrium-curve").attr("fill","none").attr("stroke",this.colors.equilibrium).attr("stroke-width",2).attr("d",L)}
    drawOperatingLines() { /* ... same as before ... */ if(!this.svg||!this.xScale||this.operatingLinesIntersection.x===null)return;this.svg.selectAll(".q-line, .rol-line, .sol-line").remove();const{x:xi,y:yi}=this.operatingLinesIntersection;const zF=this.feedComposition,xD=this.distillateComposition,xB=this.bottomsComposition;this.svg.append("line").attr("class","q-line").attr("x1",this.xScale(zF)).attr("y1",this.yScale(zF)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.qLine).attr("stroke-dasharray","4,2").attr("stroke-width",1.5);this.svg.append("line").attr("class","rol-line").attr("x1",this.xScale(xD)).attr("y1",this.yScale(xD)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.rol).attr("stroke-width",1.5);this.svg.append("line").attr("class","sol-line").attr("x1",this.xScale(xB)).attr("y1",this.yScale(xB)).attr("x2",this.xScale(xi)).attr("y2",this.yScale(yi)).attr("stroke",this.colors.sol).attr("stroke-width",1.5)}
    drawTheoreticalPlates() { /* ... same as before ... */ if(!this.svg||!this.xScale||this.operatingLinesIntersection.x===null)return;this.svg.selectAll(".plate-step").remove();this.stageData=[];this.feedPlateLocation=0;let p=0,cX=this.distillateComposition,cY=this.distillateComposition;const R=this.actualRefluxRatio,xD=this.distillateComposition,xB=this.bottomsComposition,{x:xi,y:yi}=this.operatingLinesIntersection;let mS,cS;if(Math.abs(xi-xB)<1e-9){mS=Infinity;cS=xB}else{mS=(yi-xB)/(xi-xB);cS=xB-mS*xB}while(cX>xB+1e-6&&cY>xB+1e-6&&p<50){p++;let pX=cX;cX=this.findXForYOnEquilibrium(cY);this.svg.append("line").attr("class","plate-step").attr("x1",this.xScale(pX)).attr("y1",this.yScale(cY)).attr("x2",this.xScale(cX)).attr("y2",this.yScale(cY)).attr("stroke",this.colors.plateStep).attr("stroke-width",.5);this.stageData.push({stage:p,x:cX,y:cY});if(cX<=xB+1e-6)break;let pY=cY;if(this.feedPlateLocation===0&&cX<xi+1e-6&&cY>yi-1e-6)this.feedPlateLocation=p;if(this.feedPlateLocation===0||cX>=xi-1e-6)cY=R/(R+1)*cX+xD/(R+1);else{if(mS===Infinity)cY=xB;else cY=mS*cX+cS}this.svg.append("line").attr("class","plate-step").attr("x1",this.xScale(cX)).attr("y1",this.yScale(pY)).attr("x2",this.xScale(cX)).attr("y2",this.yScale(cY)).attr("stroke",this.colors.plateStep).attr("stroke-width",.5);if(cY<=xB+1e-6)break}this.numberOfTheoreticalPlates=p}
    drawKeyPoints() { /* ... same as before ... */ if(!this.svg||!this.xScale||this.errorMessage)return;const kPD=[];if(this.distillateComposition!==null)kPD.push({x:this.distillateComposition,y:this.distillateComposition,l:"xD",c:this.colors.rol});if(this.bottomsComposition!==null)kPD.push({x:this.bottomsComposition,y:this.bottomsComposition,l:"xB",c:this.colors.sol});if(this.feedComposition!==null)kPD.push({x:this.feedComposition,y:this.feedComposition,l:"zF",c:this.colors.qLine});if(this.operatingLinesIntersection&&isFinite(this.operatingLinesIntersection.x)&&isFinite(this.operatingLinesIntersection.y))kPD.push({x:this.operatingLinesIntersection.x,y:this.operatingLinesIntersection.y,l:"Int",c:this.colors.keyPoints});const kPG=this.svg.select(".key-points-group");kPG.selectAll("circle").remove();kPG.selectAll("circle").data(kPD).enter().append("circle").attr("cx",d=>this.xScale(d.x)).attr("cy",d=>this.yScale(d.y)).attr("r",5).attr("fill",d=>d.c).attr("stroke","black").attr("stroke-width",.5).style("opacity",.8)}
    
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

        if (D_calc < -1e-6 || B_calc < -1e-6 ) { // Allow for small numerical inaccuracies, but not truly negative
             this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Calculated D or B is negative (check zF, xD, xB values for consistency).";
            this.distillateFlowRate = NaN; this.bottomsFlowRate = NaN; return;
        }
        // Ensure D and B are not significantly larger than F, which would also indicate inconsistency
        if (D_calc > F + 1e-6 || B_calc > F + 1e-6) {
             this.errorMessage = (this.errorMessage ? this.errorMessage + " " : "") + "Calculated D or B is larger than F (check zF, xD, xB values).";
             this.distillateFlowRate = NaN; this.bottomsFlowRate = NaN; return;
        }


        this.distillateFlowRate = Math.max(0, D_calc); // Ensure non-negative due to potential float issues
        this.bottomsFlowRate = Math.max(0, B_calc);   // Ensure non-negative

        const L = this.actualRefluxRatio * this.distillateFlowRate;
        const V = L + this.distillateFlowRate;
        this.condenserLoadFactor = V;

        const L_bar = L + this.qValue * F;
        const V_bar = L_bar - this.bottomsFlowRate;
        this.reboilerLoadFactor = V_bar;

        if (this.minimumRefluxRatio !== null && isFinite(this.minimumRefluxRatio)) {
            if (this.minimumRefluxRatio < 1e-6 && this.minimumRefluxRatio > -1e-6) { // Rmin is effectively zero
                this.refluxRatioToMinRefluxRatio = (this.actualRefluxRatio < 1e-6) ? 1.0 : Infinity; // R/Rmin is 1 if R also 0, else Infinity
            } else {
                this.refluxRatioToMinRefluxRatio = this.actualRefluxRatio / this.minimumRefluxRatio;
            }
        }
    }

    calculateAndDraw() { 
        this.errorMessage = null; 
        if (this.svg) this.svg.selectAll(".plate-step, .q-line, .rol-line, .sol-line, .key-points-group circle").remove();
        else this.setupVisualization();
        
        const stageDataContainer = document.getElementById('stageDataTableContainer');
        if (stageDataContainer && stageDataContainer.style.display !== 'none') {
            stageDataContainer.style.display = 'none';
            const btn = document.getElementById('toggleStageDataButton');
            if(btn) btn.textContent = 'Show Stage-by-Stage Data';
        }

        if (this.feedRate <=0) { this.errorMessage = "Feed rate (F) must be positive.";}
        else if (this.distillateComposition <= this.bottomsComposition) { this.errorMessage = "xD must be > xB."; }
        else if (this.feedComposition < this.bottomsComposition || this.feedComposition > this.distillateComposition) { this.errorMessage = "zF must be between xB and xD."; }
        else if (this.refluxRatio < 0) { this.errorMessage = "Reflux ratio (R) must be non-negative."; }
        else if (this.relativeVolatility <= 0) { this.errorMessage = "Relative volatility (α) must be positive.";}
        if (this.errorMessage) { this.updateResultsDisplay(); return; }

        this.actualRefluxRatio = this.refluxRatio; 
        this.calculateMinimumRefluxRatio(); if (this.errorMessage) { this.updateResultsDisplay(); return; }
        this.calculateFlowRatesAndLoads(); if (this.errorMessage) { this.updateResultsDisplay(); return; } // Call new method
        this.calculateOperatingLinesIntersection(); if (this.errorMessage) { this.updateResultsDisplay(); return; }
        
        if (!this.svg || this.width <= 0 || this.height <= 0) { 
            this.setupVisualization(); 
            if (this.width <= 0 || this.height <= 0) { this.errorMessage = "Diagram container error."; this.updateResultsDisplay(); return; }
        }
        this.drawEquilibriumCurve(); this.drawOperatingLines(); this.drawTheoreticalPlates(); this.drawKeyPoints(); 
        this.updateResultsDisplay(); this.updateLegend();
    }

    updateResultsDisplay() { 
        const resultsDiv=document.querySelector('.results-grid');if(!resultsDiv)return;resultsDiv.innerHTML='';
        if(this.errorMessage){resultsDiv.innerHTML=`<div class="error-message" style="color:var(--error-color);grid-column:1/-1">${this.errorMessage}</div>`;return}
        function c(l,v,u=''){const i=document.createElement('div');i.innerHTML=`<strong>${l}:</strong> ${v} ${u}`;return i}
        resultsDiv.appendChild(c('Feed Rate (F)',this.feedRate.toFixed(2),'mol/hr'));
        resultsDiv.appendChild(c('Feed Comp. (z<sub>F</sub>)',this.feedComposition.toFixed(2)));
        resultsDiv.appendChild(c('Feed Cond. (q)',this.qValue.toFixed(2)));
        resultsDiv.appendChild(c('Dist. Comp. (x<sub>D</sub>)',this.distillateComposition.toFixed(2)));
        resultsDiv.appendChild(c('Bott. Comp. (x<sub>B</sub>)',this.bottomsComposition.toFixed(2)));
        resultsDiv.appendChild(c('Rel. Vol. (α)',this.relativeVolatility.toFixed(2)));
        resultsDiv.appendChild(c('Reflux Ratio (R)',this.actualRefluxRatio.toFixed(2)));
        
        let rMV='N/A';
        if(this.minimumRefluxRatio!==null){if(isFinite(this.minimumRefluxRatio)&&!isNaN(this.minimumRefluxRatio))rMV=this.minimumRefluxRatio.toFixed(2);else if(this.minimumRefluxRatio===Infinity)rMV='Infinity'}
        resultsDiv.appendChild(c('Min. Reflux (R<sub>min</sub>)',rMV));
        
        resultsDiv.appendChild(c('Distillate Rate (D)', (this.distillateFlowRate !== null && !isNaN(this.distillateFlowRate)) ? this.distillateFlowRate.toFixed(2) : 'N/A', (this.distillateFlowRate !== null && !isNaN(this.distillateFlowRate)) ? 'mol/hr' : ''));
        resultsDiv.appendChild(c('Bottoms Rate (B)', (this.bottomsFlowRate !== null && !isNaN(this.bottomsFlowRate)) ? this.bottomsFlowRate.toFixed(2) : 'N/A', (this.bottomsFlowRate !== null && !isNaN(this.bottomsFlowRate)) ? 'mol/hr' : ''));
        resultsDiv.appendChild(c('Condenser Load Factor', (this.condenserLoadFactor !== null && !isNaN(this.condenserLoadFactor)) ? this.condenserLoadFactor.toFixed(2) : 'N/A', (this.condenserLoadFactor !== null && !isNaN(this.condenserLoadFactor)) ? '(rel. units)' : ''));
        resultsDiv.appendChild(c('Reboiler Load Factor', (this.reboilerLoadFactor !== null && !isNaN(this.reboilerLoadFactor)) ? this.reboilerLoadFactor.toFixed(2) : 'N/A', (this.reboilerLoadFactor !== null && !isNaN(this.reboilerLoadFactor)) ? '(rel. units)' : ''));
        
        let rRminValueText = 'N/A';
        if (this.refluxRatioToMinRefluxRatio === Infinity) { rRminValueText = 'Infinity (R<sub>min</sub> ≈ 0)'; }
        else if (this.refluxRatioToMinRefluxRatio !== null && !isNaN(this.refluxRatioToMinRefluxRatio) && isFinite(this.refluxRatioToMinRefluxRatio)) { rRminValueText = this.refluxRatioToMinRefluxRatio.toFixed(2); }
        resultsDiv.appendChild(c('R/R<sub>min</sub> Ratio', rRminValueText));

        resultsDiv.appendChild(c('Total Plates (N<sub>total</sub>)',this.numberOfTheoreticalPlates!==null?this.numberOfTheoreticalPlates:'N/A'));
        resultsDiv.appendChild(c('Feed Plate # (N<sub>feed</sub>)',this.feedPlateLocation!==null&&this.feedPlateLocation>0?this.feedPlateLocation:'N/A'));
        
        if(window.MathJax){window.MathJax.typesetPromise([resultsDiv]).catch(e=>console.error('MathJax err: '+e.message))}}
    updateLegend() { /* ... same as before ... */ const lD=document.querySelector('.visualization-panel .legend');if(!lD)return;lD.innerHTML='';const lI=[{label:"Equilibrium Curve",color:this.colors.equilibrium,class:"legend-eq"},{label:"y = x Line",color:this.colors.yEqualsX,class:"legend-diag"},{label:"Rectifying Op. Line",color:this.colors.rol,class:"legend-rol"},{label:"Stripping Op. Line",color:this.colors.sol,class:"legend-sol"},{label:"q-Line",color:this.colors.qLine,class:"legend-qline"},{label:"Plate Steps",color:this.colors.plateStep,class:"legend-plates"},{label:"Key Points",color:this.colors.keyPoints,class:"legend-keypoints"}];const sId='dynamic-legend-styles';let sS=document.getElementById(sId);if(!sS){sS=document.createElement('style');sS.id=sId;document.head.appendChild(sS)}let cR="";lI.forEach(i=>{const s=document.createElement('span');s.classList.add(i.class);s.textContent=i.label;s.dataset.color=i.color;lD.appendChild(s);cR+=`.${i.class}::before { background-color: ${i.color} !important; content: ''; width: 12px; height: 12px; border: 1px solid #ccc; display: inline-block; margin-right: 5px; vertical-align: middle; }\n`});sS.innerHTML=cR}
    handleResize() { /* ... same as before ... */ if(document.getElementById('simulator-content').classList.contains('active')){this.setupVisualization();this.calculateAndDraw()}}
    exportToSVG() { /* ... same as before ... */ if(!this.svg){alert("No diagram to export.");return}try{const S=this.svg.node().closest("svg");if(!S){alert("SVG element not found.");return}let s=new XMLSerializer().serializeToString(S);const b=new Blob([s],{type:"image/svg+xml;charset=utf-8"}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","mccabe_thiele_diagram.svg");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}catch(e){console.error("SVG Export Error:",e);alert("Error exporting SVG.")}}
    exportToPNG() { /* ... same as before ... */ if(!this.svg){alert("No diagram to export.");return}try{const S=this.svg.node().closest("svg");if(!S){alert("SVG element not found.");return}const s=new XMLSerializer().serializeToString(S),b=new Blob([s],{type:'image/svg+xml;charset=utf-8'}),u=URL.createObjectURL(b);const i=new Image;i.onload=()=>{const c=document.createElement('canvas'),f=window.devicePixelRatio||1;c.width=S.clientWidth*f;c.height=S.clientHeight*f;const x=c.getContext('2d');x.scale(f,f);x.drawImage(i,0,0,S.clientWidth,S.clientHeight);URL.revokeObjectURL(u);const p=c.toDataURL('image/png'),l=document.createElement('a');l.download='mccabe_thiele_diagram.png';l.href=p;document.body.appendChild(l);l.click();document.body.removeChild(l)};i.onerror=e=>{console.error("PNG Export: Image load error",e);alert("Error loading SVG for PNG export.");URL.revokeObjectURL(u)};i.src=u}catch(e){console.error("PNG Export Error:",e);alert("Error exporting PNG.")}}
    exportToCSV() { /* ... same as before ... */ if(this.errorMessage){alert(`Cannot export data: ${this.errorMessage}`);return}if(this.minimumRefluxRatio===null&&this.numberOfTheoreticalPlates===null){alert("No results to export.");return}let C="Parameter,Value,Unit\n";const D=[["Feed Rate (F)",this.feedRate.toFixed(2),"mol/hr"],["Feed Comp. (zF)",this.feedComposition.toFixed(2),""],["Feed Cond. (q)",this.qValue.toFixed(2),""],["Distillate Comp. (xD)",this.distillateComposition.toFixed(2),""],["Bottoms Comp. (xB)",this.bottomsComposition.toFixed(2),""],["Rel. Vol. (alpha)",this.relativeVolatility.toFixed(2),""],["Actual Reflux (R)",this.actualRefluxRatio.toFixed(2),""],["Min. Reflux (Rmin)",this.minimumRefluxRatio!==null&&isFinite(this.minimumRefluxRatio)?this.minimumRefluxRatio.toFixed(2):this.minimumRefluxRatio===Infinity?"Infinity":"N/A",""],["Total Plates (Ntotal)",this.numberOfTheoreticalPlates!==null?this.numberOfTheoreticalPlates:"N/A",""],["Feed Plate (Nfeed)",this.feedPlateLocation!==null&&this.feedPlateLocation>0?this.feedPlateLocation:"N/A","from top"]];D.forEach(r=>{C+=r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")+"\n"});const b=new Blob([C],{type:'text/csv;charset=utf-8;'}),u=URL.createObjectURL(b),l=document.createElement("a");l.setAttribute("href",u);l.setAttribute("download","distillation_simulation_data.csv");document.body.appendChild(l);l.click();document.body.removeChild(l);URL.revokeObjectURL(u)}
    toggleStageDataDisplay() { /* ... same as before ... */ const c=document.getElementById('stageDataTableContainer'),b=document.getElementById('toggleStageDataButton');if(!c||!b)return;if(c.style.display==='none'){if(this.stageData&&this.stageData.length>0){this.populateStageDataTable();c.style.display='block';b.textContent='Hide Stage-by-Stage Data'}else alert("No stage data available. Run a valid simulation first.")}else{c.style.display='none';b.textContent='Show Stage-by-Stage Data'}}
    populateStageDataTable() { /* ... same as before ... */ const tB=document.getElementById('stageDataTable')?.querySelector('tbody');if(!tB)return;tB.innerHTML='';this.stageData.forEach(d=>{const r=tB.insertRow(),cS=r.insertCell(),cX=r.insertCell(),cY=r.insertCell();cS.textContent=d.stage;cX.textContent=d.x.toFixed(4);cY.textContent=d.y.toFixed(4)})}
}

document.addEventListener('DOMContentLoaded', () => {
    window.distillationSimulator = new ProfessionalDistillationSimulator();
});
