/* Micrositio · Ritmo — Musicala
   - Audio de bienvenida (toggle)
   - Metrónomo WebAudio con acentos (2/4, 3/4, 4/4)
*/
(function(){
  'use strict';

  // --- DOM ---
  const introAudio   = document.getElementById('introAudio');
  const btnPlayIntro = document.getElementById('btnPlayIntro');

  const meterSel   = document.getElementById('meterSel');
  const bpmSlider  = document.getElementById('bpm');
  const bpmVal     = document.getElementById('bpmVal');
  const accentRow  = document.getElementById('accentRow');

  const btnStart   = document.getElementById('btnStart');
  const btnStop    = document.getElementById('btnStop');

  // --- Audio Context ---
  let actx = null;
  let isRunning = false;
  let tickTimer = null;
  let step = 0;

  // --- Estado ---
  let meter = parseInt(meterSel.value, 10);
  let bpm   = parseInt(bpmSlider.value, 10);

  // --- Utilidades ---
  function ensureAudio(){
    if(!actx){
      actx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function setBpm(v){
    bpm = parseInt(v,10);
    bpmVal.textContent = bpm;
  }

  function renderAccents(){
    accentRow.innerHTML = '';
    for(let i=0;i<meter;i++){
      const b = document.createElement('div');
      b.className = 'accent' + (i===0?' main':'');
      b.textContent = (i+1);
      accentRow.appendChild(b);
    }
  }

  function clickAt(time, isAccent){
    const osc = actx.createOscillator();
    const env = actx.createGain();
    const freq = isAccent ? 1100 : 800;
    const dur  = 0.06;

    osc.type = 'square';
    osc.frequency.value = freq;

    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(0.6, time + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(env).connect(actx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  function startMetronome(){
    ensureAudio();
    if(isRunning) return;
    isRunning = true;
    step = 0;

    const tick = () => {
      const msPerBeat = 60000 / bpm;
      const isAccent = (step % meter) === 0;
      const t = actx.currentTime + 0.001;
      clickAt(t, isAccent);

      // UI
      [...accentRow.children].forEach((el, i) => {
        el.classList.toggle('main', i === (step % meter));
      });

      step++;
      tickTimer = setTimeout(tick, msPerBeat);
    };
    tick();
  }

  function stopMetronome(){
    isRunning = false;
    clearTimeout(tickTimer);
    tickTimer = null;
    [...accentRow.children].forEach((el, i) => {
      el.classList.toggle('main', i === 0);
    });
    step = 0;
  }

  function restartIfRunning(){
    if(isRunning){
      stopMetronome();
      startMetronome();
    }
  }

  // --- Eventos ---
  btnPlayIntro.addEventListener('click', async () => {
    try {
      if(!actx) ensureAudio();
      if(introAudio.paused){
        await introAudio.play();
        btnPlayIntro.textContent = '⏸ Pausar intro';
      } else {
        introAudio.pause();
        btnPlayIntro.textContent = '▶ Escuchar intro';
      }
    } catch(e){
      console.warn(e);
    }
  });
  introAudio.addEventListener('ended', () => {
    btnPlayIntro.textContent = '▶ Escuchar intro';
  });

  meterSel.addEventListener('change', (e)=>{
    meter = parseInt(e.target.value,10);
    renderAccents();
    restartIfRunning();
  });
  bpmSlider.addEventListener('input', (e)=>{
    setBpm(e.target.value);
    restartIfRunning();
  });

  btnStart.addEventListener('click', startMetronome);
  btnStop.addEventListener('click', stopMetronome);

  // init
  setBpm(bpm);
  renderAccents();
})();
