const express = require('express');
const path = require('path');
const braintree = require('braintree');

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: '{{merchant_id}}',
  publicKey: '{{public_key}}',
  privateKey: '{{private_key}}'
});

const app = express();
const port = 3000;
const DIST_DIR = path.join(__dirname, '../dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(express.static(DIST_DIR));
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/requestToken', async (req, res) => {
  try {
    gateway.clientToken.generate({}, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post('/payment', async (req, res) => {
  try {
    const nonceFromTheClient = req.body.paymentMethodNonce;
    const price = req.body.price;
    const id = randomnumber = Math.floor(Math.random() * 1000) + 100;
    var newTransaction = gateway.transaction.sale(
      {
        amount: price,
        paymentMethodNonce: nonceFromTheClient,
        orderId: id,
        options: {
          submitForSettlement: true,
          storeInVaultOnSuccess: true
        }
      }, (error, result) => {
        if (result) {
          res.send(result);
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

app.get('/ping', (req, res) => {
    res.send('Braintree backend is up and running');
});

app.get('/', (req, res) => {
 res.sendFile(HTML_FILE); 
});

app.listen(port, () =>  {
 console.log('App listening on port: ' + port);
});
