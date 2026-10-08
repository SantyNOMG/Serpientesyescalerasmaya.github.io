/* Cambia aquí los destinos. Las claves son la base de la escalera
   o la cabeza de la serpiente; los valores son sus destinos. */
const LADDERS = Object.freeze({3:22,8:30,28:55,58:77});
const SNAKES = Object.freeze({47:16,62:42,87:65,96:74});
const $ = id => document.getElementById(id);

// En base 20, los niveles se escriben de mayor a menor, de arriba abajo.
function mayaDigits(number) {
  if (!Number.isInteger(number) || number < 0) throw new RangeError('Número no válido');
  const digits = [];
  do { digits.unshift(number % 20); number = Math.floor(number / 20); } while (number);
  return digits;
}
function mayaMarkup(number) {
  return `<span class="maya" aria-hidden="true">${mayaDigits(number).map(value => {
    if(value === 0) return '<span class="maya-level"><svg class="maya-shell" viewBox="0 0 40 22" fill="none"><path d="M3 12C3 1 37 1 37 12C37 23 3 23 3 12Z M4 12Q20 21 36 12 M20 5V14 M10 7L14 14 M30 7L26 14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></span>';
    return `<span class="maya-level">${value % 5 ? `<span class="maya-dots">${'<span class="maya-dot"></span>'.repeat(value % 5)}</span>` : ''}${'<span class="maya-bar"></span>'.repeat(Math.floor(value / 5))}</span>`;
  }).join('')}</span>`;
}
// Coordenadas sobre una cuadrícula virtual de 1000 × 1000.
function coordinates(number) {
  const row = Math.floor((number - 1) / 10);
  const col = row % 2 === 0 ? (number - 1) % 10 : 9 - (number - 1) % 10;
  return {x: col * 100 + 50, y: (9 - row) * 100 + 50};
}
function inspectCell(number) {
  document.querySelector('.cell.selected')?.classList.remove('selected');
  const selected = $(`cell-${number}`);
  selected?.classList.add('selected');
  $('detail-symbol').innerHTML = mayaMarkup(number);
  $('detail-title').textContent = `CASILLA ${number}`;
  $('detail-formula').innerHTML = number < 20 ? `${number} unidades = <b>${number}</b>` : `${Math.floor(number/20)} × 20 + ${number%20} = <b>${number}</b>`;
}
function buildBoard() {
  for(let visualRow = 0; visualRow < 10; visualRow++) {
    const row = 9 - visualRow;
    for(let col = 0; col < 10; col++) {
      const n = row*10 + (row%2 === 0 ? col+1 : 10-col);
      const cell = document.createElement('button');
      cell.id = `cell-${n}`; cell.type = 'button'; cell.dataset.number = n;
      cell.className = `cell ${(row+col)%2 ? 'alt' : ''} ${n===100 ? 'finish' : n===1 ? 'start' : ''}`;
      cell.tabIndex = n===1 ? 0 : -1;
      const extra = LADDERS[n] ? `, escalera a ${LADDERS[n]}` : SNAKES[n] ? `, serpiente a ${SNAKES[n]}` : '';
      cell.setAttribute('aria-label',`Casilla ${n}${extra}. Ver número maya`);
      cell.title = `Casilla ${n}${extra}`; cell.innerHTML = mayaMarkup(n);
      cell.addEventListener('click',()=>inspectCell(n));
      cell.addEventListener('keydown',event=> {
        const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-10,ArrowDown:10}[event.key];
        if(offset===undefined) return;
        event.preventDefault();
        const index = visualRow*10+col, next = index+offset;
        if(next<0 || next>99 || (Math.abs(offset)===1 && Math.floor(next/10)!==visualRow)) return;
        cell.tabIndex=-1;
        const target=$('cells').children[next]; target.tabIndex=0; target.focus(); inspectCell(Number(target.dataset.number));
      });
      $('cells').append(cell);
    }
  }
  let paths='';
  // Estos trazos son conexiones del tablero: sus extremos determinan cada salto.
  for(const [start,end] of Object.entries(LADDERS)) {
    const a=coordinates(+start),b=coordinates(end); a.x+=30;b.x+=30;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len*10,ny=dx/len*10;
    paths+=`<g stroke="#ae8833" stroke-width="5" stroke-linecap="round"><path d="M${a.x+nx} ${a.y+ny}L${b.x+nx} ${b.y+ny}M${a.x-nx} ${a.y-ny}L${b.x-nx} ${b.y-ny}"/>`;
    for(let t=.08;t<1;t+=30/len) paths+=`<path d="M${a.x+dx*t+nx} ${a.y+dy*t+ny}L${a.x+dx*t-nx} ${a.y+dy*t-ny}"/>`;
    paths+='</g>';
  }
  for(const [start,end] of Object.entries(SNAKES)) {
    const a=coordinates(+start),b=coordinates(end);a.x+=29;b.x+=29;
    const mid=(a.y+b.y)/2;
    const d=`M${a.x} ${a.y}C${a.x+60} ${mid},${b.x-60} ${mid},${b.x} ${b.y}`;
    paths+=`<path d="${d}" fill="none" stroke="#ae7794" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#d4aec4" stroke-width="4" stroke-dasharray="3 13" stroke-linecap="round"/><ellipse cx="${a.x}" cy="${a.y}" rx="12" ry="16" fill="#94627e"/><circle cx="${a.x-5}" cy="${a.y-4}" r="2.5" fill="white"/><circle cx="${a.x+5}" cy="${a.y-4}" r="2.5" fill="white"/><path d="M${b.x} ${b.y-7}l0 18" stroke="#ae7794" stroke-width="5" stroke-linecap="round"/>`;
  }
  $('routes').innerHTML=paths;
  document.querySelectorAll('[data-maya]').forEach(el=>el.innerHTML=mayaMarkup(Number(el.dataset.maya)));
  inspectCell(24);
}
function showDie(value) {
  const positions={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
  $('die').innerHTML=Array.from({length:9},(_,i)=>`<span class="pip ${positions[value].includes(i)?'on':''}"></span>`).join('');
  $('die').setAttribute('aria-label',`Dado: ${value}`);
}
buildBoard();
showDie(1);

let state = {positions:[0,0],turn:0,busy:false,winner:null};
// Cada reinicio invalida las animaciones pendientes de la partida anterior.
let gameVersion = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pause = ms => new Promise(resolve=>setTimeout(resolve,reducedMotion.matches ? 0 : ms));

function moveResult(position,roll) {
  const landing = position + roll;
  if(landing > 100) return {landing:position,destination:position,kind:'overshoot'};
  if(LADDERS[landing]) return {landing,destination:LADDERS[landing],kind:'ladder'};
  if(SNAKES[landing]) return {landing,destination:SNAKES[landing],kind:'snake'};
  return {landing,destination:landing,kind:landing===100 ? 'win' : 'normal'};
}
function renderPlayers() {
  for(let i=0;i<2;i++) {
    const position = state.positions[i];
    $(`position-${i}`).textContent=position===0 ? 'En la salida' : `Casilla ${position}`;
    $(`score-${i}`).innerHTML=`${position}<span>/100</span>`;
    $(`player-${i}`).classList.toggle('active',state.winner===null && state.turn===i);
    const token=$(`token-${i}`);
    token.hidden=position===0;
    if(position) {
      const {x,y}=coordinates(position);
      token.style.left=`${(x+29)/10}%`;
      token.style.top=`${(y+(i===0?-22:22))/10}%`;
    }
  }
  const player=state.winner ?? state.turn;
  $('turn-title').innerHTML=`${state.winner===null?'Jugador':'¡Ganó el jugador'} ${player+1}${state.winner===null?'':'!'} <span class="player-dot ${player===0?'jade':'clay'}"></span>`;
  $('turn-label').textContent=state.winner===null ? 'ES TU TURNO' : '¡LLEGASTE A LA META!';
  $('roll-button').disabled=state.busy || state.winner!==null;
  $('roll-button').innerHTML=state.winner!==null ? 'Partida terminada' : state.busy ? 'En movimiento…' : 'Lanzar dado <span aria-hidden="true">⚄</span>';
  document.querySelector('.play-card').classList.toggle('winner',state.winner!==null);
}
async function rollDice() {
  if(state.busy || state.winner!==null) return;
  state.busy=true;
  const version=gameVersion,player=state.turn;
  renderPlayers();
  $('game-message').textContent=`Jugador ${player+1} está lanzando…`;
  $('die').classList.add('rolling');
  // Un único resultado aleatorio decide el movimiento; los demás son visuales.
  const roll=Math.floor(Math.random()*6)+1;
  for(let i=0;i<8;i++) {
    showDie(i%6+1); await pause(65);
    if(version!==gameVersion) return;
  }
  $('die').classList.remove('rolling'); showDie(roll);
  $('dice-result').textContent=`Jugador ${player+1} sacó ${roll}`;
  const start=state.positions[player],result=moveResult(start,roll);
  if(result.kind==='overshoot') {
    $('game-message').textContent=`Necesitabas ${100-start}. Te quedas en ${start}; turno del jugador ${2-player}.`;
    await pause(500);
    if(version!==gameVersion) return;
  } else {
    for(let n=start+1;n<=result.landing;n++) {
      state.positions[player]=n;renderPlayers();await pause(180);
      if(version!==gameVersion) return;
    }
    if(result.kind==='ladder' || result.kind==='snake') {
      $('game-message').textContent=result.kind==='ladder' ? `¡Escalera! Subes de ${result.landing} a ${result.destination}.` : `¡Serpiente! Bajas de ${result.landing} a ${result.destination}.`;
      await pause(500); if(version!==gameVersion) return;
      state.positions[player]=result.destination;renderPlayers();await pause(350);
      if(version!==gameVersion) return;
    }
    inspectCell(result.destination);
    if(result.destination===100) {
      state.winner=player;state.busy=false;renderPlayers();
      $('game-message').textContent=`¡Jugador ${player+1}, ganaste! Llegaste exactamente a 100: cinco veintenas y cero unidades.`;
      return;
    }
    const event=result.kind==='ladder' ? `Escalera: ${result.landing} → ${result.destination}. ` : result.kind==='snake' ? `Serpiente: ${result.landing} → ${result.destination}. ` : `Llegaste a ${result.destination}. `;
    $('game-message').textContent=event+`Ahora juega el jugador ${2-player}.`;
  }
  state.turn=1-player;state.busy=false;renderPlayers();
  return {roll,positions:[...state.positions],turn:state.turn+1,winner:state.winner};
}
function resetGame() {
  gameVersion++;
  state={positions:[0,0],turn:0,busy:false,winner:null};
  $('die').classList.remove('rolling');showDie(1);
  $('die').setAttribute('aria-label','Dado listo para lanzar');
  $('dice-result').textContent='¡Que empiece el viaje!';
  $('game-message').textContent='Jugador 1, lanza el dado para comenzar.';
  inspectCell(24);renderPlayers();
}
$('tokens').innerHTML='<span id="token-0" class="token jade" hidden>1</span><span id="token-1" class="token clay" hidden>2</span>';
$('roll-button').addEventListener('click',rollDice);
$('reset-button').addEventListener('click',resetGame);
$('help-button').addEventListener('click',()=>$('help-dialog').showModal());
$('close-help').addEventListener('click',()=>$('help-dialog').close());
$('help-dialog').addEventListener('click',event=> {if(event.target===$('help-dialog')) {const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) event.target.close();}});
resetGame();

// Integración opcional: no requiere extensiones ni afecta a otros navegadores.
if(document.modelContext?.registerTool) {
  const lifecycle=new AbortController();
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  try {
    Promise.resolve(document.modelContext.registerTool({
      name:'roll_maya_game_dice',title:'Lanzar dado',
      description:'Lanza el dado y completa el turno del jugador actual en Serpientes y Escaleras.',
      inputSchema:{type:'object',properties:{},additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute:async input=> {
        if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Se espera un objeto vacío.');
        if(state.busy || state.winner!==null) throw new Error('No es posible lanzar en este momento.');
        await rollDice();
        return {positions:[...state.positions],nextPlayer:state.winner===null?state.turn+1:null,winner:state.winner===null?null:state.winner+1};
      }
    },{signal:lifecycle.signal})).catch(()=>{});
  } catch { /* Un navegador sin soporte completo conserva el juego normal. */ }
}
