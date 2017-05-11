import React from 'react';
import classNames from 'classnames';

import styles from './Octopus.scss';

interface IOctopusConnectionProps extends React.SVGProps<{}> {
    connected: boolean;
    className: string;
}

/* tslint:disable:variable-name */
export const OctopusConnection = ({connected, className, ...rest}: IOctopusConnectionProps) => (
    <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 186 186"
        enableBackground="new 0 0 186 186"
        xmlSpace="preserve"
        {...rest}
        className={classNames(styles.octopus, className, {
            [styles.connected]: connected
        })}
    >
        <g className={styles.octopusBack}>
            <path
                fill="#1772B9"
                d="M122.6,184.5c-2.2,0-4.3-1.5-4.9-3.7c-0.8-2.7,0.8-5.5,3.5-6.3c8.7-2.4,11.9-8.7,13.1-13.5 c2.2-9-1-19.9-7.9-26.3c-15.7-14.8-23.2-23.3-23.2-31.3V55.8c0-2.8,2.3-5.1,5.1-5.1s5.1,2.3,5.1,5.1v47.6c0,5,13,17.3,20,23.9 c9.6,9,13.9,23.6,10.8,36.2c-2.6,10.5-9.8,17.9-20.3,20.8C123.5,184.5,123.1,184.5,122.6,184.5z"
            />
            <path
                fill="#1772B9"
                d="M96,162.3c-2.8,0-5.1-2.3-5.1-5.1v-96c0-2.8,2.3-5.1,5.1-5.1s5.1,2.3,5.1,5.1v96 C101.1,160.1,98.8,162.3,96,162.3z"
            />
            <path
                fill="#1772B9"
                d="M161.7,144.5c-2.8,0-5.1-2.3-5.1-5.1c0-21.6-4.5-30-16.2-30c-17.9,0-24.6-6.9-24.6-25.3V61.8 c0-2.8,2.3-5.1,5.1-5.1s5.1,2.3,5.1,5.1V84c0,6.7,0.9,10.7,2.8,12.6c1.8,1.8,5.4,2.6,11.6,2.6c26.4,0,26.4,29.2,26.4,40.2 C166.8,142.2,164.6,144.5,161.7,144.5z"
            />
        </g>
        <g className={styles.octopusFront}>
            <path
                fill="#51C9F1"
                d="M151.6,113.5c-8.1,0-18.9-2.4-18.9-23.5V66l0,0V32c0-0.1,0-0.2,0-0.4c0-16.8-13.6-30.4-30.4-30.4 C85.7,1.2,72.1,14.7,72,31.4l0,0v12.2l0,0v60.9c-1.5,0.4-3,0.6-4.6,0.6c-9.5,0-17.3-7.8-17.3-17.3c0-4.5-1.4-14.8-14.8-14.8h-2.4 c-1.5-1.8-3.9-2.9-7.7-2.9c-0.1,0-0.2,0-0.3,0V74h-6.4v3h6.4v3h-6.4v3h6.4v3.5c0.1,0,0.2,0,0.3,0c3.9,0,6.4-1.3,7.9-3.2h2.2 c3.2,0,4.6,0.4,4.6,4.6c0,15.2,12.3,27.5,27.5,27.5c1.6,0,3.1-0.1,4.6-0.4v4.5h-2.6c-12.7,0-19.1,6.7-19.1,19.9 c0,2.8,2.3,5.1,5.1,5.1s5.1-2.3,5.1-5.1c0-8.3,2.7-9.7,8.9-9.7H72v2.9c0,2.8,2.3,5.1,5.1,5.1s5.1-2.3,5.1-5.1v-2.9h13.2 c0.6,0,1.3,0,1.9,0v2c0,9.8-4.1,10.7-8.3,10.7H68.6c-2.8,0-5.1,2.3-5.1,5.1s2.3,5.1,5.1,5.1H89c5.6,0,18.5-2,18.5-20.9V128 c2.8-1,5.1-2.4,6.9-4.3c5.6-5.7,5.6-13.8,5.5-21.7c0-0.9,0-1.7,0-2.6V66h2.7v24c0,21.7,10.3,33.7,29,33.7c23.7,0,23.7,6.4,23.7,10.7 c0,2.8,2.3,5.1,5.1,5.1s5.1-2.3,5.1-5.1C185.5,115.9,167.4,113.5,151.6,113.5z M84.7,88.1c0,3.2-0.9,6.1-2.5,8.7V66h2.4v21.9 C84.7,88,84.7,88,84.7,88.1z M95.4,119.5H82.2V111c7.6-4.9,12.7-13.4,12.7-23.1c0-0.1,0-0.2,0-0.2V66h2.4v53.5 C96.7,119.5,96.1,119.5,95.4,119.5z M109.7,102.1c0,6,0.1,11.3-2.2,14.1V66h2.2v33.4C109.7,100.3,109.7,101.2,109.7,102.1z"
            />
            <g className={styles.eye}>
                <circle
                    fill="white"
                    cx="82.8" cy="47.6" r="3.6"
                />
                <circle
                    fill="#1172B7"
                    cx="84.5" cy="47.8" r="1.9"
                />
            </g>
            <g className={styles.eye}>
                <circle
                    fill="white"
                    cx="105.7" cy="47.6" r="3.6"
                />
                <circle
                    fill="#1172B7"
                    cx="107.4" cy="47.7" r="1.9"
                />
            </g>
            <path
                fill="#1772B9"
                d="M88.2,34.4c-1.4-1.2-3.4-1.9-5.6-1.9s-4.2,0.7-5.6,1.9H88.2z"
            />
            <path
                fill="#1772B9"
                d="M111.2,37.4c-1.5-1.2-3.6-1.9-5.9-1.9s-4.4,0.7-5.9,1.9H111.2z"
            />
            <circle
                fill="#77D0EC"
                cx="102.8" cy="16.4" r="4.1"
            />
            <circle
                fill="#77D0EC"
                cx="114.9" cy="19.2" r="6.9"
            />
            <circle
                fill="#77D0EC"
                cx="108.6" cy="9" r="3.6"
            />
        </g>
        <rect x="0.2" y="63.6"
            fill="#1772B9"
            width="11.8" height="52.4"
        />
        <path
            fill="#51C9F1"
            d="M8.4,83v-7c0-1.3-1.1-2.4-2.4-2.4S3.6,74.7,3.6,76v7H8.4z"
        />
        <path
            fill="#51C9F1"
            d="M8.4,103.4v-7c0-1.3-1-2.4-2.4-2.4s-2.4,1.1-2.4,2.4v7H8.4z"
        />
        <path
            fill="none"
            stroke="#1772B9"
            strokeWidth="10.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            d="M108.3,60.3"
        />
        <path
            fill="none"
            stroke="#1772B9"
            strokeWidth="10.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            d="M108.3,60.3"
        />
    </svg>
);



// WEBPACK FOOTER //
// ./src/client/common/components/Octopus.tsx