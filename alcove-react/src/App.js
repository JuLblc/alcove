import React, { Component } from 'react';
import './App.css';

import { Switch, Route } from 'react-router-dom';

import Signup from './components/auth/Signup';
import authService from './components/auth/auth-service.js';
import Login from './components/auth/Login';
import Profile from './components/auth/Profile';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import CreateProduct from './components/products/CreateProduct';
import EditProduct from './components/products/EditProduct';
import DetailsProduct from './components/products/DetailsProduct';

class App extends Component {

  state = {
    user: {}
  }

  //////////////////////////LOGGEDIN/////////////////////////////
  fetchUser = () => {
    if (!this.state.user._id) {
      authService.loggedin()
        .then(data => this.setState({ user: data.user }))
        .catch(err => this.setState({ user: false }))
        ;
    } else {
      console.log('user already in the state')
    }
  };

  updateUser = (data) => {
    this.setState({ user: data.user });
  };

  componentDidMount() {
    this.fetchUser();
  }

  render() {
    return (
      <div className='App'>
        <Navbar />
        <Switch>
          {/////////////////////* HOMEPAGE *////////////////////////
          }
          <Route exact path="/" render={() => (
            <Homepage user={this.state.user} />
          )} />

          {/////////////////////* SIGNUP *////////////////////////
          }
          <Route exact path="/signup" render={() => (
            <Signup />
          )} />


          {/////////////////////* LOGIN *////////////////////////
          }
          <Route exact path="/login" render={(props) => (
            <Login updateUser={this.updateUser} />
          )} />

          {/////////////////////*PROFIL *////////////////////////
          }
          <Route exact path="/profile" render={(props) => (
            <Profile user={this.state.user} updateUser={this.updateUser} />
          )} />

          {/////////////////////*PRODUCTS *////////////////////////
          }
          <Route exact path="/new-product" render={(props) => (
            <CreateProduct user={this.state.user} />
          )} />

          <Route exact path="/edit-product/:id" render={(props) => (
            <EditProduct {...props} user={this.state.user} />
          )} />

          <Route exact path="/details-product/:id" render={(props) => (
            <DetailsProduct {...props} user={this.state.user} />
          )} />

        </Switch>

      </div>
    )
  }


}

export default App;

