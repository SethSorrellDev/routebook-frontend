import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RouteListPage } from './pages/RouteListPage';
import { RouteDetailPage } from './pages/RouteDetailPage';
import { StopDetailPage } from './pages/StopDetailPage';
import { KnowledgeEntryDetailPage } from './pages/KnowledgeEntryDetailPage';
import { SearchResultsPage } from './pages/SearchResultsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RouteListPage />} />
          <Route path="/routes/:routeId" element={<RouteDetailPage />} />
          <Route path="/stops/:stopId" element={<StopDetailPage />} />
          <Route path="/knowledge-entries/:entryId" element={<KnowledgeEntryDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
