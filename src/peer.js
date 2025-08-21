import Peer from 'peerjs';

export function createPeer(userId) {
  const host = import.meta.env.VITE_PEER_HOST || window.location.hostname;
  const path = import.meta.env.VITE_PEER_PATH || '/peerjs';
  const peer = new Peer(userId, {
    host: "videochatdemo-ttpb.onrender.com",
  port: 443,
  path: "/peerjs",
  secure: true   
  });
  return peer;
}