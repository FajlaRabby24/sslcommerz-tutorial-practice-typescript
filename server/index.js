require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const app = express();
const axios = require("axios");

// middleware
app.use(cors());
app.use(express.urlencoded());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("sslcommerz-tutorial");
    const paymentCollection = db.collection("paymentHistory");

    app.post("/create-ssl-payment", async (req, res) => {
      const payment = req.body;
      const trxId = new ObjectId().toString();
      payment.transactionId = trxId;
      const initiatePayment = {
        store_id: process.env.SSLCOMMERZ_STORE_ID,
        store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD,
        total_amount: payment.price,
        currency: "BDT",
        tran_id: trxId, // use unique tran_id for each api call
        success_url: "http://localhost:3000/success-payment",
        fail_url: "http://localhost:5173/fail",
        cancel_url: "http://localhost:5173/cancel",
        ipn_url: "http://localhost:3000/ipn-success-payment",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: payment.name,
        cus_email: payment.email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const { data } = await axios.post(
        "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
        initiatePayment,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      const paymentSaveToDB = await paymentCollection.insertOne(payment);
      const isHaveGetwayURL = await data?.GatewayPageURL;
      if (!isHaveGetwayURL) {
        return res.send({ message: "Invalid access" });
      }

      res.send({ isHaveGetwayURL });
    });

    app.post("/success-payment", async (req, res) => {
      const successPayment = req.body;
      const { data } = await axios.get(
        `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${successPayment?.val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWD}`
      );
      if (data?.status !== "VALID") {
        return res.send({ message: "Invalid payment" });
      }

      const updatePaymentStatus = await paymentCollection.updateOne(
        { transactionId: data.tran_id },
        { $set: { status: "success" } }
      );
      res.redirect(`http://localhost:5173/`);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment.🚀");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("hello world");
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
