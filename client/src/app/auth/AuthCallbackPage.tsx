import { useEffect } from "react";
import { Spinner } from "../../components/ui/spinner";
import { useCurrentUser } from "../../hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage(){
    const navigate = useNavigate();
    const {data:user, isLoading, isError, isFetched} = useCurrentUser();

    useEffect(()=>{
        if(!isFetched || isLoading) return;

        if(user){
            navigate("/dashboard");
            return ;
        }

        navigate("/login?error=session");
    },[user, isLoading, isFetched, isError, navigate]);

    return(
        <div className="flex min-h-svh flex-col items-center justify-center gap-3">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">Finishing Github SignIn...</p>
        </div>
    );
}