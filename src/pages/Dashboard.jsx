import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePeerCall } from '../hooks/usePeerCall.js';

export default function Dashboard() {
  const { user, socket, peer, peerReady } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await api.get('/api/users');
      if (mounted) setUsers(data.users);
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!socket) return;
    function onPresence(update) {
      setUsers(prev => prev.map(u => u.id === update.userId ? { ...u, online: update.online } : u));
    }
    socket.on('presence:update', onPresence);
    return () => { socket.off('presence:update', onPresence); };
  }, [socket]);

  const filtered = useMemo(() => users.filter(u => u.id !== user?.id && (u.name?.toLowerCase().includes(filter.toLowerCase()) || u.email?.toLowerCase().includes(filter.toLowerCase()))), [users, filter, user]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 280, borderRight: '1px solid #ddd', padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Users</div>
        <input placeholder="Search" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 6 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          {filtered.map(u => (
            <button key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #eee', borderRadius: 6, background: selectedUserId === u.id ? '#f5f5f5' : 'white', textAlign: 'left' }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: u.online ? '#22c55e' : '#9ca3af' }} />
              <span style={{ fontWeight: 500 }}>{u.name}</span>
            </button>
          ))}
        </div>
      </aside>
      <section style={{ flex: 1, padding: 16 }}>
        <CallPanel targetUserId={selectedUserId} peer={peer} peerReady={peerReady} />
      </section>
    </div>
  );
}

function CallPanel({ targetUserId, peer, peerReady }) {
  const { user } = useAuth();
  const { localStream, remoteStream, startCall, endCall } = usePeerCall(peer);
  const [callError, setCallError] = useState('');

  useEffect(() => {
    return () => { endCall(); };
  }, []);

  useEffect(() => {
    const localEl = document.getElementById('localVideo');
    if (localEl) {
      if ('srcObject' in localEl) localEl.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    const remoteEl = document.getElementById('remoteVideo');
    if (remoteEl) {
      if ('srcObject' in remoteEl) remoteEl.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  if (!targetUserId) return <div>Select a user to call.</div>;

  async function callAudio() {
    try {
      setCallError('');
      await startCall(targetUserId, false);
    } catch (error) {
      console.error('Audio call failed:', error);
      setCallError(error.message || 'Failed to start audio call');
    }
  }
  
  async function callVideo() {
    try {
      setCallError('');
      await startCall(targetUserId, true);
    } catch (error) {
      console.error('Video call failed:', error);
      setCallError(error.message || 'Failed to start video call');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={callAudio} disabled={!peerReady}>Call Audio</button>
        <button onClick={callVideo} disabled={!peerReady}>Call Video</button>
        <button onClick={endCall} disabled={!peerReady}>End Call</button>
      </div>
      {callError && (
        <div style={{ color: 'red', marginBottom: 12, padding: 8, background: '#fee', border: '1px solid #fcc', borderRadius: 4 }}>
          {callError}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <video id="localVideo" autoPlay muted playsInline style={{ width: '40%', background: '#000' }} />
        <video id="remoteVideo" autoPlay playsInline style={{ width: '60%', background: '#000' }} />
      </div>
      <div style={{ marginTop: 12, color: '#6b7280' }}>
        You: {user?.name} • Calling: {targetUserId}
        {!peerReady && <span style={{ color: 'orange' }}> • Peer connection not ready</span>}
      </div>
    </div>
  );
}