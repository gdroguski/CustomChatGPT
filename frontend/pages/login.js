import Login from "../components/auth/LoginForm";
import styles from "../styles/auth/login.module.css"
import {LockKeyIcon} from "../assets/SVGIcon";
import React, {useState} from "react";
import Link from "next/link";

function LoginPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const disabledClassName = isSubmitting ? styles.disabled : '';

    return (
        <div className={styles.loginRoot}>
            <div className={styles.loginContainer}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <LockKeyIcon/>
                        <h1>Login</h1>
                    </div>
                    <Login isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}/>
                    <div className={styles.formFooter}>
                        <Link href={"#"} className={disabledClassName}>Forgot credentials?</Link>
                        <Link href={"#"} className={disabledClassName}>Create account?</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
