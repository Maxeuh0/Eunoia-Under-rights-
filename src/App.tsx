// @ts-nocheck
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Layout } from './components/layout/Layout';
import ZenEditor from './modules/editor/ZenEditor';
import MindWeaver from './modules/weaver/MindWeaver';
import JournalView from './modules/journal/JournalView';
import InsightDashboard from './modules/dashboard/InsightDashboard';

import InfiniteCanvas from './modules/canvas/InfiniteCanvas';

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/editor" replace />} />
            <Route path="/editor" element={<ZenEditor />} />
            <Route path="/editor/:noteId" element={<ZenEditor />} />
            <Route path="/canvas" element={<InfiniteCanvas />} />
            <Route path="/weaver" element={<MindWeaver />} />
            <Route path="/journal" element={<JournalView />} />
            <Route path="/dashboard" element={<InsightDashboard />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreProvider>
  );
}

export default App;
