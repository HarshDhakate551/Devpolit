import { useState, type ReactNode } from 'react'
import {  QueryClient, QueryClientProvider} from '@tanstack/react-query'

interface QueryProviderProps {
    children: ReactNode;
}

const QueryProvider = ({children} : QueryProviderProps)=>{
    const [query, setQuery] = useState(()=> { return new QueryClient()});

    return(
        <QueryClientProvider client={query}>{children}</QueryClientProvider>
    )
}

export default QueryProvider