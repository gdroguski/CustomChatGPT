import styles from "../../styles/chat/ControlButtons.module.css";
import SVGButton from "../common/SVGButton";
import React from "react";
import {RegenerateIcon, StartIcon, StopIcon} from "../../assets/SVGIcon";

export const ControlButtons = ({generateProps, stopProps, regenerateProps}) => {
    const generateDisabledClass = generateProps.disabled ? styles.disabled : '';
    const stopDisabledClass = stopProps.disabled ? styles.disabled : '';
    const regenerateDisabledClass = regenerateProps.disabled ? styles.disabled : '';

    return (
        <div className={styles.controlButtons}>
            <SVGButton
                className={`${styles.generateButton} ${generateDisabledClass}`}
                SVGIcon={StartIcon}
                {...generateProps}
            />
            <SVGButton
                className={`${styles.stopButton} ${stopDisabledClass}`}
                SVGIcon={StopIcon}
                {...stopProps}
            />
            <SVGButton
                className={`${styles.regenerateButton} ${regenerateDisabledClass}`}
                SVGIcon={RegenerateIcon}
                {...regenerateProps}
            />
        </div>
    )
};
