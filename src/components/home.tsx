import React from "react";
import { Navbar } from "./navbar";
import "../styles/app.scss"
export const Home: React.FC = () => {
  return (
    <>
      <Navbar />
      <section className="home">
        <div className="container">
          <h1 className="title">Welcome to MyApp</h1>
          <p className="subtitle">This is the home page of your application.</p>
        </div>
      </section>
    </>
  );
};
