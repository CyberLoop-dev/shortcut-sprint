import { FormEvent, useEffect, useState } from "react";

type Card={prompt:string;combo:string};
const decks:Record<string,Card[]> = {
  browser:[
    {prompt:"Open a new tab",combo:"MOD+T"},{prompt:"Close the current tab",combo:"MOD+W"},
    {prompt:"Focus the address bar",combo:"MOD+L"},{prompt:"Reopen the last closed tab",combo:"MOD+SHIFT+T"},
    {prompt:"Find text on this page",combo:"MOD+F"}
  ],
  editor:[
    {prompt:"Open a file by name",combo:"MOD+P"},{prompt:"Open the command palette",combo:"MOD+SHIFT+P"},
    {prompt:"Toggle a line comment",combo:"MOD+/"},{prompt:"Select the next matching occurrence",combo:"MOD+D"},
    {prompt:"Save the current file",combo:"MOD+S"}
  ],
  general:[
    {prompt:"Undo the last action",combo:"MOD+Z"},{prompt:"Redo the last action",combo:"MOD+SHIFT+Z"},
    {prompt:"Select all content",combo:"MOD+A"},{prompt:"Copy the selection",combo:"MOD+C"},
    {prompt:"Paste from clipboard",combo:"MOD+V"}
  ]
};
function label(combo:string,platform:string){return combo.split("+").map(k=>k==="MOD"?(platform==="mac"?"⌘":"Ctrl"):k==="SHIFT"?"Shift":k==="ALT"?"Alt":k).join(" + ")}
function readStored<T>(key:string,fallback:T):T{try{const value=localStorage.getItem(key);return value?JSON.parse(value) as T:fallback}catch{return fallback}}

export default function App(){
 const [deck,setDeck]=useState("browser");
 const [platform,setPlatform]=useState("win");
 const [custom,setCustom]=useState<Card[]>(()=>readStored<Card[]>("shortcut-sprint-cards",[]));
 const [best,setBest]=useState(()=>Number(localStorage.getItem("shortcut-sprint-best")||0));
 const [index,setIndex]=useState(0);
 const [score,setScore]=useState(0);
 const [remaining,setRemaining]=useState(45);
 const [started,setStarted]=useState(false);
 const [feedback,setFeedback]=useState("Choose a deck and start a round.");
 const [prompt,setPrompt]=useState("");
 const [combo,setCombo]=useState("MOD+K");
 const cards=deck==="custom"?custom:decks[deck];
 const current=cards.length?cards[index%cards.length]:null;

 useEffect(()=>{localStorage.setItem("shortcut-sprint-cards",JSON.stringify(custom))},[custom]);
 useEffect(()=>{if(score>best){setBest(score);localStorage.setItem("shortcut-sprint-best",String(score))}},[score,best]);
 useEffect(()=>{if(!started)return;const timer=window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(timer)},[started]);
 useEffect(()=>{if(remaining===0&&started){setStarted(false);setFeedback("Round complete. Final score: "+score+". Start again when ready.")}},[remaining,started,score]);

 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   if(!started||!current)return;
   const target=event.target as HTMLElement|null;
   if(target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"||target.isContentEditable))return;
   const key=event.key.toUpperCase();
   if(["CONTROL","SHIFT","ALT","META"].includes(key))return;
   event.preventDefault();
   const parts:string[]=[];
   if(platform==="mac"?event.metaKey:event.ctrlKey)parts.push("MOD");
   if(event.shiftKey)parts.push("SHIFT");
   if(event.altKey)parts.push("ALT");
   parts.push(key===" "?"SPACE":key);
   const actual=parts.join("+");
   if(actual===current.combo){setScore(v=>v+1);setIndex(v=>v+1);setFeedback("Correct — next prompt!")}
   else setFeedback("Not quite. Expected "+label(current.combo,platform)+". Try again.");
  };
  window.addEventListener("keydown",handler,true);
  return()=>window.removeEventListener("keydown",handler,true);
 },[started,current,platform]);

 const start=()=>{if(!cards.length){setFeedback("Add at least one custom card first.");return}setIndex(0);setScore(0);setRemaining(45);setStarted(true);setFeedback("Round started. Click the practice card, then press the shortcut.")};
 const addCard=(event:FormEvent)=>{event.preventDefault();const clean=combo.toUpperCase().replace(/\\s/g,"");if(!prompt.trim()||! /^(MOD\\+)?(SHIFT\\+)?(ALT\\+)?[A-Z0-9/]+$/.test(clean)){setFeedback("Use a prompt and a combo such as MOD+K or MOD+SHIFT+P.");return}setCustom(v=>[...v,{prompt:prompt.trim(),combo:clean}]);setPrompt("");setFeedback("Custom shortcut saved in this browser.")};
 return <main className="app">
  <header><span className="kicker">KEYBOARD SKILL BUILDER</span><h1>Shortcut <b>Sprint</b></h1><p>Small rounds. Better muscle memory. Your custom cards stay on this device.</p></header>
  <section className="top-controls">
   <label>Deck<select value={deck} onChange={e=>{setDeck(e.target.value);setIndex(0);setStarted(false)}}><option value="browser">Browser</option><option value="editor">Code editor</option><option value="general">General</option><option value="custom">My custom deck ({custom.length})</option></select></label>
   <label>Platform<select value={platform} onChange={e=>setPlatform(e.target.value)}><option value="win">Windows / Linux</option><option value="mac">macOS</option></select></label>
   <div className="stats"><span>TIME <b>{remaining}s</b></span><span>SCORE <b>{score}</b></span><span>BEST <b>{best}</b></span></div>
  </section>
  <section className="panel practice" tabIndex={0}>
   <div className="practice-head"><span>{started?"ROUND IN PROGRESS":"PRACTICE CARD"}</span><span>{cards.length?((index%cards.length)+1)+" / "+cards.length:"NO CARDS"}</span></div>
   {current?<><h2>{current.prompt}</h2><p>Press the shortcut on your keyboard</p><div className="key-hint">{label(current.combo,platform)}</div></>:<div className="empty">Your custom deck is empty. Add a card below to begin.</div>}
   <button onClick={start} disabled={started||!cards.length}>{started?"Round running":"Start 45-second round"}</button>
   <p className="feedback" role="status">{feedback}</p>
  </section>
  <section className="panel custom-panel"><h2>Add a custom shortcut</h2><form onSubmit={addCard}><label>Action<input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Example: Open terminal"/></label><label>Combo<input value={combo} onChange={e=>setCombo(e.target.value)} placeholder="MOD+K"/></label><button type="submit">Add card</button></form><p className="note">Use MOD for Ctrl on Windows/Linux or Command on macOS. Examples: MOD+K, MOD+SHIFT+P, ALT+ENTER.</p></section>
  <footer>Shortcut Sprint · Progress is stored locally in this browser</footer>
 </main>;
}
