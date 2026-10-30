const { populate } = require('dotenv');
const express = require('express');
const app = express();
app.use(express.json());
const mongoose = require('mongoose');

mongoose
    .connect(`${process.env.URL}${process.env.DBNAME}`)
    .then(() => console.log("Connected to mongodb using mongoose"))
    .catch((error) => console.log(`Connect fail because ${error}`));


app.use(express.json());

const host = process.env.HOST;
const port = process.env.PORT || 8888;
app.listen(port, host, () => {
    console.log(`Server dang chay tai http://${host}:${port}`);
})

