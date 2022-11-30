const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

//port
const PORT = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tfzr2.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const userCollection = client.db("IMS").collection("user");
const categoryCollection = client.db("IMS").collection("category");
const productCollection = client.db("IMS").collection("product");
const orderCollection = client.db("IMS").collection("orders");
const paymentsCollection = client.db("IMS").collection("payment");

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
