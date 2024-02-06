import Chat from "../components/chat/Main";
import Layout from "../components/chat/Layout";
import {getServerSidePropsAuthHelper} from "../api/auth";
import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {fetchCsrfTokenThunk} from "../redux/auth";

function Home({isAuthenticated}) {
    console.log("Home");
    if (!isAuthenticated) {
        return <div>You are not authenticated, login first</div>;
    }
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCsrfTokenThunk());
    }, [dispatch]);

    return (
        <Layout title="Custom ChatGPT">
            <Chat/>
        </Layout>
    );
}


export async function getServerSideProps(context) {
    return getServerSidePropsAuthHelper(context);
}

export default Home;
