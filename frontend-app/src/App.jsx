import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketFormPage from "./pages/TicketFormPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/new" element={<TicketFormPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/tickets/:id/edit" element={<TicketFormPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}