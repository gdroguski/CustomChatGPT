import React, {useCallback} from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import styles from '../../styles/sidebars/Sidebar.module.css';
import {useDispatch, useSelector} from "react-redux";
import {postLogoutThunk} from "../../redux/auth";


const NavigationSidebar = () => {
    const auth = useSelector(state => state.auth);
    const csrfToken = auth.csrfToken;
    const dispatch = useDispatch();

    const renderLogout = () => {
        if (csrfToken === null) {
            return null;
        }

        return (
            <Link
                className={styles.logoutContainer}
                href={"/"}
                onClick={() => {
                    dispatch(postLogoutThunk({csrfToken}));
                }}
            >
                <span>Logout</span>
            </Link>
        )
    };


    const navElements = useCallback(() => {
        return (
            <>
                <Link href={"/"}>
                    <h1>Internal<br/>ChatGPT</h1>
                </Link>
                <ul>
                    <Link href="/">
                        <li>Chat</li>
                    </Link>
                    <Link href="/">
                        <li>Knowledge Bases</li>
                    </Link>
                    <Link href="/">
                        <li>Work with file</li>
                    </Link>
                    <Link href="/">
                        <li>Work with 2 files</li>
                    </Link>
                </ul>
                {renderLogout()}
            </>
        )
    }, [auth]);

    const description = "Chat Types";
    return (
        <Sidebar navElements={navElements} description={description}/>
    );
}

export default NavigationSidebar;
