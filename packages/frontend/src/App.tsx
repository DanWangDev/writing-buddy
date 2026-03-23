import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { PromptBrowser } from './pages/PromptBrowser'
import { WritingDesk } from './pages/WritingDesk'
import { Portfolio } from './pages/Portfolio'
import { SubmissionDetail } from './pages/SubmissionDetail'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
        </Route>
      </Routes>
    </AuthProvider>
  )
}
