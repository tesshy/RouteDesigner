import { Routes, Route } from 'react-router-dom';
import RouteEditor from './pages/RouteEditor';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<RouteEditor />} />
    </Routes>
  );
}

export default App;
