import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as projectApi from '../api/projectApi';
import type { Project } from '../types/models';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const load = async () => {
    const data = await projectApi.getMyProjects();
    setProjects(data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName) return;
    await projectApi.createProject(newName, '');
    setNewName('');
    load();
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    await projectApi.joinProject(joinCode);
    setJoinCode('');
    load();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Mis proyectos</h2>
        <button onClick={logout}>Cerrar sesión</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input placeholder="Nombre del nuevo proyecto" value={newName} onChange={e => setNewName(e.target.value)} />
        <button onClick={handleCreate}>Crear</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input placeholder="Código de invitación" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
        <button onClick={handleJoin}>Unirme</button>
      </div>

      <ul>
        {projects.map(p => (
          <li key={p.id} style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
            <strong>{p.name}</strong> — código: {p.inviteCode}
          </li>
        ))}
      </ul>
    </div>
  );
}