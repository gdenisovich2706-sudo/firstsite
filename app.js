const KEY="my_day_v2";
const today=()=>new Date().toISOString().slice(0,10);
let data=JSON.parse(localStorage.getItem(KEY)||"null")||{tasks:[],goals:[{id:id(),name:"Вайбкодинг",done:0,target:50},{id:id(),name:"Java",done:0,target:30}],habits:[{id:id(),name:"Вайбкодинг",days:[]},{id:id(),name:"Учёба",days:[]}],logs:[],pom:0,theme:"dark"};
function id(){return Math.random().toString(36).slice(2,10)}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtMin(m){m=Math.round(m||0);return m<60?m+"м":Math.floor(m/60)+"ч "+m%60+"м"}
function goalName(g){return data.goals.find(x=>x.id===g)?.name||"Без цели"}

function render(){
  const d=today(), ts=data.tasks.filter(x=>x.date===d), done=ts.filter(x=>x.done).length;
  document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"});
  document.getElementById("dayDone").textContent=`${done}/${ts.length}`;
  document.getElementById("dashTasks").textContent=`${done}/${ts.length}`;
  const mins=data.logs.filter(x=>x.date===d).reduce((a,x)=>a+x.min,0);
  document.getElementById("dashTime").textContent=fmtMin(mins);
  document.getElementById("dashPom").textContent=data.logs.filter(x=>x.date===d&&x.pom).length;
  document.getElementById("dashStreak").textContent=streak()+" 🔥";
  renderTasks(); renderGoals(); renderHabits(); renderStats(); fillGoals();
}
function taskHTML(t){
  return `<div class="task ${t.done?"done":""}">
    <button class="check" onclick="toggleTask('${t.id}')">${t.done?"✓":""}</button>
    <div class="task-main"><div class="task-title">${esc(t.name)}</div><div class="task-meta">${t.time?t.time+" · ":""}${t.priority==="high"?"🔴":t.priority==="low"?"🟢":"🟡"} · ${esc(goalName(t.goal))}${t.note?" · "+esc(t.note):""}</div></div>
    <div class="task-actions"><button class="icon edit" onclick="editTask('${t.id}')">✏️</button><button class="icon" onclick="deleteTask('${t.id}')">🗑️</button></div>
  </div>`
}
function renderTasks(){
  const q=(document.getElementById("taskSearch")?.value||"").toLowerCase(), f=document.getElementById("taskFilter")?.value||"all", d=today();
  let arr=data.tasks.filter(t=>(!q||t.name.toLowerCase().includes(q))&&(f==="all"||f==="today"&&t.date===d||f==="open"&&!t.done||f==="done"&&t.done));
  document.getElementById("tasksList").innerHTML=arr.length?arr.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(taskHTML).join(""):"<p class='muted'>Задач пока нет. Самое время добавить первую 🚀</p>";
  document.getElementById("todayTasks").innerHTML=data.tasks.filter(t=>t.date===d).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99")).slice(0,6).map(taskHTML).join("")||"<p class='muted'>На сегодня задач нет.</p>";
}
function renderGoals(){
  document.getElementById("goalsList").innerHTML=data.goals.map(g=>{let p=Math.min(100,g.target?g.done/g.target*100:0);return `<div class="goal-card"><div class="goal-title"><h3>${esc(g.name)}</h3><b>${fmtMin(g.done*60).replace("ч ","ч ")}</b></div><div class="muted">${g.done} / ${g.target} часов</div><div class="progress"><div class="bar" style="width:${p}%"></div></div><div class="goal-actions"><button onclick="addGoalTime('${g.id}',.5)">+30 мин</button><button onclick="addGoalTime('${g.id}',1)">+1 час</button><button onclick="deleteGoal('${g.id}')">🗑️</button></div></div>`}).join("");
  document.getElementById("goalMini").innerHTML=data.goals.slice(0,4).map(g=>{let p=Math.min(100,g.done/g.target*100);return `<div class="barline"><span>${esc(g.name)}</span><div class="progress"><div class="bar" style="width:${p}%"></div></div><b>${g.done}/${g.target}ч</b></div>`}).join("");
  document.getElementById("timerGoal").innerHTML=`<option value="">Без цели</option>`+data.goals.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
}
function renderHabits(){
  const d=today();
  document.getElementById("habitsList").innerHTML=data.habits.map(h=>`<div class="habit-card"><div class="habit-row"><strong>🔥 ${esc(h.name)}</strong><button class="${h.days.includes(d)?"done":""}" onclick="toggleHabit('${h.id}')">${h.days.includes(d)?"✓ Сегодня выполнено":"Отметить"}</button></div><small>Выполнено дней: ${h.days.length}</small></div>`).join("");
  document.getElementById("habitMini").innerHTML=data.habits.map(h=>`<div class="habit-row"><span>${esc(h.name)}</span><button class="${h.days.includes(d)?"done":""}" onclick="toggleHabit('${h.id}')">${h.days.includes(d)?"✓":"Выполнить"}</button></div>`).join("")||"<p class='muted'>Добавь первую привычку.</p>";
}
function renderStats(){
  document.getElementById("statTasks").textContent=data.tasks.length;
  document.getElementById("statDone").textContent=data.tasks.filter(t=>t.done).length;
  document.getElementById("statHours").textContent=(data.logs.reduce((a,x)=>a+x.min,0)/60).toFixed(1);
  document.getElementById("statPom").textContent=data.pom;
  document.getElementById("statGoals").innerHTML=data.goals.map(g=>{let mins=data.logs.filter(x=>x.goal===g.id).reduce((a,x)=>a+x.min,0);return `<div class="barline"><span>${esc(g.name)}</span><div class="progress"><div class="bar" style="width:${Math.min(100,mins/(g.target*60)*100)}%"></div></div><b>${fmtMin(mins)}</b></div>`}).join("");
}
function streak(){let n=0,d=new Date();while(true){let s=d.toISOString().slice(0,10);if(data.tasks.some(t=>t.date===s&&t.done)||data.habits.some(h=>h.days.includes(s))){n++;d.setDate(d.getDate()-1)}else break}return n}
function fillGoals(){let opts=`<option value="">Без цели</option>`+data.goals.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");document.getElementById("taskGoal").innerHTML=opts}
function openModal(t=null){document.getElementById("modal").classList.remove("hidden");document.getElementById("modalTitle").textContent=t?"Изменить задачу":"Новая задача";document.getElementById("taskId").value=t?.id||"";document.getElementById("taskName").value=t?.name||"";document.getElementById("taskDate").value=t?.date||today();document.getElementById("taskTime").value=t?.time||"";document.getElementById("taskPriority").value=t?.priority||"normal";document.getElementById("taskGoal").value=t?.goal||"";document.getElementById("taskReminder").value=t?.reminder||"0";document.getElementById("taskNote").value=t?.note||""}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.getElementById("taskForm").onsubmit=e=>{e.preventDefault();let x={id:document.getElementById("taskId").value||id(),name:document.getElementById("taskName").value,date:document.getElementById("taskDate").value,time:document.getElementById("taskTime").value,priority:document.getElementById("taskPriority").value,goal:document.getElementById("taskGoal").value,reminder:document.getElementById("taskReminder").value,note:document.getElementById("taskNote").value,done:false};let i=data.tasks.findIndex(t=>t.id===x.id);if(i>=0)x.done=data.tasks[i].done,data.tasks[i]=x;else data.tasks.push(x);closeModal();save()}
function toggleTask(i){let t=data.tasks.find(x=>x.id===i);t.done=!t.done;save()}
function deleteTask(i){if(confirm("Удалить задачу?")){data.tasks=data.tasks.filter(t=>t.id!==i);save()}}
function editTask(i){openModal(data.tasks.find(t=>t.id===i))}
function addGoalTime(i,h){let g=data.goals.find(x=>x.id===i);g.done=+(g.done+h).toFixed(2);save()}
function deleteGoal(i){if(confirm("Удалить цель?")){data.goals=data.goals.filter(g=>g.id!==i);save()}}
function toggleHabit(i){let h=data.habits.find(x=>x.id===i),d=today();h.days.includes(d)?h.days=h.days.filter(x=>x!==d):h.days.push(d);save()}
document.getElementById("addGoal").onclick=()=>{let name=prompt("Название цели?");if(!name)return;let target=+prompt("Сколько часов всего?","50")||50;data.goals.push({id:id(),name,done:0,target});save()}
document.getElementById("addHabit").onclick=()=>{let name=prompt("Название привычки?");if(name){data.habits.push({id:id(),name,days:[]});save()}}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
function showPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(p).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));document.getElementById("pageTitle").textContent={dashboard:"Главная",tasks:"Задачи",goals:"Цели",habits:"Привычки",stats:"Статистика"}[p]}
document.getElementById("quickAdd").onclick=()=>openModal();document.getElementById("modalClose").onclick=closeModal;document.getElementById("taskSearch").oninput=renderTasks;document.getElementById("taskFilter").onchange=renderTasks;
document.getElementById("themeBtn").onclick=()=>{data.theme=data.theme==="dark"?"light":"dark";document.body.classList.toggle("dark",data.theme==="dark");document.body.classList.toggle("light",data.theme!=="dark");document.body.classList.toggle("light",data.theme!=="dark");document.getElementById("themeBtn").textContent=data.theme==="dark"?"☀️ Светлая тема":"🌙 Тёмная тема";save()};
document.body.classList.toggle("dark",data.theme==="dark");document.body.classList.toggle("light",data.theme!=="dark");document.getElementById("themeBtn").textContent=data.theme==="dark"?"☀️ Светлая тема":"🌙 Тёмная тема";

let timer=1500,interval=null,running=false,mode="work";
function updateTimer(){let m=Math.floor(timer/60),s=timer%60;document.getElementById("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
document.getElementById("timerStart").onclick=()=>{if(running){clearInterval(interval);running=false;document.getElementById("timerStart").textContent="Старт";return}running=true;document.getElementById("timerStart").textContent="Пауза";interval=setInterval(()=>{timer--;updateTimer();if(timer<=0){clearInterval(interval);running=false;document.getElementById("timerStart").textContent="Старт";if(mode==="work"){let goal=document.getElementById("timerGoal").value;data.logs.push({date:today(),min:25,pom:true,goal});data.pom++;save();mode="break";timer=300;document.getElementById("timerMode").textContent="Перерыв";alert("🍅 Pomodoro завершён! Отдохни 5 минут.");}else{mode="work";timer=1500;document.getElementById("timerMode").textContent="Работа";alert("⏰ Перерыв закончен. Вперёд!")}updateTimer()}},1000)}
document.getElementById("timerReset").onclick=()=>{clearInterval(interval);running=false;mode="work";timer=1500;document.getElementById("timerMode").textContent="Работа";document.getElementById("timerStart").textContent="Старт";updateTimer()}
document.getElementById("notifyBtn").onclick=async()=>{if(!("Notification"in window))return alert("Этот браузер не поддерживает уведомления.");let p=await Notification.requestPermission();alert(p==="granted"?"🔔 Уведомления включены!":"Уведомления не разрешены.")};
setInterval(()=>{data.tasks.filter(t=>t.date===today()&&t.time&&t.reminder&& !t.notified).forEach(t=>{let target=new Date(`${t.date}T${t.time}`),mins=(target-new Date())/60000;if(mins>0&&mins<=+t.reminder){if("Notification"in window&&Notification.permission==="granted")new Notification("Напоминание 🔔",{body:t.name});t.notified=true;localStorage.setItem(KEY,JSON.stringify(data))}})},30000);
render();updateTimer();