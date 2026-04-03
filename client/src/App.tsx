import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import ConfigPage from "./pages/config/ConfigPage";
import ProcessPage from "./pages/process/ProcessPage";
import HistoryPage from "./pages/history/HistoryPage";
import FoldersPage from "./pages/folders/FoldersPage";
import FolderPage from "./pages/folders/FolderPage";
import LandingPage from "./pages/landing/LandingPage";

export default function App(): React.JSX.Element {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/process" element={<ProcessPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/folders" element={<FoldersPage />} />
        <Route path="/folders/:id" element={<FolderPage />} />
        <Route path="/config" element={<ConfigPage />} />
      </Routes>
    </AppLayout>
  );
}
