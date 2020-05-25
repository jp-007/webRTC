let divSelectRoom=document.getElementById("selectRoom");
let divConsultingRoom=document.getElementById("consultingRoom")
let inputRoomnumber=document.getElementById("roomNumber")
let btnGoRoom=document.getElementById("goRoom")
let localVideo=document.getElementById("localVideo")
let remoteVideo=document.getElementById("remoteVideo")

let roomNumber,localstream,remoteStream,rtcPeerConnection,isCaller



var iceServers={
    'iceServers':[
        {'urls':['stun:stun.services.mozilla.com'] },
       {'urls':['stun:stun.l.google.com:19302'] }      
    ]
 };

var constraints = {
    mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }
};

const streamConstraints = { 
    video:true,
    audio:true
    
}

const socket = io()

btnGoRoom.onclick = () => {
    if(inputRoomnumber.value === ''){
        alert('type room number');
    }else{

        roomNumber=inputRoomnumber.value
        socket.emit('createOrJoin',roomNumber)
        console.log('clicked')
        
        // divSelectRoom.style="display:none"
        // divConsultingRoom.style= "display:block"
        //
        //
    }
}

socket.on('created',room=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(stream =>{
       localstream=stream,
       localVideo.srcObject=stream,
       isCaller=true
    })
    .catch(err=>{
        console.log('An error occured',err)
    })
})


socket.on('joined',room=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(stream =>{
       localstream=stream,
       localVideo.srcObject=stream,
        socket.emit('ready',roomNumber)
    })
    .catch(err=>{
        console.log('An error occured',err)
    })
})

socket.on('candidate',function(event){
    const candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.cadidate
    })
    console.log("received candidate")
    rtcPeerConnection.addIceCandidate(candidate)//////////////////////////////////////////////////////888888888888888888888666
})

socket.on('ready',function () {
    if(isCaller) {
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localstream.getTracks()[0],localstream)
        rtcPeerConnection.addTrack(localstream.getTracks()[1],localstream)
        rtcPeerConnection.createOffer(constraints)
        .then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('offer',{
                type: 'offer',
                sdp:sessionDescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log("ready"+err)
        })

    }
})

function success(){
    console.log("successsssssss")
}

function notsuccess(error){
    console.log("erorrrrrrr:",  error)
}
socket.on('offer',function(event){
    if(!isCaller){
        rtcPeerConnection=new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate=onIceCandidate
        rtcPeerConnection.ontrack=onAddStream
        rtcPeerConnection.addTrack(localstream.getTracks()[0],localstream)
        rtcPeerConnection.addTrack(localstream.getTracks()[1],localstream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer(constraints)
        .then(sessionDescription=>{
            rtcPeerConnection.setLocalDescription(sessionDescription)
            socket.emit('answer',{
                type: 'answer',
                sdp:sessionDescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log('ERROR:',err)
        })
        
       
    }

    console.log("TYPE offer"+event.sdp)
})

function onSetRemoteSuccess() {
    console.log('setRemoteDescription complete');
  }
  function onSetLocalSessionDescriptionError(error) {
    console.error('Failed to set local session description: ' + error.toString())
  }
socket.on('answer',function(event){
    console.log("TYPE answers"+event.sdp)
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    .then(onSetRemoteSuccess)
    .catch( onSetLocalSessionDescriptionError)
})



function onAddStream(event){
    remoteVideo.srcObject=event.streams[0]
    remoteStream= event.streams[0]
}

async function onIceCandidate(event){
    console.log('sending ice cadidate',event)
      if(event.cadidate){
          console.log('seding ice cadidate',event.cadidate)
          socket.emit('candidate',{
              type:'candidate',
              label: event.cadidate.sdpMLieIndex,
              id: event.cadidate.sdpMid,
              candidate: event.candidate.candidate,
              room: roomNumber
          })
      }
}