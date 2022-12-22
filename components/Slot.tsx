import React from "react";
import { Button } from "./Button";
import styles from "./Slot.module.css";

type SlotProps = {
  day?: number;
  times?: number[];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: JSX.Element;
};

export const Slot = ({
  day,
  times,
  onClick,
  children,
}: SlotProps): JSX.Element => {
  let className = styles.Slot;

  if (times) {
    className += " " + styles.SlotAvailable;
  }

  if (children) {
    return <div className={styles.Slot}>{children}</div>;
  }

  return (
    <Button className={className} type="button" onClick={onClick}>
      {day}
    </Button>
  );
};
