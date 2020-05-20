var express=require('express');
var app =express();
let http=require('http').Server(app);

const port =process.env.port || 3000 || '127.0.0.1';

let io=require('socket.io')(http)

app.use(express.static('public'));


http.listen(port, ()=>{
    console.log('listening 0n :',port);
})

io.on('connection',socket=>{
    console.log('user connected');
    socket.on('createOrJoin',room => {
        console.log('create or join room',room)

        const myRoom=io.sockets.adapter.rooms[room] || {length: 0}
        const numClients=myRoom.length
        console.log(room, 'has', numClients,'clients')

        if(numClients==0){
            socket.join(room)
            socket.emit('created',room);
        }else if(numClients==1){
            socket.join(room)
            socket.emit('joined',room)
        }else{
            socket.emit('full',room)
        }
    })

    socket.on('ready',room=>{
        console.log('ready received, ready emmited')
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate',event=>{
        console.log('candidate received, candidate emmited')
        socket.broadcast.to(event.room).emit('candidate',event)
    })

    socket.on('offer',event=>{
        console.log('offer received, offer emmited')
        socket.broadcast.to(event.room).emit('offer',event.sdp)
    })

    socket.on('answer',event=>{

        console.log('answer received, answer emmited')
        socket.broadcast.to(event.room).emit('answer',event.sdp)
    })

})

     
