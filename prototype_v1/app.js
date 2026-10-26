import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// OPTIONAL CLOUD SETUP: paste your Firebase web config here after creating a Firebase project.
// Until configured, the app works in local demo mode using this browser's localStorage.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const cloudConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
let db = null;
if (cloudConfigured) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
  } catch (error) { console.warn('Firebase setup issue; using local mode.', error); }
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const storage = {
  get(key, fallback) { try { const v = localStorage.getItem('studysphere_' + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('studysphere_' + key, JSON.stringify(value)); } catch {} }
};
const starterRooms = [
  {id:'dsa',name:'DSA & Coding',category:'Technology',vibe:'Quiet focus',icon:'⌘',tone:'purple',description:'Solve problems, share progress, level up together.',members:18,host:'Maya'},
  {id:'exam',name:'Exam Prep Corner',category:'Exam prep',vibe:'Accountability',icon:'✎',tone:'orange',description:'A calm corner for revision and exam prep.',members:24,host:'Aarav'},
  {id:'cloud',name:'Cloud Computing',category:'Technology',vibe:'Study buddies',icon:'☁',tone:'blue',description:'Learn cloud concepts one topic at a time.',members:12,host:'Isha'},
  {id:'silent',name:'Silent Study Club',category:'General',vibe:'Quiet focus',icon:'☾',tone:'green',description:'No pressure. Just you, your goals, and focus.',members:31,host:'Noah'},
  {id:'creative',name:'Creative Minds',category:'Creative',vibe:'Study buddies',icon:'✿',tone:'pink',description:'Read, write, sketch, and make something new.',members:9,host:'Zoya'},
  {id:'morning',name:'Morning Momentum',category:'General',vibe:'Accountability',icon:'☀',tone:'yellow',description:'Start the day with intention and good energy.',members:15,host:'Riya'}
];
let rooms = storage.get('rooms', starterRooms);
let sessions = storage.get('sessions', []);
let dailyGoal = storage.get('goal', 120);
let studentName = storage.get('name', 'Student');
let intention = storage.get('intention', '');
let currentRoom = null;
let timerSeconds = 25 * 60;
let selectedMinutes = 25;
let timerInterval = null;
let timerRunning = false;
let toastTimeout;

function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function saveAll() { storage.set('rooms', rooms); storage.set('sessions', sessions); storage.set('goal', dailyGoal); storage.set('name', studentName); storage.set('intention', intention); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600); }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todaysSessions() { return sessions.filter(s => s.date === todayKey()); }
function totalMinutes(items=sessions) { return items.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0); }
function getInitials(name) { return name.split(/\s+/).filter(Boolean).slice(0,3).map(s => s[0].toUpperCase()).join('') || 'S'; }
function memberDots(count) { const names=['M','A','I','J','S']; return `<div class="member-stack">${names.slice(0,Math.min(3,count)).map((n,i)=>`<span class="member-dot" style="background:${['#e7e1ff','#dff4e8','#ffe9dc'][i]}">${n}</span>`).join('')}<span class="member-count">${count} studying</span></div>`; }
function roomCard(room) { return `<article class="room-card" data-room="${escapeHTML(room.id)}" tabindex="0" role="button" aria-label="Open ${escapeHTML(room.name)} room"><div class="room-card-top"><div class="room-illustration ${escapeHTML(room.tone)}">${escapeHTML(room.icon)}</div><span class="room-tag">${escapeHTML(room.category)}</span></div><h3>${escapeHTML(room.name)}</h3><p class="room-description">${escapeHTML(room.description)}</p><div class="room-card-footer">${memberDots(room.members)}<button class="join-link" data-join="${escapeHTML(room.id)}">Join room ↗</button></div></article>`; }
function renderRooms() {
  const home = $('#homeRooms'); const all = $('#allRooms');
  home.innerHTML = rooms.slice(0,3).map(roomCard).join('');
  const q = ($('#roomSearch')?.value || '').trim().toLowerCase(); const filter = $('#roomFilter')?.value || 'all';
  const filtered = rooms.filter(r => (filter === 'all' || r.category === filter) && `${r.name} ${r.category} ${r.description}`.toLowerCase().includes(q));
  all.innerHTML = filtered.length ? filtered.map(roomCard).join('') : '<div class="no-results">No rooms found. Try another search or create a new room ✦</div>';
  $('#roomNavCount').textContent = rooms.length;
  $$('[data-room]').forEach(card => { card.addEventListener('click', e => { if (e.target.closest('[data-join]')) return; openRoom(card.dataset.room); }); card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){e.preventDefault();openRoom(card.dataset.room);} }); });
  $$('[data-join]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openRoom(btn.dataset.join); }));
}
function updateDashboard() {
  const today = todaysSessions(); const mins = totalMinutes(today); const allMins = totalMinutes(); const percent = Math.min(100, Math.round(mins / Math.max(1,dailyGoal) * 100));
  $('#totalMinutes').textContent = allMins; $('#sessionCount').textContent = sessions.length; $('#goalPercent').textContent = percent; $('#goalProgressBar').style.width = percent + '%'; $('#goalMinutesText').textContent = `${mins} of ${dailyGoal} min`;
  $('#focusSessionCount').textContent = `${today.length} sessions`; $('#focusMinutesCount').textContent = `${mins} min`; $('#focusGoalCount').textContent = `${dailyGoal} min`;
  $('#progressHours').textContent = allMins; $('#progressSessions').textContent = sessions.length; $('#progressGoal').textContent = dailyGoal;
  $('#profileName').textContent = studentName; $$('.avatar').forEach(a => a.textContent = getInitials(studentName));
  $('#intentionInput').value = intention;
  const history = $('#historyList');
  history.innerHTML = sessions.length ? [...sessions].reverse().slice(0,8).map(s => `<div class="history-row"><div class="history-icon">◷</div><div class="history-row-copy"><strong>${escapeHTML(s.label || 'Focus session')}</strong><small>${escapeHTML(s.date || '')} · ${escapeHTML(s.mode || 'Focus time')}</small></div><span class="history-duration">${Number(s.minutes)||0} min</span></div>`).join('') : '<div class="empty-state">No sessions yet. Start your first focus session and your progress will show up here ✦</div>';
  $('#cloudStatus').textContent = db ? 'Cloud connected' : 'Local demo mode'; $('#progressCloudBadge').textContent = db ? 'CLOUD CONNECTED' : 'LOCAL MODE';
  $('#todayDate').textContent = new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
}
function navigate(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $('#breadcrumbCurrent').textContent = ({home:'Overview',rooms:'Study rooms',focus:'Focus timer',progress:'My progress'})[view] || 'Overview';
  $('#sidebar').classList.remove('mobile-open'); window.scrollTo({top:0,behavior:'smooth'});
}
function openModal(id) { const el = document.getElementById(id); el.classList.add('open'); el.setAttribute('aria-hidden','false'); setTimeout(() => el.querySelector('input,select,button')?.focus(),80); }
function closeModal(el) { el.classList.remove('open'); el.setAttribute('aria-hidden','true'); }
function openRoom(id) {
  const room = rooms.find(r => r.id === id); if (!room) return; currentRoom = room;
  $('#roomDetailContent').innerHTML = `<div class="detail-hero"><div class="room-illustration ${escapeHTML(room.tone)}">${escapeHTML(room.icon)}</div><h2>${escapeHTML(room.name)}</h2><p>${escapeHTML(room.description)}</p></div><div class="detail-meta"><span>✦ ${escapeHTML(room.category)}</span><span>☾ ${escapeHTML(room.vibe)}</span><span>◉ ${room.members} studying</span></div><div class="detail-members">${['M','A','I','J','S'].map((n,i)=>`<span class="member-dot" style="background:${['#e7e1ff','#dff4e8','#ffe9dc','#e7f2ff','#ffe8f1'][i]}">${n}</span>`).join('')}<small>Join a community of learners</small></div><button class="primary-button full-width" id="enterRoomButton">Enter study room ↗</button>`;
  openModal('roomDetailModal'); $('#enterRoomButton').addEventListener('click', () => { room.members += 1; saveAll(); renderRooms(); closeModal($('#roomDetailModal')); navigate('focus'); showToast(`Welcome to ${room.name}! Your focus timer is ready.`); });
}
function setTimerPreset(minutes) {
  selectedMinutes = minutes; timerSeconds = minutes*60; stopTimer();
  $$('.preset').forEach(b => b.classList.toggle('active', Number(b.dataset.minutes)===minutes));
  $('#timerMode').textContent = minutes === 25 ? 'FOCUS TIME' : minutes === 5 ? 'SHORT BREAK' : 'LONG BREAK';
  $('#timerHint').textContent = minutes === 25 ? 'You’ve got this.' : 'Rest and recharge.';
  $('#timerStart').textContent = '▶ Start ' + (minutes === 25 ? 'focus' : 'break'); updateTimerDisplay();
}
function updateTimerDisplay() {
  const m = Math.floor(timerSeconds/60); const s = timerSeconds%60; $('#timerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const degrees = 360 * (timerSeconds/(selectedMinutes*60)); $('#timerRing').style.background = `conic-gradient(#8876df ${degrees}deg,#e9e5ff ${degrees}deg)`;
}
function stopTimer() { if(timerInterval) clearInterval(timerInterval); timerInterval=null; timerRunning=false; $('#timerStart').textContent = '▶ Start ' + (selectedMinutes===25?'focus':'break'); }
async function saveSession(minutes, mode) {
  const record = {id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),minutes,mode,label:mode==='Focus time'?'Focus session':mode,date:todayKey(),createdAt:new Date().toISOString()};
  sessions.push(record); saveAll(); updateDashboard();
  if (db) { try { await addDoc(collection(db,'studySessions'),{...record,createdAt:serverTimestamp()}); showToast('Session saved to your cloud and progress updated ✦'); } catch(err) { console.error(err); showToast('Saved on this device. Cloud write failed — check Firestore rules.'); } }
  else showToast('Focus session complete! Your progress has been saved ✦');
}
function toggleTimer() {
  if(timerRunning) { stopTimer(); showToast('Timer paused. Take your time.'); return; }
  timerRunning=true; $('#timerStart').textContent='Ⅱ Pause timer';
  timerInterval=setInterval(() => { timerSeconds--; updateTimerDisplay(); if(timerSeconds<=0){ stopTimer(); timerSeconds=0; updateTimerDisplay(); if(selectedMinutes===25) saveSession(25,'Focus time'); else showToast('Break complete. Ready when you are!'); setTimeout(()=>setTimerPreset(25),700); } },1000);
  showToast('Timer started. You’ve got this!');
}
async function syncCloudRooms() {
  if (!db) return;
  try { onSnapshot(collection(db,'studyRooms'), snapshot => { const remote = snapshot.docs.map(d=>({id:d.id,...d.data()})); if(remote.length){ const localCustom=rooms.filter(r=>!starterRooms.some(s=>s.id===r.id)); rooms=[...starterRooms,...remote.filter(r=>!starterRooms.some(s=>s.id===r.id)),...localCustom.filter(r=>!remote.some(x=>x.id===r.id))]; saveAll(); renderRooms(); } }, error=>console.warn('Room sync unavailable',error)); }
  catch(error){ console.warn(error); }
}

$$('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
$$('[data-view="rooms"].text-button').forEach(b=>b.addEventListener('click',()=>navigate('rooms')));
$('#createRoomTop').addEventListener('click',()=>openModal('roomModal')); $('#createRoomPage').addEventListener('click',()=>openModal('roomModal'));
$('#startFocusHero').addEventListener('click',()=>navigate('focus'));
$('#roomSearch').addEventListener('input',renderRooms); $('#roomFilter').addEventListener('change',renderRooms);
$$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>closeModal(b.closest('.modal-backdrop'))));
$$('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal(backdrop)}));
$('#createRoomForm').addEventListener('submit',async e=>{e.preventDefault();const name=$('#newRoomName').value.trim();if(!name)return;const cat=$('#newRoomCategory').value;const icons={Technology:['⌘','purple'], 'Exam prep':['✎','orange'],Creative:['✿','pink'],General:['☾','green']};const [icon,tone]=icons[cat];const room={id:'room-'+Date.now(),name,category:cat,vibe:$('#newRoomVibe').value,icon,tone,description:`A welcoming space for ${name.toLowerCase()} and steady progress.`,members:1,host:studentName};rooms.unshift(room);saveAll();renderRooms();closeModal($('#roomModal'));e.target.reset();navigate('rooms');showToast('Your study room has been created!');if(db){try{const {id,...payload}=room;await addDoc(collection(db,'studyRooms'),payload);}catch(err){console.warn(err);showToast('Room created locally; cloud save needs Firestore permissions.');}}});
$$('.preset').forEach(b=>b.addEventListener('click',()=>setTimerPreset(Number(b.dataset.minutes)))); $('#timerStart').addEventListener('click',toggleTimer); $('#timerReset').addEventListener('click',()=>{setTimerPreset(selectedMinutes);showToast('Timer reset. Ready when you are.');});
$('#saveIntention').addEventListener('click',()=>{intention=$('#intentionInput').value.trim();saveAll();showToast('Your intention is saved ✦');});
function changeGoal(){const value=prompt('Set your daily study goal in minutes:',String(dailyGoal));if(value===null)return;const n=Number(value);if(!Number.isFinite(n)||n<1||n>1440){showToast('Enter a goal between 1 and 1440 minutes.');return;}dailyGoal=Math.round(n);saveAll();updateDashboard();showToast('Daily goal updated!');}
$('#editGoal').addEventListener('click',changeGoal); $('#editGoalProgress').addEventListener('click',changeGoal);
$('#clearHistory').addEventListener('click',()=>{if(!sessions.length){showToast('Your history is already empty.');return;}if(confirm('Clear all saved study sessions from this device?')){sessions=[];saveAll();updateDashboard();showToast('Study history cleared.');}});
$('#profileButton').addEventListener('click',()=>openModal('nameModal')); $('#nameForm').addEventListener('submit',e=>{e.preventDefault();studentName=$('#studentNameInput').value.trim()||'Student';saveAll();updateDashboard();closeModal($('#nameModal'));showToast(`Welcome, ${studentName}!`);});
$('#helpButton').addEventListener('click',()=>showToast('Tip: join a room, then use Focus mode to start a Pomodoro session.'));
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('mobile-open'));

// If the project is configured for Firebase, subscribe to shared rooms. Local demo remains usable without it.
if(db){ syncCloudRooms(); }
renderRooms(); updateDashboard(); updateTimerDisplay();
if(studentName==='Student' && !storage.get('welcomed',false)){setTimeout(()=>openModal('nameModal'),500);storage.set('welcomed',true);}
