import React, {useState} from 'react';
import styles from "../../styles/auth/auth.module.css"
import {postLoginThunk} from "../../redux/auth";
import {useDispatch} from "react-redux";
import {useRouter} from "next/router";
import {validateEmail} from "../../utils/validation";

function Login({isSubmitting, setIsSubmitting}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const dispatch = useDispatch();
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const response = await dispatch(postLoginThunk({email, password}));
        const result = response.payload;

        if (result.ok) {
            router.push('/').catch((error) => {
                console.error('An unexpected error occurred while redirecting to main page');
            });

        } else {
            setErrorMessage(result.data);
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formInputGroup}>
                <label>Email</label>
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={"Enter email address"}
                    disabled={isSubmitting}
                    required
                />
            </div>
            <div className={styles.formInputGroup}>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={"Enter password"}
                    disabled={isSubmitting || !validateEmail(email)}
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting || !validateEmail(email) || password === ''}
            >Log In</button>
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
