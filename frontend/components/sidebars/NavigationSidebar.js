import React, {useCallback} from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";


const NavigationSidebar = () => {
    const navElements = useCallback(() => {
        return (
            <>
                <Link href={"/"}>
                    <h1>Internal<br/>ChatGPT</h1>
                </Link>
                <ul>
                    <Link href="/"><li>Chat</li></Link>
                    <Link href="/"><li>Knowledge Bases</li></Link>
                    <Link href="/"><li>Work with file</li></Link>
                    <Link href="/"><li>Work with 2 files</li></Link>
                </ul>
            </>
        )
    }, []);

    const description = "Chat Types";
    return (
        <Sidebar navElements={navElements} description={description}/>
    );
}

export default NavigationSidebar;
