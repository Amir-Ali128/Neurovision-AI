let canvas=document.getElementById("brain");
let ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let activity=0;

async function loadWasm(){
 try{
  let res=await fetch("/static/neural_core.wasm");
  let buf=await res.arrayBuffer();
  let wasm=await WebAssembly.instantiate(buf);
  return wasm.instance.exports;
 }catch(e){return null;}
}

function draw(){
 ctx.fillStyle="black";
 ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle="cyan";
 ctx.beginPath();
 ctx.arc(canvas.width/2,canvas.height/2,100+activity*120,0,Math.PI*2);
 ctx.fill();
}

async function main(){
 let wasm=await loadWasm();
 navigator.mediaDevices.getUserMedia({audio:true,video:true});
 setInterval(()=>{
  let stim=Math.random();
  activity=wasm?wasm.wasm_neural_step(stim):stim;
  draw();
 },50);
}

main();
