import type { NextPage } from "next";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import { Footer } from "../components/Footer";

const Home: NextPage = () => {
  return (
    <>
      <div className={styles.container}>
        <img alt="Studio Absent logo" width="100%" src="/logo.png" />
        <Link href="/bookings">
          <button>Booking</button>
        </Link>
        <Footer />
        <div className={styles.Address}>
          {/* <p>Tavistock House, Basement</p> */}
          <p>
            Basement, 387 Flinders Lane,
            <br />
            Melbourne, 3000
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
