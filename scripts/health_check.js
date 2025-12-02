(async ()=>{
  try{
    const res = await fetch('http://localhost:5000/api/health');
    const j = await res.json();
    console.log('LOCAL HEALTH:', JSON.stringify(j));
  } catch(e){
    console.log('LOCAL HEALTH ERROR:', e.message || e);
  }

  const os = require('os');
  const nets = os.networkInterfaces();
  let ip = '127.0.0.1';
  for (const k of Object.keys(nets)){
    for (const ni of nets[k]){
      if (ni.family === 'IPv4' && !ni.internal && !ni.address.startsWith('169.254')){
        ip = ni.address; break;
      }
    }
    if (ip !== '127.0.0.1') break;
  }
  console.log('DETECTED IP:', ip);
  try{
    const res2 = await fetch(`http://${ip}:5000/api/health`);
    const j2 = await res2.json();
    console.log('LAN HEALTH:', JSON.stringify(j2));
  } catch(e){
    console.log('LAN HEALTH ERROR:', e.message || e);
  }
})();
