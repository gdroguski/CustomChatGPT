import React, {useState} from 'react';
import {postLogin} from '../../api/auth';
import styles from "../../styles/auth/login.module.css"
import {setUser} from "../../redux/auth";
import {useDispatch} from "react-redux";
import {useRouter} from "next/router";

function Login({isSubmitting, setIsSubmitting}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const dispatch = useDispatch();
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const response = await postLogin({username, password});

        if (response.ok) {
            dispatch(setUser(username));
            router.push('/').catch((error) => {
                console.error('An unexpected error occurred while redirecting to main page:', error);
            });

        } else {
            setErrorMessage(response.data);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formInputGroup}>
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={"Enter username"}
                />
            </div>
            <div className={styles.formInputGroup}>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"Enter password"}
                />
            </div>
            <button type="submit" disabled={isSubmitting}>Log In</button>
            {
                errorMessage &&
                <div className={styles.errorMessage}>
                    <p>{errorMessage}</p>
                </div>
            }
        </form>
    );
}

export default Login;
