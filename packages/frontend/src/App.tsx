import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Layout } from './components/Layout'
import { ToastContainer } from './components/Toast'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { PromptBrowser } from './pages/PromptBrowser'
import { WritingDesk } from './pages/WritingDesk'
import { Portfolio } from './pages/Portfolio'
import { SubmissionDetail } from './pages/SubmissionDetail'
import { AdminPrompts } from './pages/AdminPrompts'

export function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/prompts" element={<PromptBrowser />} />
          <Route path="/write" element={<WritingDesk />} />
          <Route path="/write/:id" element={<WritingDesk />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<SubmissionDetail />} />
          <Route path="/admin/prompts" element={<AdminRoute><AdminPrompts /></AdminRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
