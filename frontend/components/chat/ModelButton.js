import React, {useState} from 'react';
import styles from "../../styles/chat/ModelButton.module.css";

import {GPT35, GPT4} from "../../utils/constants";

const ChoiceButton = ({disabled, chosenModel, onChoice}) => {
    const [chosenGPT, setChosenGPT] = useState(chosenModel);
    const chosenGPT35 = chosenGPT === GPT35;

    const disabledClass = disabled ? styles.disabled : '';

    const handleGPT35Choice = () => {
        handleChoice(GPT35);
    }

    const handleGPT4Choice = () => {
        handleChoice(GPT4);
    }

    const handleChoice = (option) => {
        setChosenGPT(option);
        onChoice(option);
    };

    return (
        <div className={styles.choiceContainer}>
            <button
                className={`${styles.choiceButton} ${chosenGPT35 ? styles.chosen : ''} ${disabledClass}`}
                onClick={handleGPT35Choice}
                disabled={chosenGPT35 || disabled}
            >
                {GPT35}
            </button>
            <button
                className={`${styles.choiceButton} ${!chosenGPT35 ? styles.chosen : ''} ${disabledClass}`}
                onClick={handleGPT4Choice}
                disabled={!chosenGPT35 || disabled}
            >
                {GPT4}
            </button>
        </div>
    );
}

export default ChoiceButton;
