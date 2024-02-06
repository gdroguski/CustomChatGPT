import React, {useState} from 'react';
import {postRegister} from '../../api/auth';
import styles from "../../styles/auth/auth.module.css"
import {useRouter} from "next/router";
import {
    hasLowercase,
    hasNumber,
    hasSpecialCharacter,
    hasUppercase,
    isLongEnough,
    validateEmail,
    validatePassword
} from "../../utils/validation";

function Register({isSubmitting, setIsSubmitting}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const router = useRouter();

    const [isPasswordLongEnough, setPasswordLongEnough] = useState(false);
    const [doesPasswordHaveUppercase, setPasswordHasUppercase] = useState(false);
    const [doesPasswordHaveLowercase, setPasswordHasLowercase] = useState(false);
    const [doesPasswordHaveNumber, setPasswordHasNumber] = useState(false);
    const [doesPasswordHaveSpecialCharacter, setPasswordHasSpecialCharacter] = useState(false);

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
        if (!validateEmail(event.target.value)) {
            setErrorMessage("Invalid email address");
        } else {
            setErrorMessage("");
        }
    }

    const handleEmailBlur = () => {
        if (email === '') {
            setErrorMessage("Email is required");
        }
    };

    const handlePasswordChange = (event) => {
        const password = event.target.value;
        setPassword(password);

        setPasswordLongEnough(isLongEnough(password));
        setPasswordHasUppercase(hasUppercase(password));
        setPasswordHasLowercase(hasLowercase(password));
        setPasswordHasNumber(hasNumber(password));
        setPasswordHasSpecialCharacter(hasSpecialCharacter(password));

        if (!validatePassword(password)) {
            setErrorMessage("Password must meet all requirements.");
        } else {
            setErrorMessage("");
        }
    };

    const handlePasswordBlur = () => {
        if (password === '') {
            setErrorMessage("Password is required");
        }
    };

    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.target.value);
        if (event.target.value !== password) {
            setErrorMessage("Passwords do not match");
        } else {
            setErrorMessage("");
        }
    }

    const handleConfirmPasswordBlur = () => {
        if (confirmPassword === '') {
            setErrorMessage("Confirm Password is required");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (email === '' || password === '' || confirmPassword === '') {
            setErrorMessage("All fields are required");
            return;
        }

        setIsSubmitting(true);
        const response = await postRegister({email, password});

        if (response.ok) {
            router.push('/login').catch((error) => {
                console.error('An unexpected error occurred while redirecting to login page');
            });
        } else {
            setErrorMessage("An error occurred while registering. Please try again.");
            setIsSubmitting(false);
        }
    };

    const renderEmailField = () => {
        return (
            <div className={styles.formInputGroup}>
                <label>Email</label>
                <input
                    type="text"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder={"Enter email address"}
                    disabled={isSubmitting}
                    required
                />
            </div>
        );
    }

    const renderPasswordField = () => {
        const longEnoughClassName = isPasswordLongEnough ? styles.passed : '';
        const hasUppercaseClassName = doesPasswordHaveUppercase ? styles.passed : '';
        const hasLowercaseClassName = doesPasswordHaveLowercase ? styles.passed : '';
        const hasNumberClassName = doesPasswordHaveNumber ? styles.passed : '';
        const hasSpecialCharacterClassName = doesPasswordHaveSpecialCharacter ? styles.passed : '';

        return (
            <div className={styles.formInputGroup}>
                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    placeholder={"Enter password"}
                    disabled={isSubmitting || !validateEmail(email)}
                    required
                />
                <ul className={styles.passwordRequirements}>
                    <li className={longEnoughClassName}><p>Must be at least 8 characters long</p></li>
                    <li className={hasUppercaseClassName}><p>Must contain an uppercase letter</p></li>
                    <li className={hasLowercaseClassName}><p>Must contain a lowercase letter</p></li>
                    <li className={hasNumberClassName}><p>Must contain a number</p></li>
                    <li className={hasSpecialCharacterClassName}><p>Must contain a special character</p></li>
                </ul>
            </div>
        );
    }

    const renderConfirmPasswordField = () => {
        return (
            <div className={styles.formInputGroup}>
                <label>Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder={"Confirm password"}
                    disabled={isSubmitting || !validateEmail(email) || !validatePassword(password)}
                    required
                />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.authForm}>
            {renderEmailField()}
            {renderPasswordField()}
            {renderConfirmPasswordField()}
            <button
                type="submit"
                disabled={isSubmitting || !validateEmail(email) || !validatePassword(password) || password !== confirmPassword}
            >Register
            </button>
            {
                errorMessage &&
                <div className={styles.errorMessage}>
                    <p>{errorMessage}</p>
                </div>
            }
        </form>
    );
}

export default Register;
