// @ts-nocheck
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Layout } from './components/layout/Layout';
import ZenEditor from './modules/editor/ZenEditor';
import MindWeaver from './modules/weaver/MindWeaver';
import JournalView from './modules/journal/JournalView';
import InsightDashboard from './modules/dashboard/InsightDashboard';

import InfiniteCanvas from './modules/canvas/InfiniteCanvas';

// Wrapper to provide location key
const EditorRoute = () => {
  const location = useLocation();
  // Force remount when noteId changes (route changes)
  return <ZenEditor key={location.pathname} />;
};

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/editor" replace />} />
            <Route path="/editor" element={<EditorRoute />} />
            <Route path="/editor/:noteId" element={<EditorRoute />} />
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
