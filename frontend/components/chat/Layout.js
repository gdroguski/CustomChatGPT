import React from 'react';
import Head from 'next/head';
import styles from '../../styles/chat/Layout.module.css';
import NavigationSidebar from "../sidebars/NavigationSidebar";
import HistorySidebar from "../sidebars/history/HistorySidebar";

const Layout = ({children, title = 'Custom GPT'}) => {
    return (
        <div className={styles.appRoot}>
            <Head>
                <title>{title}</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <div className={styles.appSidebar}>
                <NavigationSidebar/>
            </div>
            <div className={styles.appSidebar}>
                <HistorySidebar/>
            </div>
            <div className={styles.appBody}>
                {children}
            </div>
        </div>
    )
}

export default Layout;
