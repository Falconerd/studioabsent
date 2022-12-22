import React from "react";
import Link from "next/link";
import { FaInstagram, FaFacebookF, FaEnvelope } from "react-icons/fa";
import styles from "./Footer.module.css";

export const Footer = (): JSX.Element => {
  return (
    <div className={styles.Footer}>
      <a href="https://instagram.com/studio__absent" target="_blank" rel="noreferrer">
        <FaInstagram />
      </a>
      <a href="#" target="_blank">
        <FaFacebookF />
      </a>
      <a href="mailto:studioabsent.au@gmail.com">
        <FaEnvelope />
      </a>
    </div>
  );
};
