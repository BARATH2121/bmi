// Intro page logic
const introPage = document.getElementById('introPage');
const calcPage = document.getElementById('calcPage');
const startBtn = document.getElementById('startBtn');

if (introPage && calcPage && startBtn) {
  startBtn.addEventListener('click', () => {
    introPage.classList.add('hidden');
    calcPage.classList.remove('hidden');
  });
}
// Elements
const heightEl = document.getElementById('height');
const weightEl = document.getElementById('weight');
const heightFt = document.getElementById('heightFt');
const heightIn = document.getElementById('heightIn');
const weightLb = document.getElementById('weightLb');

const ageEl = document.getElementById('age');
const genderEl = document.getElementById('gender');

const btnCalc = document.getElementById('calc');
const btnReset = document.getElementById('reset');

const output = document.getElementById('output');
const bmiText = document.getElementById('bmiVal');
const catText = document.getElementById('category');
const rangeText = document.getElementById('normalRange');

const adviceUl = document.getElementById('advice');
const foodBody = document.querySelector('#foodTable tbody');

const gaugeArc = document.getElementById('gaugeArc');
const bmiGaugeVal = document.getElementById('bmiGaugeVal');

const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');

const toggleTheme = document.getElementById('toggleTheme');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');

// Hints
const heightHint = document.getElementById('heightHint');
const weightHint = document.getElementById('weightHint');
const ageHint = document.getElementById('ageHint');
const heightImpHint = document.getElementById('heightImpHint');
const weightLbHint = document.getElementById('weightLbHint');

// Unit groups
const unitRadios = document.querySelectorAll('input[name="units"]');
const metricInputs = document.getElementById('metricInputs');
const imperialInputs = document.getElementById('imperialInputs');

// Food plans
const foodCharts = {
  Underweight:[
    ['Breakfast','Oatmeal with whole milk, nuts & banana'],
    ['Mid-morning','Peanut-butter smoothie'],
    ['Lunch','Brown rice, chickpea curry, mixed salad + yogurt'],
    ['Snack','Trail mix + dried fruits'],
    ['Dinner','Grilled salmon, quinoa, steamed veggies, olive-oil drizzle']
  ],
  Normal:[
    ['Breakfast','2 boiled eggs, whole-wheat toast, orange'],
    ['Mid-morning','Apple & 10 almonds'],
    ['Lunch','Grilled chicken wrap with veggies'],
    ['Snack','Greek yogurt with berries'],
    ['Dinner','Stir-fried tofu & veggies with brown rice']
  ],
  Overweight:[
    ['Breakfast','Veggie omelette, 1 slice whole-grain bread'],
    ['Mid-morning','Carrot sticks & hummus'],
    ['Lunch','Quinoa salad with beans, cucumber, tomato'],
    ['Snack','1 pear'],
    ['Dinner','Baked cod, sweet-potato mash, steamed broccoli']
  ],
  Obese:[
    ['Breakfast','Green smoothie (spinach, cucumber, apple, chia)'],
    ['Mid-morning','Handful of walnuts'],
    ['Lunch','Large mixed-leaf salad + grilled turkey strips'],
    ['Snack','Low-fat cottage cheese & pineapple'],
    ['Dinner','Grilled vegetable soup + small lentil portion']
  ]
};

// Persisted preferences
initTheme();
loadSavedInputs();

// Events
toggleTheme.addEventListener('change', e=>{
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
});

unitRadios.forEach(r=>{
  r.addEventListener('change', onUnitChange);
});

aboutBtn.addEventListener('click', ()=>{
  if (typeof aboutModal.showModal === 'function') aboutModal.showModal();
  else alert('About: Smart BMI Calculator — client-side only, educational use.');
});

btnCalc.addEventListener('click', onCalculate);
btnReset.addEventListener('click', onReset);

copyBtn.addEventListener('click', async ()=>{
  const text = buildShareText();
  try{
    await navigator.clipboard.writeText(text);
    toast('Result copied');
  }catch{ toast('Copy not available'); }
});

shareBtn.addEventListener('click', async ()=>{
  const text = buildShareText();
  if (navigator.share) {
    try { await navigator.share({ title:'My BMI Result', text }); }
    catch {}
  } else {
    try{
      await navigator.clipboard.writeText(text);
      toast('Shared to clipboard');
    }catch{ toast('Share not available'); }
  }
});

// Core
function onUnitChange(){
  const unit = getUnit();
  if (unit==='metric'){
    imperialInputs.classList.add('hidden');
    metricInputs.classList.remove('hidden');
  } else {
    metricInputs.classList.add('hidden');
    imperialInputs.classList.remove('hidden');
  }
}

function onCalculate(){
  // Read inputs & validate
  const unit = getUnit();
  const age = parseInt(ageEl.value,10);
  if (!age || age<5 || age>120){ ageHint.textContent='Enter age 5–120'; return; }
  else ageHint.textContent='';

  let hMeters, wKg;
  if (unit==='metric'){
    const h = parseFloat(heightEl.value);
    const w = parseFloat(weightEl.value);
    let ok = true;
    if (!h || h<80 || h>300){ heightHint.textContent='80–300cm'; ok=false; } else heightHint.textContent='';
    if (!w || w<10 || w>350){ weightHint.textContent='10–350kg'; ok=false; } else weightHint.textContent='';
    if (!ok) return;

    hMeters = h/100;
    wKg = w;
  } else {
    const ft = parseFloat(heightFt.value);
    const inch = parseFloat(heightIn.value);
    const lb = parseFloat(weightLb.value);
    let ok = true;
    if (!ft || ft<2 || ft>8 || isNaN(inch) || inch<0 || inch>11){
      heightImpHint.textContent = '2–8ft and 0–11in'; ok=false;
    } else heightImpHint.textContent='';
    if (!lb || lb<22 || lb>770){ weightLbHint.textContent='22–770lb'; ok=false; } else weightLbHint.textContent='';
    if (!ok) return;

    const totalIn = ft*12 + inch;
    hMeters = totalIn * 0.0254;
    wKg = lb * 0.45359237;
  }

  const bmi = +(wKg / (hMeters*hMeters)).toFixed(1);
  const {category, tips} = classifyBMI(bmi, age, genderEl.value);
  const normalMin = (18.5 * hMeters*hMeters).toFixed(1);
  const normalMax = (24.9 * hMeters*hMeters).toFixed(1);

  // Update UI
  bmiText.textContent = `Your BMI: ${bmi}`;
  catText.textContent = `Category: ${category}`;
  rangeText.textContent = `Weight for normal BMI: ${normalMin}–${normalMax} kg`;

  adviceUl.innerHTML = tips.map(t=>`<li>${t}</li>`).join('');
  foodBody.innerHTML = foodCharts[category]
    .map(([meal,food])=>`<tr><td>${meal}</td><td>${food}</td></tr>`).join('');
  drawGauge(bmi);

  output.classList.remove('hidden');

  // Save to storage
  saveInputs();
}

function classifyBMI(bmi, age, gender){
  // WHO adult categories; tweak advice based on age/gender
  let category, tips;
  if (bmi < 18.5){
    category = 'Underweight';
    tips = [
      'Increase calorie-dense whole foods',
      'Strength-train 3×/week',
      'Consider a dietitian if weight loss is unexplained'
    ];
  } else if (bmi < 25){
    category = 'Normal';
    tips = [
      'Maintain balanced meals across the week',
      '150–300 min/week moderate activity',
      'Keep sleep 7–9 hours for recovery'
    ];
  } else if (bmi < 30){
    category = 'Overweight';
    tips = [
      'Reduce sugary drinks/ultra-processed snacks',
      '40 min brisk walk most days',
      'Track calories for awareness'
    ];
  } else {
    category = 'Obese';
    tips = [
      'Seek a personalised medical/nutrition plan',
      'Aim for gradual 5–10% loss over 6 months',
      'Combine cardio + resistance training'
    ];
  }

  // Light personalization
  if (age < 18){
    tips.unshift('BMI for under 18 differs; consult pediatric guidance');
  } else if (age > 60){
    tips.unshift('For seniors, focus on function and strength preservation');
  }
  if (gender === 'female'){
    tips.push('Ensure adequate iron, calcium, and protein intake');
  }

  return {category, tips};
}

// Gauge: map BMI 10–40 -> 0–1 arc fill
function drawGauge(bmi){
  const clamped = Math.max(10, Math.min(40, bmi));
  const t = (clamped - 10) / 30; // 0..1
  const start = {x:10,y:60};
  const endX = 10 + 100 * t;
  const end = {x:endX,y:60};
  // sweep flag fixed (semi circle). But we want an arc rising up:
  // Use polar to arc on circle center (60,60), radius 50, angle 180deg * t
  const angle = Math.PI * t; // 0..π
  const ex = 60 + 50 * Math.cos(Math.PI - angle);
  const ey = 60 - 50 * Math.sin(Math.PI - angle);
  const largeArc = t > 0.5 ? 1 : 0;
  const d = `M10,60 A50,50 0 ${largeArc} 1 ${ex.toFixed(2)},${ey.toFixed(2)}`;
  gaugeArc.setAttribute('d', d);

  // Color by category
  let color = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  if (bmi < 18.5) color = '#0ea5e9';
  else if (bmi < 25) color = '#0ca678';
  else if (bmi < 30) color = '#f59f00';
  else color = '#e03131';
  gaugeArc.style.stroke = color;

  bmiGaugeVal.textContent = isFinite(bmi) ? bmi : '--';
}

function getUnit(){
  return [...unitRadios].find(r=>r.checked)?.value || 'metric';
}

function buildShareText(){
  const cat = catText.textContent || '';
  const bmi = bmiText.textContent || '';
  return `Smart BMI Calculator\n${bmi}\n${cat}`;
}

function saveInputs(){
  const unit = getUnit();
  const data = {
    unit,
    age: ageEl.value,
    gender: genderEl.value,
    height: heightEl.value,
    weight: weightEl.value,
    heightFt: heightFt.value,
    heightIn: heightIn.value,
    weightLb: weightLb.value,
    theme: document.body.classList.contains('dark') ? 'dark' : 'light'
  };
  localStorage.setItem('bmi_inputs', JSON.stringify(data));
}

function loadSavedInputs(){
  try{
    const data = JSON.parse(localStorage.getItem('bmi_inputs')||'{}');
    if (!data) return;
    ageEl.value = data.age || '';
    genderEl.value = data.gender || 'unspecified';

    if (data.unit === 'imperial'){
      document.querySelector('input[value="imperial"]').checked = true;
      onUnitChange();
    }
    heightEl.value = data.height || '';
    weightEl.value = data.weight || '';
    heightFt.value = data.heightFt || '';
    heightIn.value = data.heightIn || '';
    weightLb.value = data.weightLb || '';
  }catch{}
}

function initTheme(){
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? (saved==='dark') : prefersDark;
  document.body.classList.toggle('dark', isDark);
  toggleTheme.checked = isDark;
}

function onReset(){
  [heightEl, weightEl, heightFt, heightIn, weightLb, ageEl].forEach(el=>el.value='');
  genderEl.value='unspecified';
  output.classList.add('hidden');
  bmiGaugeVal.textContent='--';
  drawGauge(10);
  localStorage.removeItem('bmi_inputs');
  toast('Cleared');
}

// Simple toast
let toastTimer;
function toast(msg){
  let t = document.getElementById('toast');
  if (!t){
    t = document.createElement('div');
    t.id='toast';
    Object.assign(t.style,{
      position:'fixed',bottom:'18px',left:'50%',transform:'translateX(-50%)',
      background:'rgba(0,0,0,.75)',color:'#fff',padding:'10px 14px',borderRadius:'8px',
      fontSize:'14px',zIndex:99,opacity:'0',transition:'opacity .2s'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity='1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.style.opacity='0',1600);
}

// Initialize gauge baseline
drawGauge(10);
