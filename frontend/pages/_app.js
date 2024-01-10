import '../styles/globals.css';
import React from "react";
import {Provider} from "react-redux";
import {store} from "../redux/store";
import Layout from "../components/chat/Layout";
import Modal from "react-modal";

Modal.setAppElement('#__next');

function MyApp({Component, pageProps}) {
    return (
        <React.StrictMode>
            <Provider store={store}>
                <Layout title={Component.title}>
                    <Component {...pageProps} />
                </Layout>
            </Provider>
        </React.StrictMode>
    )
}

export default MyApp;
