import RegisterForm from "../components/auth/RegisterForm";
import styles from "../styles/auth/auth.module.css"
import {NewUserIcon} from "../assets/SVGIcon";
import React, {useState} from "react";
import Link from "next/link";

function RegisterPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const disabledClassName = isSubmitting ? styles.disabled : '';

    return (
        <div className={styles.authRoot}>
            <div className={styles.registerContainer}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <NewUserIcon/>
                        <h1>Create an account</h1>
                    </div>
                    <RegisterForm isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}/>
                    <div className={styles.formFooter}>
                        <Link href={"/login"} className={disabledClassName}>Back</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    const currUser = context.req.cookies.user || null;

    if (currUser) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {
        props: {}
    }
}

export default RegisterPage;
