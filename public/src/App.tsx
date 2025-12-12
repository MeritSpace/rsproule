import { Routes, Route, Link } from 'react-router-dom'

// Import your apps here
import Tekkers from './apps/tekkers'

const apps = [
  { name: 'Tekkers', path: '/apps/tekkers', description: '3D cube juggling game - keep the cube bouncing!' },
]

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>rsproule's Apps</h1>
      {apps.length === 0 ? (
        <p style={{ color: '#666' }}>No apps yet. Create one in src/apps/</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {apps.map((app) => (
            <li key={app.path} style={{ marginBottom: '1rem' }}>
              <Link to={app.path} style={{ fontSize: '1.2rem' }}>{app.name}</Link>
              <p style={{ margin: '0.25rem 0', color: '#666' }}>{app.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/apps/tekkers/*" element={<Tekkers />} />
    </Routes>
  )
}
