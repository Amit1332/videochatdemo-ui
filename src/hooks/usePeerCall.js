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
      if (!call) return;
      
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
        .catch(error => {
          console.error('Error answering call:', error);
          cleanupCall();
        });
    }
    
    try {
      peer.on('call', onCall);
      return () => {
        if (peer && peer.off) {
          peer.off('call', onCall);
        }
      };
    } catch (error) {
      console.error('Error setting up peer call listener:', error);
    }
  }, [peer]);

  async function startCall(targetPeerId, withVideo = true) {
    if (!peer) {
      throw new Error('Peer connection not available');
    }
    
    // Check if peer is ready
    if (peer.disconnected || !peer.id) {
      throw new Error('Peer connection not ready');
    }
    
    try {
      const constraints = { audio: true, video: withVideo };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      const call = peer.call(targetPeerId, stream);
      if (!call) {
        throw new Error('Failed to create call');
      }
      
      setCurrentCall(call);
      
      return new Promise((resolve, reject) => {
        call.on('stream', remote => {
          setRemoteStream(remote);
          resolve(call);
        });
        call.on('close', () => {
          cleanupCall();
          reject(new Error('Call ended'));
        });
        call.on('error', (error) => {
          cleanupCall();
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  function endCall() {
    cleanupCall();
  }

  return { localStream, remoteStream, currentCall, inboundCallerId, startCall, endCall };
}