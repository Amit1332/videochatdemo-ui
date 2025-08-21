import { useEffect, useState } from 'react';

export function usePeerCall(peer) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [inboundCallerId, setInboundCallerId] = useState(null);

  const cleanupCall = () => {
    if (currentCall) {
      currentCall.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    setCurrentCall(null);
    setLocalStream(null);
  };

  useEffect(() => {
    if (!peer) return;
    function onCall(call) {
      setInboundCallerId(call.peer);
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          setLocalStream(stream);
          call.answer(stream);
          setCurrentCall(call);
          call.on('stream', remote => setRemoteStream(remote));
          call.on('close', cleanupCall);
          call.on('error', cleanupCall);
        })
        .catch(console.error);
    }
    peer.on('call', onCall);
    return () => {
      peer.off('call', onCall);
    };
  }, [peer]);

  async function startCall(targetPeerId, withVideo = true) {
    const constraints = { audio: true, video: withVideo };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    const call = peer.call(targetPeerId, stream);
    setCurrentCall(call);
    return new Promise((resolve) => {
      call.on('stream', remote => {
        setRemoteStream(remote);
        resolve(call);
      });
      call.on('close', cleanupCall);
      call.on('error', cleanupCall);
    });
  }

  function endCall() {
    cleanupCall();
  }

  return { localStream, remoteStream, currentCall, inboundCallerId, startCall, endCall };
}