
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(r.status);return r.json();}
