import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  log: "ct-log",
  streak: "ct-streak",
  lastDate: "ct-lastDate",
  todayExercises: "ct-today",
};

async function storageGet(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  } catch {
    return null;
  }
}

async function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

const EXERCISE_TYPES = [
  { id: "pregunta",  label: "Pregunta socrática",    icon: "🔍", iconBg: "#ffe4cc" },
  { id: "sesgo",     label: "Sesgo cognitivo",        icon: "🪞", iconBg: "#dce8ff" },
  { id: "dilema",    label: "Dilema ético",           icon: "⚖️", iconBg: "#d8f5cc" },
  { id: "argumento", label: "Análisis argumento",     icon: "🏛️", iconBg: "#ffe8cc" },
  { id: "dato",      label: "Verifica el dato",       icon: "📊", iconBg: "#ead5ff" },
  { id: "creativo",  label: "Pensamiento lateral",    icon: "💡", iconBg: "#fffacc" },
];

const BANK = [
  // PREGUNTAS SOCRÁTICAS
  { type:"pregunta", title:"¿Por qué creo lo que creo?", prompt:"Elige una creencia que tengas sobre política, salud o relaciones. ¿Cuándo la adquiriste? ¿Has buscado evidencia en contra alguna vez? Escribe honestamente de dónde viene esa creencia." },
  { type:"pregunta", title:"¿Quién se beneficia?", prompt:"Cuando lees una noticia o ves un anuncio, pregúntate: ¿quién financia esto? ¿Quién gana si lo creo? Elige un mensaje que hayas recibido hoy y analízalo desde esta óptica." },
  { type:"pregunta", title:"¿Qué no estoy viendo?", prompt:"Piensa en un problema actual en tu vida o en el mundo. ¿Qué perspectiva o información podrías estar ignorando porque no te resulta cómoda o accesible? ¿Cómo podrías buscarla?" },
  { type:"pregunta", title:"¿Cambiaría de opinión?", prompt:"Escoge una opinión fuerte que tengas. Define exactamente qué evidencia o argumento te haría cambiar de idea. Si no encuentras ninguna, eso ya es información valiosa sobre ti mismo." },
  { type:"pregunta", title:"¿Cómo lo sé?", prompt:"Piensa en algo que 'sabes' con certeza. ¿Es observación directa, algo que leíste, algo que te contaron? Traza la cadena completa de cómo llegó ese conocimiento a ti y evalúa su fiabilidad." },
  { type:"pregunta", title:"¿Es correlación o causalidad?", prompt:"Cuando alguien dice 'A causa B', ¿qué preguntas harías antes de aceptarlo? Busca hoy un ejemplo real en medios o conversaciones donde se confunda correlación con causalidad." },

  // SESGOS COGNITIVOS
  { type:"sesgo", title:"El sesgo de confirmación", prompt:"Durante un día entero, intenta buscar activamente información que contradiga una de tus opiniones. ¿Qué encuentras? ¿Cómo te sientes leyéndolo? Reflexiona sobre la resistencia que sientes." },
  { type:"sesgo", title:"El efecto halo", prompt:"Piensa en alguien que admiras mucho. ¿Alguna vez has aceptado sus ideas sin cuestionarlas por la admiración que le tienes? ¿O rechazado las ideas de alguien que no te cae bien sin analizarlas? Describe un ejemplo." },
  { type:"sesgo", title:"El sesgo de disponibilidad", prompt:"Cuando escuchas noticias de accidentes de avión, ¿crees que volar es peligroso aunque estadísticamente sea muy seguro? ¿En qué áreas de tu vida sobreestimas riesgos porque son fáciles de recordar?" },
  { type:"sesgo", title:"El pensamiento grupal", prompt:"¿Has cambiado alguna vez tu opinión en público para no destacar del grupo, aunque en privado pensabas diferente? ¿Qué consecuencias tuvo? ¿Qué te impidió expresarte?" },
  { type:"sesgo", title:"El sesgo de anclaje", prompt:"Si ves un producto con precio tachado de 100€ y ahora cuesta 70€, ¿lo percibes como barato? ¿En qué decisiones recientes has sido influenciado por el primer número o dato que viste? ¿Cómo podrías neutralizarlo?" },
  { type:"sesgo", title:"El sesgo del superviviente", prompt:"Cuando oímos historias de éxito de emprendedores o inversores, ¿qué no estamos escuchando? ¿En qué área de tu vida podrías estar tomando decisiones basándote solo en los casos que 'sobrevivieron'?" },

  // DILEMAS ÉTICOS
  { type:"dilema", title:"El tranvía descontrolado", prompt:"Un tranvía va a matar a cinco personas. Puedes desviar la vía para matar solo a una. ¿Lo harías? Ahora: ¿cambiaría tu respuesta si tuvieras que empujar físicamente a esa persona en lugar de mover un switch? ¿Por qué la diferencia?" },
  { type:"dilema", title:"La privacidad vs. la seguridad", prompt:"El Estado quiere acceder a los mensajes privados de todos los ciudadanos para prevenir ataques terroristas. ¿Dónde trazas el límite entre seguridad colectiva y privacidad individual? ¿Qué principio usas para decidir?" },
  { type:"dilema", title:"Mentira piadosa", prompt:"Tu amigo ha preparado durante meses una presentación que es objetivamente mala. Mañana la presenta ante su jefe. Te la enseña hoy y te pregunta qué te parece. ¿Qué haces? ¿Cuál es tu obligación moral: la honestidad o proteger sus sentimientos?" },
  { type:"dilema", title:"Responsabilidad generacional", prompt:"¿Tenemos obligaciones morales con personas que aún no han nacido? Si es así, ¿cuánto deberíamos sacrificar hoy por generaciones futuras en temas como el clima o la deuda pública? ¿Quién decide cuánto es suficiente?" },
  { type:"dilema", title:"El delatora", prompt:"Descubres que un compañero de trabajo comete un fraude menor que no te afecta directamente pero perjudica a la empresa. ¿Lo denuncias? ¿Cambia tu decisión si ese compañero tiene una familia que depende de él? Razona los principios en conflicto." },

  // ANÁLISIS DE ARGUMENTOS
  { type:"argumento", title:"Descompón este argumento", prompt:"'Si prohibimos el alcohol, la gente dejará de beber y habrá menos violencia doméstica.' Identifica las premisas, la conclusión y al menos dos falacias o debilidades lógicas en este razonamiento." },
  { type:"argumento", title:"El hombre de paja", prompt:"'Los que quieren más impuestos a los ricos quieren destruir la iniciativa empresarial.' ¿Cómo reconocerías si alguien está distorsionando la postura del adversario? Busca hoy un ejemplo real de falacia del hombre de paja en los medios." },
  { type:"argumento", title:"Pendiente resbaladiza", prompt:"'Si permitimos el matrimonio entre personas del mismo sexo, acabaremos permitiendo que la gente se case con animales.' Explica por qué este argumento es falaz. ¿Cuándo una pendiente resbaladiza SÍ es un argumento válido?" },
  { type:"argumento", title:"Apelación a la autoridad", prompt:"'Un estudio de Harvard demuestra que...' ¿Qué preguntas deberías hacerte antes de aceptar este argumento? ¿Cuándo es válido citar una autoridad y cuándo es una falacia? Pon un ejemplo de cada caso." },
  { type:"argumento", title:"Ad hominem", prompt:"'No puedes hablar de economía, ni siquiera acabaste la carrera.' Explica por qué atacar a la persona en lugar del argumento es un error lógico. ¿Puede el origen o las credenciales de alguien ser relevante alguna vez? ¿Cuándo?" },

  // VERIFICA EL DATO
  { type:"dato", title:"El titular engañoso", prompt:"Los titulares suelen distorsionar los datos. Busca hoy un titular llamativo en cualquier medio. Lee el artículo completo. ¿El titular refleja con exactitud lo que dice el estudio o la noticia? ¿Qué matices omite?" },
  { type:"dato", title:"Estadísticas relativas vs. absolutas", prompt:"'Este medicamento reduce el riesgo de infarto un 50%.' ¿Cómo interpretas esto? ¿Cambia algo saber que el riesgo pasó del 2% al 1%? Reflexiona sobre cómo los porcentajes relativos pueden crear percepciones distorsionadas." },
  { type:"dato", title:"El tamaño de la muestra", prompt:"'Una encuesta de 50 personas revela que el 80% prefiere X.' ¿Qué preguntas harías sobre este dato antes de aceptarlo? ¿Importa cómo se seleccionaron esas 50 personas? Explica por qué el tamaño y método de muestra son cruciales." },
  { type:"dato", title:"La fuente primaria", prompt:"Cuando lees 'estudios dicen que...', ¿alguna vez buscas el estudio original? Elige hoy una afirmación que hayas visto en redes sociales e intenta rastrear su fuente primaria. ¿Qué encuentras? ¿Coincide con lo que se publicó?" },

  // PENSAMIENTO LATERAL
  { type:"creativo", title:"Invierte el problema", prompt:"Piensa en un problema cotidiano que quieras resolver. Ahora inviértelo: en lugar de preguntar cómo solucionarlo, pregúntate cómo podrías hacerlo peor. A veces ver el negativo del problema revela soluciones no obvias. ¿Qué descubres?" },
  { type:"creativo", title:"La analogía imposible", prompt:"¿En qué se parece gestionar tus emociones a cultivar un jardín? Elige dos cosas aparentemente sin relación y busca cinco analogías entre ellas. Este ejercicio entrena la transferencia de conceptos entre dominios, clave del pensamiento creativo." },
  { type:"creativo", title:"El extraterrestre observador", prompt:"Imagina que eres un extraterrestre que observa la sociedad humana por primera vez. Elige una costumbre social que consideramos normal y descríbela como si fuera completamente absurda. ¿Qué revela este ejercicio sobre los hábitos que damos por sentados?" },
  { type:"creativo", title:"Seis sombreros para pensar", prompt:"Elige una decisión que debas tomar. Analízala desde seis ángulos: datos fríos (blanco), emociones (rojo), riesgos (negro), oportunidades (amarillo), ideas creativas (verde), proceso del grupo (azul). ¿Qué perspectiva te costó más adoptar?" },
  { type:"creativo", title:"El abogado del diablo", prompt:"Elige la posición que más defiendes en un debate actual. Ahora construye el argumento más fuerte posible en su contra. No para cambiar de opinión, sino para entender de verdad al adversario. ¿Cambia algo en cómo ves el tema?" },
];

function getThreeForToday() {
  const seed = todayStr().split("-").reduce((a, b) => a + parseInt(b), 0);
  const shuffled = [...BANK].sort((a, b) => {
    const ha = (seed * (BANK.indexOf(a) + 1)) % 97;
    const hb = (seed * (BANK.indexOf(b) + 1)) % 97;
    return ha - hb;
  });
  // Pick one from each of 3 different types
  const used = new Set();
  const result = [];
  for (const ex of shuffled) {
    if (!used.has(ex.type) && result.length < 3) {
      used.add(ex.type);
      result.push({ ...ex, id: `${todayStr()}-${result.length}` });
    }
  }
  // fallback: just take first 3 if not enough types
  if (result.length < 3) {
    for (const ex of shuffled) {
      if (!result.find(r => r.id === `${todayStr()}-${result.length}`) && result.length < 3) {
        result.push({ ...ex, id: `${todayStr()}-${result.length}` });
      }
    }
  }
  return result;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root{--ink:#1a1208;--paper:#f5f0e8;--warm:#e8dfc8;--accent:#c4410c;--gold:#b8860b;--sage:#4a6741;--muted:#7a6e5f;--border:rgba(26,18,8,0.15);--r:4px;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:var(--paper);color:var(--ink);min-height:100vh;}
  .app{max-width:420px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;}
  .header{padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--paper);position:sticky;top:0;z-index:10;}
  .logo{font-family:'DM Serif Display',serif;font-size:1.1rem;}
  .logo span{color:var(--accent);font-style:italic;}
  .badge{background:var(--ink);color:var(--paper);padding:5px 11px;border-radius:20px;font-size:0.78rem;font-family:'DM Mono',monospace;}
  .nav{display:flex;border-bottom:1px solid var(--border);background:var(--paper);position:sticky;top:53px;z-index:9;}
  .nb{flex:1;padding:10px 4px;background:none;border:none;border-bottom:2px solid transparent;font-family:'DM Sans',sans-serif;font-size:0.72rem;font-weight:500;color:var(--muted);cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;}
  .nb.on{color:var(--ink);border-bottom-color:var(--accent);}
  .main{flex:1;padding:20px 18px 100px;}
  .stitle{font-family:'DM Serif Display',serif;font-size:1.6rem;line-height:1.15;margin-bottom:3px;}
  .ssub{font-size:0.8rem;color:var(--muted);margin-bottom:18px;}
  .card{background:white;border:1px solid var(--border);border-radius:8px;margin-bottom:14px;overflow:hidden;}
  .ch{padding:14px 16px 10px;display:flex;align-items:flex-start;gap:12px;}
  .icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
  .etype{font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);margin-bottom:2px;}
  .etitle{font-family:'DM Serif Display',serif;font-size:1.05rem;line-height:1.2;}
  .cb{padding:0 16px 14px;}
  .prompt{font-size:0.85rem;line-height:1.6;margin-bottom:12px;color:#2a1e0f;}
  textarea{width:100%;min-height:90px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.84rem;background:var(--paper);resize:vertical;color:var(--ink);line-height:1.5;}
  textarea:focus{outline:none;border-color:var(--accent);}
  .cf{padding:0 16px 14px;}
  .btnp{background:var(--ink);color:var(--paper);border:none;padding:9px 18px;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;cursor:pointer;}
  .btnp:hover{background:var(--accent);}
  .btnp:disabled{opacity:0.45;cursor:default;}
  .btng{background:none;border:1px solid var(--border);padding:9px 14px;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.8rem;color:var(--muted);cursor:pointer;margin-top:14px;}
  .btng:hover{border-color:var(--ink);color:var(--ink);}
  .done{display:inline-flex;align-items:center;gap:4px;background:var(--sage);color:white;font-size:0.7rem;font-weight:600;padding:4px 10px;border-radius:20px;flex-shrink:0;}
  .atxt{font-size:0.8rem;color:var(--muted);font-style:italic;line-height:1.5;border-left:2px solid var(--border);padding-left:10px;margin-bottom:8px;}
  .pw{height:4px;background:var(--warm);border-radius:2px;margin:14px 0;overflow:hidden;}
  .pf{height:100%;background:linear-gradient(90deg,var(--accent),var(--gold));border-radius:2px;transition:width .4s;}
  .sgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
  .sbox{background:white;border:1px solid var(--border);border-radius:8px;padding:16px 14px;}
  .snum{font-family:'DM Serif Display',serif;font-size:2rem;line-height:1;margin-bottom:3px;}
  .slabel{font-size:0.72rem;color:var(--muted);font-weight:500;}
  .hentry{border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:12px;background:white;}
  .hdate{font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:4px;font-family:'DM Mono',monospace;}
  .htitle{font-family:'DM Serif Display',serif;font-size:0.95rem;margin-bottom:6px;}
  .hanswer{font-size:0.8rem;color:var(--muted);line-height:1.5;border-left:2px solid var(--border);padding-left:10px;}
  .empty{text-align:center;padding:40px 20px;color:var(--muted);}
  .complete{text-align:center;padding:24px 0;}
  @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  .fade{animation:fu .3s ease both;}
  .fade:nth-child(2){animation-delay:.06s;}
  .fade:nth-child(3){animation-delay:.12s;}
`;

export default function App() {
  const [tab, setTab]       = useState("hoy");
  const [streak, setStreak] = useState(0);
  const [exercises, setEx]  = useState([]);
  const [answers, setAns]   = useState({});
  const [done, setDone]     = useState({});
  const [log, setLog]       = useState([]);

  useEffect(() => {
    (async () => {
      const sr = await storageGet(STORAGE_KEYS.streak);
      if (sr) { try { setStreak(JSON.parse(sr.value)); } catch {} }
      const lr = await storageGet(STORAGE_KEYS.log);
      if (lr) { try { setLog(JSON.parse(lr.value)); } catch {} }

      const tr = await storageGet(STORAGE_KEYS.todayExercises);
      let loaded = false;
      if (tr) {
        try {
          const s = JSON.parse(tr.value);
          if (s.date === todayStr()) {
            setEx(s.exercises || []);
            setDone(s.done || {});
            setAns(s.answers || {});
            loaded = true;
          }
        } catch {}
      }
      if (!loaded) {
        const exs = getThreeForToday();
        setEx(exs);
        await storageSet(STORAGE_KEYS.todayExercises, { date: todayStr(), exercises: exs, done: {}, answers: {} });
      }
    })();
  }, []);

  async function save(d, ans) {
    await storageSet(STORAGE_KEYS.todayExercises, { date: todayStr(), exercises, done: d, answers: ans });
  }

  async function submit(ex) {
    const ans = answers[ex.id] || "";
    if (!ans.trim()) return;
    const nd = { ...done, [ex.id]: true };
    setDone(nd);
    await save(nd, answers);

    const entry = { date: todayStr(), exTitle: ex.title, exType: ex.type, answer: ans };
    const nl = [entry, ...log].slice(0, 200);
    setLog(nl);
    await storageSet(STORAGE_KEYS.log, nl);

    const lr = await storageGet(STORAGE_KEYS.lastDate);
    let last = null; if (lr) { try { last = JSON.parse(lr.value); } catch {} }
    const today = todayStr();
    if (last !== today) {
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      const ns = last === yest.toISOString().slice(0, 10) ? streak + 1 : 1;
      setStreak(ns);
      await storageSet(STORAGE_KEYS.streak, ns);
      await storageSet(STORAGE_KEYS.lastDate, today);
    }
  }

  const doneCount = Object.keys(done).length;
  const total = exercises.length;
  const prog = total ? doneCount / total : 0;
  const tc = id => EXERCISE_TYPES.find(t => t.id === id) || EXERCISE_TYPES[0];

  const Hoy = () => (
    <div>
      <p className="stitle">Hoy</p>
      <p className="ssub">{new Date().toLocaleDateString("es-ES", { weekday:"long", day:"numeric", month:"long" })}</p>

      {total > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"var(--muted)", marginBottom:4 }}>
            <span>{doneCount} de {total} completados</span>
            <span>{Math.round(prog * 100)}%</span>
          </div>
          <div className="pw"><div className="pf" style={{ width:`${prog*100}%` }}/></div>
        </>
      )}

      {exercises.map(ex => {
        const t = tc(ex.type);
        const isDone = done[ex.id];
        return (
          <div key={ex.id} className="card fade">
            <div className="ch">
              <div className="icon" style={{ background: t.iconBg }}>{t.icon}</div>
              <div style={{ flex:1 }}>
                <div className="etype">{t.label}</div>
                <div className="etitle">{ex.title}</div>
              </div>
              {isDone && <span className="done">✓</span>}
            </div>
            <div className="cb">
              <p className="prompt">{ex.prompt}</p>
              {!isDone ? (
                <textarea
                  placeholder="Escribe tu reflexión aquí..."
                  value={answers[ex.id] || ""}
                  onChange={e => {
                    const na = { ...answers, [ex.id]: e.target.value };
                    setAns(na);
                    save(done, na);
                  }}
                />
              ) : (
                <div className="atxt">{answers[ex.id] || "—"}</div>
              )}
            </div>
            {!isDone && (
              <div className="cf">
                <button className="btnp"
                  disabled={!(answers[ex.id]||"").trim()}
                  onClick={() => submit(ex)}>
                  Guardar reflexión
                </button>
              </div>
            )}
          </div>
        );
      })}

      {doneCount === total && total > 0 && (
        <div className="complete">
          <div style={{ fontSize:"2.5rem", marginBottom:8 }}>🎯</div>
          <p style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.2rem" }}>¡Sesión completa!</p>
          <p style={{ fontSize:"0.8rem", color:"var(--muted)", marginTop:4 }}>Racha actual: {streak} día{streak!==1?"s":""} 🔥</p>
          <p style={{ fontSize:"0.78rem", color:"var(--muted)", marginTop:6 }}>Vuelve mañana para nuevos ejercicios</p>
        </div>
      )}
    </div>
  );

  const Stats = () => {
    const counts = {}; log.forEach(e => { counts[e.exType] = (counts[e.exType]||0)+1; });
    const days = [...new Set(log.map(e => e.date))].length;
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    const mx = Math.max(...Object.values(counts), 1);
    return (
      <div>
        <p className="stitle">Progreso</p>
        <p className="ssub">Tu evolución en pensamiento crítico</p>
        <div className="sgrid">
          <div className="sbox"><div className="snum">{streak}</div><div className="slabel">Días de racha 🔥</div></div>
          <div className="sbox"><div className="snum">{log.length}</div><div className="slabel">Reflexiones totales</div></div>
          <div className="sbox"><div className="snum">{days}</div><div className="slabel">Días activos</div></div>
          <div className="sbox"><div className="snum" style={{fontSize:"1.3rem"}}>{top ? tc(top[0]).icon : "—"}</div><div className="slabel">{top ? tc(top[0]).label : "Sin datos aún"}</div></div>
        </div>
        <p style={{fontFamily:"'DM Serif Display',serif",fontSize:"1.1rem",marginBottom:14}}>Por tipo de ejercicio</p>
        {EXERCISE_TYPES.map(t => {
          const c = counts[t.id] || 0;
          return (
            <div key={t.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",marginBottom:3}}>
                <span>{t.icon} {t.label}</span>
                <span style={{color:"var(--muted)",fontFamily:"'DM Mono',monospace"}}>{c}</span>
              </div>
              <div style={{height:5,background:"var(--warm)",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(c/mx)*100}%`,background:"var(--accent)",borderRadius:3}}/>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const Historial = () => (
    <div>
      <p className="stitle">Historial</p>
      <p className="ssub">Tus reflexiones anteriores</p>
      {!log.length && (
        <div className="empty">
          <div style={{fontSize:"2rem",marginBottom:8}}>📖</div>
          <p style={{fontSize:"0.85rem",lineHeight:1.5}}>Aquí aparecerán tus reflexiones cuando guardes ejercicios.</p>
        </div>
      )}
      {log.map((e, i) => {
        const t = tc(e.exType);
        return (
          <div key={i} className="hentry">
            <div className="hdate">{t.icon} {new Date(e.date+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}</div>
            <div className="htitle">{e.exTitle}</div>
            <div className="hanswer">{e.answer}</div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">Mente<span>Crítica</span></div>
          <div className="badge">🔥 {streak} días</div>
        </div>
        <div className="nav">
          {[["hoy","Hoy"],["stats","Stats"],["historial","Historial"]].map(([id,l]) => (
            <button key={id} className={`nb ${tab===id?"on":""}`} onClick={()=>setTab(id)}>{l}</button>
          ))}
        </div>
        <div className="main">
          {tab==="hoy"       && <Hoy/>}
          {tab==="stats"     && <Stats/>}
          {tab==="historial" && <Historial/>}
        </div>
      </div>
    </>
  );
}
