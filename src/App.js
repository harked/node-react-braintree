import React, { Component } from 'react';
import 'braintree-web';
import axios from 'axios';
import { BraintreeDropIn } from 'braintree-web-react'

export default class App extends Component {
  instance;

  state = {
    clientToken: null,
    requestFailed: false,
    fruits: {
      Apple: {quantity: 0, price: 0},
      Orange: {quantity: 0, price: 0},
      Banana: {quantity: 0, price: 0},
      Grapes: {quantity: 0, price: 0},
      Mango: {quantity: 0, price: 0}
    },
    totalPrice: 0,
    response: {}
  };

  fruits = [
    {
      name: 'Apple',
      price: 5
    },
    {
      name: 'Orange',
      price: 5
    },
    {
      name: 'Banana',
      price: 2
    },
    {
      name: 'Grapes',
      price: 10
    },
    {
      name: 'Mango',
      price: 5
    }
  ]

  getClientToken = async () => {
    try {
      const response = await axios.get(
        '/requestToken'
      );
      const clientToken = response.data.clientToken;
      this.setState({ clientToken });
    } catch (err) {
      console.error(err);
      this.setState({ requestFailed: true });
    } 
  }

  componentDidMount() {
    this.getClientToken();
  }

  reset = async () => {
    this.setState(
      {
        clientToken: null,
        requestFailed: false
      }
    );
    this.getClientToken();
  }

  buy = async () => {
    try {
      const { nonce } = await this.instance.requestPaymentMethod();
      const { totalPrice } = this.state;
      const response = await axios.post(
        '/payment',
        {
          paymentMethodNonce: nonce,
          price: totalPrice
        }
      );
      this.setState({response});
    } catch (err) {
      console.error(err);
      this.setState({ requestFailed: true });
    }
  }

  addToCart = (name,price) => {
    const { fruits } = this.state;
    let { totalPrice } = this.state;
    fruits[name].quantity += 1;
    fruits[name].price += price;
    totalPrice += price;
    this.setState({fruits, totalPrice});
  }

  removeFromCart = (name,price) => {
    const { fruits } = this.state;
    let { totalPrice } = this.state;
    if (fruits[name].quantity){
      fruits[name].quantity -= 1;
      fruits[name].price -= price;
      totalPrice -= price;
      this.setState({fruits, totalPrice});
    }
  }

  renderFruit = (name,price) => {
    return (<div style={{
      display:'flex',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '60%',
      height: '100%',
      paddingBottom: '5px',
      }}>

      <div style={{width: '100px'}}>Name: {name}</div>
      <div style={{width: '100px'}}>Price: {price}{'$ each'}</div>
      
      <button style={{
        width:'30px',
        height:'30px',
        fontSize: '16px',
        borderRadius: '4px'
      }}
      onClick={() => this.addToCart(name,price)}>
      + </button>

      <button style={{
        width:'30px',
        height:'30px',
        fontSize: '16px',
        borderRadius: '4px'
      }}
      onClick={() => this.removeFromCart(name,price)}>
      - </button>
    </div>
    );
  }

  renderCart = () => {
    const {fruits, totalPrice} = this.state;
    const pharoots = Object.entries(fruits);
    const cart =  pharoots.map(([key, value]) => {
      if (value.quantity){
        return(
          <div>
            <div>
              {key} {': '} {value.quantity} {', Price: '}{value.price}
            </div>
          </div>
        );
      }
    });
    return (<div>
      {cart}
      <div>Total Price: {totalPrice}</div>
    </div>);
  }

  render() {
    const responseLoaded = Boolean(Object.keys(this.state.response).length);
    let responseMessage = '';
    if(Object.keys(this.state.response).length){
      responseMessage= `Your purchase has been successful. Charged ${this.state.response.data.transaction.amount}\$`;
    }
    const { clientToken, requestFailed } = this.state;
    if (!clientToken && !requestFailed) {
      return (
        <div>
          <h1>Loading...</h1>
        </div>
      );
    } else if (requestFailed) {
      return (
        <div>
          <button onClick={this.reset}>Request Failed! Reset</button>
        </div>
      );
    } else {
      return (<div style={{
          display:'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          width: '100%',
          height: '100%'
          }}>

        <div style={{
          display:'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          height: '100%'
          }}>

        <h2>Buy Fruits Using Braintree</h2>
          {this.fruits.map(pharoot => {
            return this.renderFruit(pharoot.name,pharoot.price);
          })}

          {this.renderCart()}
        </div>

        <div style={{
          width:'50%'
          }}>

          <BraintreeDropIn
            options={{ authorization: this.state.clientToken }}
            onInstance={instance => (this.instance = instance)} />
        </div>

        <button style={{
          width:'120px',
          height:'30px',
          fontSize: '16px',
          borderRadius: '4px',
          marginTop:'10px'
        }}

        onClick={this.buy}> Purchase </button>

        <div><h3>{responseMessage}</h3></div>
          {responseLoaded && <div>Trancation Id: {this.state.response.data.transaction.id}</div>}
          {responseLoaded && <div>Customer Id: {this.state.response.data.transaction.customer.id}</div>}
          {responseLoaded && <div>Price Charged: {this.state.response.data.transaction.amount}</div>}
        </div>
      );
    }
  }
}
