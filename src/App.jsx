import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import './App.css'
import NaviIQLanding from './Pages/LandingPage'
import LoginPage from "./Pages/LoginPage"
import SignupPage from "./Pages/SignUpPage"
import VerificationPage from "./Pages/VerficationPage"
import ForgotPasswordPage from "./Pages/ForgotPasswordPage"
import ResetPasswordPage from "./Pages/ResetPasswordPage"
// Using embedded notifications instead of toast
import { AuthProvider } from "./utils/AuthContext"
import AssessmentHome from "./Pages/AssessmentHome"
import PersonalQuestionsForm from "./components/PersonalQuestionsForm"
import ProtectedRoute from "./components/ProtectedRoute"
import ObjectiveQuestionsForm from "./components/ObjectiveQuestionsForm"
import CareerResultsPage from "./Pages/CareerAssessmentResultPage"
function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Using embedded notifications instead of toast */}
        <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Routes>
            <Route path="/" element={<NaviIQLanding />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/assessment" element={<ProtectedRoute><AssessmentHome /></ProtectedRoute>} />
            <Route 
              path="/assessment/personal" 
              element={
                <ProtectedRoute>
                  <PersonalQuestionsForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assessment/objective" 
              element={
                <ProtectedRoute>
                  <ObjectiveQuestionsForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <CareerResultsPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  )
}

export default App