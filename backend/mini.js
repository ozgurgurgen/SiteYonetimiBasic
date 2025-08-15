import http from 'http';
const PORT = process.env.PORT || 5050;
const server = http.createServer((req,res)=>{
  if(req.url === '/test'){
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok:true, time: Date.now() }));
  } else {
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end('MINI SERVER RUNNING');
  }
});
server.listen(PORT, ()=> console.log('Mini server listening on', PORT));

process.on('exit', c=> console.log('Mini exit', c));
process.on('uncaughtException', e=> { console.error('Mini uncaught', e); });
