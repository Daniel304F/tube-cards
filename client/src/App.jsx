import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<p>Landing</p>} />
        <Route path="/process" element={<p>Process</p>} />
        <Route path="/history" element={<p>History</p>} />
        <Route path="/folders/:id" element={<p>Folder</p>} />
        <Route path="/config" element={<p>Config</p>} />
      </Routes>
    </AppLayout>
  );
}
