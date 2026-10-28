import { useParams } from "react-router-dom";
import { ChatView } from "../../components/Chat/ChatView";
import { RequireAuth } from "../../components/providers/require-auth";

export default function ChatPage(){
    const {repoId} = useParams();

    if(!repoId)
        return <div>Error: Repository ID is missing.</div>;
    
    return(
        <RequireAuth>
            <ChatView repoId={repoId} />
        </RequireAuth>
    )
}