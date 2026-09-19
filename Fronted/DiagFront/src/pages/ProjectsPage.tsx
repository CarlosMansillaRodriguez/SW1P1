import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, KeyRound } from 'lucide-react';
import * as projectApi from '../api/projectApi';
import type { Project } from '../types/models';
import { useAuth } from '../context/AuthContext';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const load = async () => {
    const data = await projectApi.getMyProjects();
    setProjects(data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await projectApi.createProject(newName.trim(), '');
    setNewName('');
    load();
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    await projectApi.joinProject(joinCode.trim().toUpperCase());
    setJoinCode('');
    load();
  };

  return (
    <div className="projects-page">
      <header className="projects-navbar">
        <span className="projects-navbar-title">ERDTool</span>
        <div className="projects-navbar-right">
          <span className="projects-navbar-user">{user?.name}</span>
          <button className="btn" onClick={logout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="projects-main">
        <div className="projects-actions">
          <div className="projects-action-card">
            <label>Nuevo proyecto</label>
            <div className="projects-action-row">
              <input
                placeholder="Nombre del proyecto"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button className="btn btn-primary" onClick={handleCreate}>
                <Plus size={14} /> Crear
              </button>
            </div>
          </div>

          <div className="projects-action-card">
            <label>Unirme con código de invitación</label>
            <div className="projects-action-row">
              <input
                placeholder="Ej: A3F9K2"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
              />
              <button className="btn" onClick={handleJoin}>
                <KeyRound size={14} /> Unirme
              </button>
            </div>
          </div>
        </div>

        <h2 className="projects-section-title">Mis proyectos</h2>

        {projects.length === 0 ? (
          <p className="projects-empty">Todavía no tenés proyectos. Creá uno o unite con un código.</p>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <button key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="project-card-name">{p.name}</div>
                <div className="project-card-code">Código: {p.inviteCode}</div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}