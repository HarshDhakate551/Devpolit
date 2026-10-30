import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { queryKeys } from "../lib/query-keys";
import { useNavigate } from "react-router-dom";

export const AUTH_COOKIE = "devpilot_auth";

export function setAuthCookies(authed: boolean){
    if(typeof document === "undefined") return ;

    if(authed)
        document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60*60*24*7}; SameSite=Lax`; 
    else
        document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function useCurrentUser(){
    return useQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: async()=>{
            try{
                const user = await api.me();
                setAuthCookies(true);
                return user;
            } catch(error){
                setAuthCookies(false);
                throw error;
            }
        }
    })
}

export function useLogout(){
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async ()=>{
            await api.logout();
        },
        onSuccess: ()=>{
            setAuthCookies(false);

            // Navigate first so protected components unmount
            navigate("/login", { replace: true });

            // Then wipe cached data (no refetch, no error state)
            queryClient.removeQueries({ queryKey: queryKeys.auth.all });
            queryClient.clear(); // optional: drops ALL cached data (projects, etc.)
        },
    });
}

