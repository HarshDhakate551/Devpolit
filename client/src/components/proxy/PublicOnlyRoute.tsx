import { Navigate, Outlet } from "react-router-dom";

const AUTH_COOKIE = "devpilot_auth";

function getCookie(name:string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function PublicOnlyRoute() {
    const isAuthed = getCookie(AUTH_COOKIE) === "1";

    if (isAuthed) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}