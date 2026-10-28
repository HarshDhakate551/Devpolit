import { BrowserRouter, Route, Routes } from "react-router-dom"
import QueryProvider from "./components/providers/query-provider"
import { ThemeProvider } from "./components/providers/theme-provider"
import { ModeToggle } from "./components/ui/mode-toggle"
import LoginPage from "./components/Login/login"
import DashboardPage from "./app/Dashboard/DashboardPage"
import AuthCallbackPage from "./app/auth/AuthCallbackPage"
import { PublicOnlyRoute } from "./components/proxy/PublicOnlyRoute"
import { ProtectedRoute } from "./components/proxy/ProtectedRoute"
import HomePage from "./components/home/HomePage"
import ChatPage from "./app/chat/ChatPage"
import { SettingsDashboard } from "./components/Dashboard/SettingsDashboad"

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {/* <div className="flex min-h-screen justify-center items-center bg-background text-foreground ">
          <ModeToggle />
          <h1 className="text-2xl font-bold">Welcome to Devpilot! {}</h1>
        </div> */}

        {/* Pages */}
        <div>
          <Routes>
            <Route path={"/"} element={<HomePage />} />

            {/* Login page (redirects to dashboard if already authed) */}
            <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
            </Route>
            
            {/* Protected Routes (redirects to login if not authed) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat/:repoId" element={<ChatPage />} />
                <Route path="/dashboard/settings" element={<SettingsDashboard />} />
                {/* <Route path="/chat" element={<ChatPage />} /> */}
            </Route>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />



            <Route  path={"*"} element={<h1>404 Page Not Found</h1>} />
          </Routes>
        </div>
      </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}

export default App