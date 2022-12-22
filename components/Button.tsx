import React from "react";
import styles from "./Button.module.css";

type ButtonProps = {
  secondary?: boolean;
  className?: string;
  children?: JSX.Element | number;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
};

export const Button = ({
  secondary,
  className,
  children,
  onClick,
  type,
}: ButtonProps): JSX.Element => {
  let _className = `${styles.Button}`;

  if (secondary) {
    _className += ` ${styles.secondary}`;
  }

  if (className) {
    _className += ` ${className}`;
  }

  return (
    <button className={_className} type={type} onClick={onClick}>
      {children}
    </button>
  );
};
