import axios from "axios";
import type React from "react";
import "./App.css";
const userEmail = "fajlarabbyla24@gmail.com";

type PAYMENTTYPE = {
  name: string;
  email: string;
  date: string;
  price: number;
  status: string;
};

const App = () => {
  const handleCreatePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payment: PAYMENTTYPE = {
      name: "Fajla Rabby",
      email: userEmail,
      date: new Date().toISOString(),
      price: 9320,
      status: "pending",
    };

    const { data } = await axios.post(
      `http://localhost:3000/create-ssl-payment`,
      payment
    );
    if (data?.isHaveGetwayURL) {
      window.location.replace(data?.isHaveGetwayURL);
    }
  };

  return (
    <div>
      <form onSubmit={handleCreatePayment}>
        <input
          type="text"
          placeholder="Type here"
          className="input"
          defaultValue={userEmail}
        />
        <button type="submit" className="btn btn-primary mt-2 btn-block">
          Submit
        </button>
      </form>
    </div>
  );
};

export default App;
