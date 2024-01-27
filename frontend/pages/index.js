import Chat from "../components/chat/Main";
import Layout from "../components/chat/Layout";
import {getCsrfToken, getServerSidePropsAuthHelper} from "../api/auth";
import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {setCsrfToken} from "../redux/auth";

function Home({isAuthenticated}) {
    console.log("Home");
    if (!isAuthenticated) {
        return <div>You are not authenticated, login first</div>;
    }
    const dispatch = useDispatch();

    useEffect(() => {
        getCsrfToken().then((response) => {
            if (response.ok) {
                dispatch(setCsrfToken(response.data));
            } else {
                console.error(response.data);
            }
        });
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
