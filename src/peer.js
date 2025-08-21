import Peer from 'peerjs';

export function createPeer(userId) {
  const host = import.meta.env.VITE_PEER_HOST || window.location.hostname;
  const path = import.meta.env.VITE_PEER_PATH || '/peerjs';
  const peer = new Peer(userId, {
    host,
    path,
    secure: false,
    debug: 2,
  });
  return peer;
}