import { useCurrentUser } from "../../hooks/use-auth";
import { RequireAuth } from "../../components/providers/require-auth";
import { AppShell } from "../../components/layouts/app-shell";
import { RepoDashboard } from "../../components/Dashboard/RepoDashboard";

const DashboardPage = ()=>{
    const {data:user, isLoading} = useCurrentUser();

    console.log(user, isLoading);

    return(
        <RequireAuth>
            <AppShell hideHeader>
                <RepoDashboard />
            </AppShell>
        </ RequireAuth>
    )
}

export default DashboardPage;