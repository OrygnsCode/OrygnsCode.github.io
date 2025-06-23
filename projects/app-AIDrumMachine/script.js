/********************************************************************
 *  AI Drum Machine – complete script (copy-paste ready)             *
 *                                                                  *
 *  Debug switch:                                                    *
 *      const DEBUG = false  →  console shows only info & errors     *
 *      const DEBUG = true   →  console shows debug + warnings too   *
 ********************************************************************/

/*────────────────────────────  LOGGING  ───────────────────────────*/
const DEBUG = false;                      // ← flip for verbose trace
const _ts = () => new Date().toISOString().substr(11, 12);

function logDebug   (...a){ if (DEBUG) console.log (`[${_ts()}] 🥁 DEBUG:`,   ...a); }
function logWarning (...a){ if (DEBUG) console.warn(`[${_ts()}] 🥁 WARNING:`, ...a); }
function logInfo(msg,data=null){ data?console.log(`[${_ts()}] 🥁 ${msg}`,data)
                                   :console.log(`[${_ts()}] 🥁 ${msg}`); }
function logError(msg,err=null){
  if(!err) return console.error(`[${_ts()}] ❌ ERROR: ${msg}`);
  if(err instanceof Error){
    console.error(`[${_ts()}] ❌ ERROR: ${msg}:`,err.message);
    err.stack&&console.error(`[${_ts()}] ❌ STACK:`,err.stack);
  }else console.error(`[${_ts()}] ❌ ERROR: ${msg}:`,err);
}

/*────────────────────────  CONSTANTS & STATE  ─────────────────────*/
const DRUM_CLASSES = ['Kick','Snare','Hi-hat closed','Hi-hat open',
  'Tom low','Tom mid','Tom high','Clap','Rim'];
const TIME_HUMANIZATION = 0.01;
console.log('🥁 Initializing AI Drum Machine...');

// globals (Tone.js & Magenta provided in page)
let Tone = mm.Player.tone, rnn, drumKit = [], reverb;
let temperature = 1.1, isInitialized = false;

/* MIDI maps */
const midiDrums=[36,38,42,46,41,43,45,49,51];
const reverseMidiMapping=new Map([
  [36,0],[35,0],[38,1],[27,1],[28,1],[31,1],[32,1],[33,1],[34,1],[37,1],[39,1],[40,1],[56,1],[65,1],[66,1],[75,1],[85,1],
  [42,2],[44,2],[54,2],[68,2],[69,2],[70,2],[71,2],[73,2],[78,2],[80,2],
  [46,3],[67,3],[72,3],[74,3],[79,3],[81,3],
  [45,4],[29,4],[41,4],[61,4],[64,4],[84,4],
  [48,5],[47,5],[60,5],[63,5],[77,5],[86,5],[87,5],
  [50,6],[30,6],[43,6],[62,6],[76,6],[83,6],
  [49,7],[55,7],[57,7],[58,7],[51,8],[52,8],[53,8],[59,8],[82,8]
]);

/* output handler */
const outputs = {
  internal:{
    play:(idx,vel,t)=>{
      try{ drumKit[idx]?.get(vel).start(t); }
      catch(e){ logError(`play drum ${idx}`,e); }
    }
  }
};

/* application state */
const state = {
  patternLength: 16,
  seedLength: 3,
  swing: 0.55,
  pattern: [[0], [], [2], ...Array.from({length: 13}, () => [])],
  tempo: 120
};

let stepEls = [], hasBeenStarted = false;
let oneEighth = Tone.Time('8n').toSeconds();
let activeOutput = 'internal', currentSchedulerId, stepCounter;

/*──────────────────────────  AUDIO INIT  ─────────────────────────*/
async function initializeAudio(){
  try{
    await Tone.start();
    // Reverb or fallback gain
    try{
      reverb = new Tone.Reverb({decay:1.5, preDelay:0.01}).toDestination();
      await reverb.ready; reverb.wet.value = 0.35;
    }catch(e){ reverb = new Tone.Gain(0.8).toDestination(); }

    // Snare pan animation
    const snarePan = new Tone.Panner().connect(reverb);
    new Tone.LFO(0.13, -0.25, 0.25).connect(snarePan.pan).start();

    // Create synth fallback kit
    const create = (type, pan = 0) => {
      let s;
      switch(type){
        case'kick':s=new Tone.MembraneSynth({pitchDecay:0.05,octaves:10,
               envelope:{attack:0.001,decay:0.4,sustain:0.01,release:1.4}});break;
        case'snare':s=new Tone.NoiseSynth({envelope:{attack:0.005,decay:0.1,sustain:0}});break;
        case'hihat':s=new Tone.MetalSynth({frequency:200,harmonicity:5.1,modulationIndex:32,
               resonance:4000,octaves:1.5,envelope:{attack:0.001,decay:0.1,release:0.01}});break;
        case'tom':s=new Tone.MembraneSynth({pitchDecay:0.008,octaves:2,
               envelope:{attack:0.0006,decay:0.5,sustain:0}});break;
        case'clap':s=new Tone.NoiseSynth({envelope:{attack:0.003,decay:0.35,sustain:0}});break;
        default:s=new Tone.Synth();
      }
      return pan ? s.connect(new Tone.Panner(pan).connect(reverb))
                 : s.connect(reverb);
    };

    drumKit = [
      {high:create('kick'),med:create('kick'),low:create('kick'),
       get(v){return{start:t=>this[v].triggerAttackRelease('C1','8n',t)}}},
      {high:create('snare'),med:create('snare'),low:create('snare'),
       get(v){return{start:t=>this[v].triggerAttackRelease('8n',t)}}},
      {high:create('hihat',-0.5),med:create('hihat',-0.5),low:create('hihat',-0.5),
       get(v){return{start:t=>this[v].triggerAttackRelease('8n',t)}}},
      {high:create('hihat',-0.5),med:create('hihat',-0.5),low:create('hihat',-0.5),
       get(v){return{start:t=>this[v].triggerAttackRelease('4n',t)}}},
      {high:create('tom',-0.4),med:create('tom',-0.4),low:create('tom',-0.4),
       get(v){return{start:t=>this[v].triggerAttackRelease('G2','8n',t)}}},
      {high:create('tom'),med:create('tom'),low:create('tom'),
       get(v){return{start:t=>this[v].triggerAttackRelease('A2','8n',t)}}},
      {high:create('tom',0.4),med:create('tom',0.4),low:create('tom',0.4),
       get(v){return{start:t=>this[v].triggerAttackRelease('C3','8n',t)}}},
      {high:create('clap',0.5),med:create('clap',0.5),low:create('clap',0.5),
       get(v){return{start:t=>this[v].triggerAttackRelease('8n',t)}}},
      {high:create('snare',0.5),med:create('snare',0.5),low:create('snare',0.5),
       get(v){return{start:t=>this[v].triggerAttackRelease('16n',t)}}}
    ];

    await attemptToLoadSamples('./sounds');
    logInfo('Audio initialized');
    return true;
  }catch(e){ logError('Audio init failed',e); return false; }
}

/*──────────────────────────  AI INIT  ───────────────────────────*/
async function initializeAI(){
  try{
    if(typeof mm==='undefined') throw Error('Magenta.js missing');
    rnn = new mm.MusicRNN('https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/drum_kit_rnn');
    await rnn.initialize(); logInfo('RNN loaded'); return true;
  }catch(e){ logError('AI init failed',e); return false; }
}

/*──────────────────  LOAD SAMPLES TO REPLACE SYNTHS  ─────────────*/
async function attemptToLoadSamples(base){
  const p=[['808-kick-vh.mp3','808-kick-vm.mp3','808-kick-vl.mp3'],
    ['flares-snare-vh.mp3','flares-snare-vm.mp3','flares-snare-vl.mp3'],
    ['808-hihat-vh.mp3','808-hihat-vm.mp3','808-hihat-vl.mp3'],
    ['808-hihat-open-vh.mp3','808-hihat-open-vm.mp3','808-hihat-open-vl.mp3'],
    ['slamdam-tom-low-vh.mp3','slamdam-tom-low-vm.mp3','slamdam-tom-low-vl.mp3'],
    ['slamdam-tom-mid-vh.mp3','slamdam-tom-mid-vm.mp3','slamdam-tom-mid-vl.mp3'],
    ['slamdam-tom-high-vh.mp3','slamdam-tom-high-vm.mp3','slamdam-tom-high-vl.mp3'],
    ['909-clap-vh.mp3','909-clap-vm.mp3','909-clap-vl.mp3'],
    ['909-rim-vh.wav','909-rim-vm.wav','909-rim-vl.wav']];
  try{
    if(!(await fetch(`${base}/${p[0][0]}`)).ok) return;
    const snarePan=new Tone.Panner().connect(reverb);
    new Tone.LFO(0.13,-0.25,0.25).connect(snarePan.pan).start();
    const players=[
      new Tone.Players({high:`${base}/${p[0][0]}`,med:`${base}/${p[0][1]}`,low:`${base}/${p[0][2]}`}).toDestination(),
      new Tone.Players({high:`${base}/${p[1][0]}`,med:`${base}/${p[1][1]}`,low:`${base}/${p[1][2]}`}).connect(snarePan),
      new Tone.Players({high:`${base}/${p[2][0]}`,med:`${base}/${p[2][1]}`,low:`${base}/${p[2][2]}`}).connect(new Tone.Panner(-0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${p[3][0]}`,med:`${base}/${p[3][1]}`,low:`${base}/${p[3][2]}`}).connect(new Tone.Panner(-0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${p[4][0]}`,med:`${base}/${p[4][1]}`,low:`${base}/${p[4][2]}`}).connect(new Tone.Panner(-0.4).connect(reverb)),
      new Tone.Players({high:`${base}/${p[5][0]}`,med:`${base}/${p[5][1]}`,low:`${base}/${p[5][2]}`}).connect(reverb),
      new Tone.Players({high:`${base}/${p[6][0]}`,med:`${base}/${p[6][1]}`,low:`${base}/${p[6][2]}`}).connect(new Tone.Panner(0.4).connect(reverb)),
      new Tone.Players({high:`${base}/${p[7][0]}`,med:`${base}/${p[7][1]}`,low:`${base}/${p[7][2]}`}).connect(new Tone.Panner(0.5).connect(reverb)),
      new Tone.Players({high:`${base}/${p[8][0]}`,med:`${base}/${p[8][1]}`,low:`${base}/${p[8][2]}`}).connect(new Tone.Panner(0.5).connect(reverb))
    ];
    drumKit = players.map(pl=>({ get(v){ return { start:t=>pl.player(v).start(t) }; } }));
    logInfo('Samples loaded');
  }catch(e){ logWarning('Sample load failed',e);}
}

/*──────────────────────  SEQUENCE HELPERS  ───────────────────────*/
const toNoteSequence = pattern => mm.sequences.quantizeNoteSequence({
  ticksPerQuarter:220,totalTime:pattern.length/2,
  timeSignatures:[{time:0,numerator:4,denominator:4}],
  tempos:[{time:0,qpm:120}],
  notes: pattern.flatMap((step,i)=>
    step.map(d=>({pitch:midiDrums[d],startTime:i*0.5,endTime:(i+1)*0.5})))
},1);

function fromNoteSequence(seq,len){
  const res=Array.from({length:len},()=>[]);
  seq.notes.forEach(({pitch,quantizedStartStep:q})=>{
    if(reverseMidiMapping.has(pitch)&&q<len) res[q].push(reverseMidiMapping.get(pitch));
  });
  return res;
}

function generatePattern(seed,len){
  if(!rnn)return Promise.resolve(seed);
  return rnn.continueSequence(toNoteSequence(seed),len,temperature)
            .then(s=>seed.concat(fromNoteSequence(s,len)))
            .catch(e=>{logError('RNN gen fail',e);return seed;});
}

/*─────────────────────────  PLAY SCHEDULER  ───────────────────────*/
const getVel = idx => idx%4===0?'high':idx%2===0?'med':'low';
const humanize = t => t - TIME_HUMANIZATION/2 + Math.random()*TIME_HUMANIZATION;

function tick(time = Tone.now() - Tone.context.lookAhead){
  if(!Number.isInteger(stepCounter))return;
  stepCounter++; const idx = stepCounter % state.pattern.length;
  if(idx%2) time += (state.swing-0.5)*oneEighth;
  state.pattern[idx].forEach(d=>{
    const t = idx===0?time:humanize(time);
    outputs[activeOutput].play(d,getVel(idx),t);
    visualizePlay(t,idx,d);
  });
}

/*─────────────────────────  RENDER / UI  ─────────────────────────*/
/* -- DOM cache ---------------------------------------------------*/
const seqStepsEl = () => document.querySelector('.sequencer .steps');
const regenBtn    = () => document.querySelector('.regenerate');
const playPauseEl = () => document.querySelector('.playpause');
const statusEl    = () => document.getElementById('status');

/* -- pattern render ---------------------------------------------*/
function renderPattern(regen=false){
  const seqEl = seqStepsEl(); if(!seqEl) return;
  // prune extra step DOM
  while(stepEls.length>state.pattern.length){
    let {stepEl,gutterEl}=stepEls.pop(); stepEl?.remove(); gutterEl?.remove();
  }
  for(let i=0;i<state.pattern.length;i++){
    let step=state.pattern[i],stepEl,gutterEl,cellEls;
    if(stepEls[i])({stepEl,gutterEl,cellEls}=stepEls[i]);
    else{
      stepEl=document.createElement('div');stepEl.className='step';stepEl.dataset.stepIdx=i;seqEl.appendChild(stepEl);
      cellEls=[]; }
    stepEl.style.flex = i%2===0?state.swing:1-state.swing;
    if(!gutterEl && i<state.pattern.length-1){
      gutterEl=document.createElement('div');gutterEl.className='gutter';seqEl.insertBefore(gutterEl,stepEl.nextSibling);}
    if(gutterEl){
      if(i===state.seedLength-1 && i>0)gutterEl.classList.add('seed-marker');
      else gutterEl.classList.remove('seed-marker'); }
    for(let d=0;d<DRUM_CLASSES.length;d++){
      let cell=cellEls[d];
      if(!cell){
        cell=document.createElement('div');
        cell.classList.add('cell',_.kebabCase(DRUM_CLASSES[d]));
        cell.dataset.stepIdx=i; cell.dataset.cellIdx=d; stepEl.appendChild(cell); cellEls[d]=cell;
      }
      cell.classList.toggle('on', step.includes(d));
    }
    stepEls[i]={stepEl,gutterEl,cellEls};
    const stagger=i*(300/(state.patternLength-state.seedLength));
    setTimeout(()=>{ if(i<state.seedLength)stepEl.classList.add('seed');
                     else{stepEl.classList.remove('seed');
                          stepEl.classList.toggle('regenerating',regen);} },stagger);
  }
  setTimeout(repositionRegenerateButton,0);
}

function repositionRegenerateButton(){
  const btn=regenBtn(),seq=document.querySelector('.sequencer'),
        mark=document.querySelector('.gutter.seed-marker');
  if(btn&&seq&&mark){
    btn.style.left = `${seq.offsetLeft+mark.offsetLeft+mark.offsetWidth/2-btn.offsetWidth/2}px`;
    btn.style.top  = `${seq.offsetTop +mark.offsetTop +mark.offsetHeight/2-btn.offsetHeight/2}px`;
    btn.style.visibility='visible';
  }
}

/* -- cell flash --------------------------------------------------*/
function visualizePlay(time,stepIdx,drumIdx){
  Tone.Draw.schedule(()=>{
    const cell=stepEls[stepIdx]?.cellEls[drumIdx];
    if(cell?.classList.contains('on')){
      cell.classList.add('playing');
      setTimeout(()=>cell.classList.remove('playing'),oneEighth*4*1000);
    }
  },time);
}

/*──────────────────────  STATUS / CONTROLS  ─────────────────────*/
function updateStatus(msg){
  const el=statusEl(); if(!el)return;
  el.textContent=msg; el.className='status-indicator';
  if(msg==='Playing')el.classList.add('playing');
}

function updatePlayPauseIcons(){
  const playIcon=document.querySelector('.playpause .play-icon'),
        pauseIcon=document.querySelector('.playpause .pause-icon');
  if(!playIcon||!pauseIcon)return;
  const playing=Number.isInteger(stepCounter);
  playIcon.style.display=playing?'none':'block';
  pauseIcon.style.display=playing?'block':'none';
}

/*────────────────────────  EVENT LISTENERS  ─────────────────────*/
function setupEventListeners(){
  const app=document.querySelector('.app');
  /* toggle step */
  app?.addEventListener('click',e=>{
    if(e.target.classList.contains('cell')){
      const si=+e.target.dataset.stepIdx,ci=+e.target.dataset.cellIdx;
      const on=e.target.classList.toggle('on');
      if(on) state.pattern[si].push(ci); else _.pull(state.pattern[si],ci);
    }
  });
  /* regenerate button */
  regenBtn()?.addEventListener('click',e=>{
    e.preventDefault(); e.currentTarget.classList.remove('pulse');
    playPauseEl().classList.remove('pulse');
    const seed=_.take(state.pattern,state.seedLength);
    renderPattern(true); updateStatus('Generating with AI...');
    generatePattern(seed,state.patternLength-seed.length).then(p=>{
      state.pattern=p; renderPattern(); updateStatus('Ready');
      if(!hasBeenStarted){Tone.context.resume();Tone.Transport.start();hasBeenStarted=true;}
      if(Tone.Transport.state==='started')stepCounter=-1;
    });
  });
  /* play/pause */
  playPauseEl()?.addEventListener('click',e=>{
    e.preventDefault(); playPauseEl().classList.remove('pulse');
    if(Number.isInteger(stepCounter)){ stepCounter=null;Tone.Transport.pause();updateStatus('Stopped'); }
    else{ Tone.context.resume();Tone.Transport.start();stepCounter=-1;updateStatus('Playing');hasBeenStarted=true; }
    updatePlayPauseIcons();
  });
  /* drag seed marker */
  let dragging=false;
  app?.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('gutter')&&e.target.classList.contains('seed-marker')){
      dragging=true;document.body.style.cursor='ew-resize';e.preventDefault();
    }
  });
  window.addEventListener('mouseup',()=>{dragging=false;document.body.style.cursor='';});
  app?.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const seq=document.querySelector('.sequencer');
    const rect=seq.getBoundingClientRect(), w=rect.width/state.patternLength;
    let newSeed=Math.round((e.clientX-rect.left)/w);
    newSeed=Math.max(1,Math.min(state.patternLength-1,newSeed));
    if(newSeed!==state.seedLength){ state.seedLength=newSeed; renderPattern(); }
  });
  /* swing/temperature/tempo length inputs (ids exist in HTML) */
  document.getElementById('swing')?.addEventListener('input',e=>{
    state.swing=+e.target.value; renderPattern();});
  document.getElementById('temperature')?.addEventListener('input',e=>{
    temperature=+e.target.value;});
  document.getElementById('tempo')?.addEventListener('input',e=>{
    const bpm=+e.target.value; Tone.Transport.bpm.value=bpm; state.tempo=bpm;
    oneEighth=Tone.Time('8n').toSeconds(); document.getElementById('tempo-value').textContent=bpm;});
  document.getElementById('pattern-length')?.addEventListener('change',e=>{
    const len=+e.target.value; state.patternLength=len;
    if(len>state.pattern.length) while(state.pattern.length<len)state.pattern.push([]);
    else state.pattern.length=len;
    if(state.seedLength>=len)state.seedLength=Math.max(1,len-1);
    renderPattern();
  });
  window.addEventListener('resize',repositionRegenerateButton);
}

/*─────────────────────────  INIT SEQUENCE  ───────────────────────*/
async function initialize(){
  logInfo('🚀 Starting AI Drum Machine initialization...');
  const start=Date.now(),minLoad=2500;
  await initializeAudio(); await initializeAI(); setupEventListeners();
  currentSchedulerId=Tone.Transport.scheduleRepeat(tick,'16n');
  oneEighth=Tone.Time('8n').toSeconds();
  const elapsed=Date.now()-start; if(elapsed<minLoad)await new Promise(r=>setTimeout(r,minLoad-elapsed));
  isInitialized=true; renderPattern();
  document.querySelector('.loading')?.remove();
  document.querySelector('.app').style.display='flex'; updateStatus('Ready');
  logInfo('🥁 ✅ AI Drum Machine initialization complete!');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);
else initialize();
