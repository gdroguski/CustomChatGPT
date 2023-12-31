import Head from 'next/head';
import Chat from "../components/Chat";

export default function Home() {
    return (
        <>
            <Head>
                <title>Custom ChatGPT</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Chat/>
        </>
    );
}
