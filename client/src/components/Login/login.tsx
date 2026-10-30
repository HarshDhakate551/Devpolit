import { Suspense, useEffect } from "react";
import { Spinner } from "../ui/spinner";
import {useSearchParams, Link, useNavigate} from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { ModeToggle } from "../ui/mode-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";
import {GitHubIcon} from "../icons/github-icon";
import {BrandMark} from "../layouts/app-shell";
import { getGithubLoginUrl } from "../../lib/api";
import { useCurrentUser } from "../../hooks/use-auth";

function LoginLoading(){
    return(<div className="flex min-h-svh items-center justify-center" >
        <Spinner className="size-8" />
    </div>)
}

const LoginContent = ()=>{
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const error = searchParams.get("error");
    const next = searchParams.get("next") || "/dashboard";
    const {data:user, isLoading} = useCurrentUser();
    
    useEffect(()=>{
        if(!isLoading && user)
            navigate(next.startsWith("/") ? next: "/dashboard");
    },[user,isLoading, navigate, next])
    
    if(isLoading) return <LoginLoading />

    return(<>
        
        <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
            <div className="pointer-events-none absolute insert-0 bg-[radial-gradient(ellipse_at_top,oklch(from_var(--primary)_l_c_h/0.1),transparent_55%)]" />
                <header className="relative z-10 flex h-14 items-center justify-between px-4">
                    <Link to="/">
                        <BrandMark />
                    </Link>
                    <ModeToggle />
                </header>

                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
                    <Card className="w-full max-w-sm border-border/70 bg-card/90 shadow-lg shadow-foreground/5 backdrop-blur-xl">
                        <CardHeader className="space-y-4 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
                                <GitHubIcon className="size-6 " />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-xl">Sign In</CardTitle>
                                <CardDescription>Connect Github to chat with you repositories.</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {
                                error && (
                                    <Alert variant="destructive">
                                        <AlertCircle />
                                        <AlertTitle>Sigin-in Failed</AlertTitle>
                                        <AlertDescription>Please try again.</AlertDescription>
                                    </Alert>
                                )
                            }

                            <a
                                href={getGithubLoginUrl()}
                                className={cn(
                                    buttonVariants({size:"lg"}),
                                    "inline-flex w-full items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90"
                                )}
                            >
                                <GitHubIcon className="size-5" />
                                    Continue with GitHub
                            </a>

                        </CardContent>

                    </Card>
                </main>
        </div>
    </>)
}

export default function LoginPage(){
    return(
        <Suspense fallback={<LoginLoading />}>
            <LoginContent />
        </Suspense>
    )
};