import { Navigate, Outlet } from "react-router-dom";

const AUTH_COOKIE = "devpilot_auth";

// Simple helper to check cookie on the client
function getCookie(name:string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function ProtectedRoute() {
    const isAuthed = getCookie(AUTH_COOKIE) === "1";

    if (!isAuthed) {
        // Redirect to login and preserve the intended destination
        const currentPath = window.location.pathname + window.location.search;
        return <Navigate to={`/login?next=${encodeURIComponent(currentPath)}`} replace />;
    }

    return <Outlet />;
}