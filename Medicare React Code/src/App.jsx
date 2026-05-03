import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AIAssistantPage from './pages/AIAssistantPage'
import DashboardPage from './pages/DashboardPage'
import DoseHistoryPage from './pages/DoseHistoryPage'
import GetStartedPage from './pages/GetStartedPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MedicationsPage from './pages/MedicationsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import RegistrationPage from './pages/RegistrationPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<GetStartedPage />} path="/get-started" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegistrationPage />} path="/registration" />
      <Route element={<RegistrationPage />} path="/register" />
      <Route element={<PrivacyPolicyPage />} path="/privacy-policy" />
      <Route element={<Navigate replace to="/dashboard" />} path="/profile-setup" />

      <Route element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} path="/dashboard" />
      <Route element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} path="/medications" />
      <Route element={<ProtectedRoute><DoseHistoryPage /></ProtectedRoute>} path="/dose-history" />
      <Route element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} path="/ai-assistant" />
      <Route element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} path="/settings" />

      <Route element={<Navigate replace to="/registration" />} path="/registeration" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default App
