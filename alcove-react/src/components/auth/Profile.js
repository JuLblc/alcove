import React from 'react';
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

import authService from './auth-service.js';
import { Redirect } from 'react-router-dom';
import Order from '../orders/Order.js';


// eslint-disable-next-line import/no-anonymous-default-export
class Profile extends React.Component {
  state = {
    firstName: this.props.user.firstName || "",
    lastName: this.props.user.lastName || "",
    email: this.props.user.email || "",
    telephone: this.props.user.telephone || "",
    // civility: this.props.user.civility || "",
    street: this.props.user.street || "",
    supp: this.props.user.supp || "",
    zip: this.props.user.zip || "",
    city: this.props.user.city || "",
    userNumber: this.props.user.userNumber || "",

    currentPassword: '',
    newPassword: '',

    error: ''
  }

  componentDidUpdate(prevProps, prevState) {
    // executée qd n'importe quelle props + nimporte quel state change !!

    if (this.props.user !== prevProps.user) {
      // la props user vient de changer
      this.setState({
        email: this.props.user.email || "",
        firstName: this.props.user.firstName || "",
        lastName: this.props.user.lastName || "",
        telephone: this.props.user.telephone || "",
        // civility: this.props.user.civility || "",
        street: this.props.user.street || "",
        supp: this.props.user.supp || "",
        zip: this.props.user.zip || "",
        city: this.props.user.city || "",
      })
    }
  }

  handleChange = (event) => {
    let regEx = /^[0-9]*$/; //autorise chiffre de 0 à 9 + RAZ
    const { name, value } = event.target;

    if (name !== 'zip') {
      this.setState({ [name]: value });
      return;
    }

    if ((name === 'zip') && (regEx.test(event.target.value) && value.length < 6)) {
      this.setState({ [name]: value });
      return;
    }
  }

  logout = (event) => {
    authService.logout()
      .then(() => {
        this.props.updateUser(false);
      });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    /////////////////EDIT/////////////
    authService.edit(this.state)
      .then(response => {
        this.setState({ error: "" });
        this.props.updateUser(this.state)
      })
      .catch(err => this.setState({ error: err.response.data.message }))
  }

  handleSubmitUpdatePassword = (event) => {
    event.preventDefault();
    authService.updatePassword(this.state.currentPassword, this.state.newPassword)
      .then(() => {
        this.setState({
          error: 'Mot de passe modifié avec succès', //Nom de variable à modifier
          currentPassword: '',
          newPassword: ''
        });
      })
      .catch(err => this.setState({ error: err.response.data.message }))
  }

  deleteAccount = (event) => {
    authService.deleteAccount()
      .then(() => {
        this.props.updateUser(false);
      });
  }

  render() {
    console.log('props profile:', this.props)
    if (this.props.user === false) return <Redirect to="/login" />

    return (
      <div>
        <h1>Bonjour {this.props.user.firstName}</h1>
        <button className="btn logout" onClick={(e) => this.logout(e)}>Logout</button>
        <Order />
        <div className='infoUser'>
          <h2>Mes informations personnelles</h2>
          <form onSubmit={this.handleSubmit}>
            {/* <p>
              <label>
                <em>Civilité</em>
                <input type="text" name="civility" value={this.state.civility} onChange={this.handleChange} />
              </label>
            </p> */}
            <p>
              <label>
                <em>Prénom</em>
                <input type="text" name="firstName" value={this.state.firstName} onChange={this.handleChange} />
              </label>
            </p>
            <p>
              <label>
                <em>Nom</em>
                <input type="text" name="lastName" value={this.state.lastName} onChange={this.handleChange} />
              </label>
            </p>
            <p>
              <label>
                <em>Email</em>
                <input type="email" name="email" value={this.state.email} onChange={this.handleChange} />
              </label>
            </p>
            {/* <p>
              <label>
                <em>Téléphone</em>
                <input type="tel" name="telephone" value={this.state.telephone} onChange={this.handleChange} />
              </label>
            </p> */}

            <PhoneInput
              country={'fr'}
              onlyCountries={['fr']}
              value={this.state.telephone}
              onChange={telephone => this.setState({ telephone })}
              placeholder="+33 6 12 34 56 78"
            />

            <p>
              <label>
                <em>Adresse</em>
                <input type="text" name="street" value={this.state.street} onChange={this.handleChange} />
              </label>
            </p>
            <p>
              <label>
                <em>Complément d'adresse</em>
                <input type="text" name="supp" value={this.state.supp} onChange={this.handleChange} />
              </label>
            </p>
            <p>
              <label>
                <em>Code postal</em>
                <input type="text" name="zip" value={this.state.zip} onChange={this.handleChange} />
              </label>
            </p>
            <p>
              <label>
                <em>Ville</em>
                <input type="text" name="city" value={this.state.city} onChange={this.handleChange} />
              </label>
            </p>
            <button className="btn">Editer mes infos perso</button>
          </form>

          <h2>Modifier mon mot de passe</h2>
          <form onSubmit={this.handleSubmitUpdatePassword} className='signup'>
            <label>Mot de passe actuel:
              <input type='password' name="currentPassword" value={this.state.currentPassword} onChange={e => this.handleChange(e)} />
            </label>

            <label>Nouveau mot de passe:
              <input type='password' name="newPassword" value={this.state.newPassword} onChange={e => this.handleChange(e)} />
            </label>

            <button className="btn">Modifier mon mot de passe</button>
          </form>

          {this.state.error && (
            <p className="error">{this.state.error}</p>
          )}

          <button className="btn" onClick={e => this.deleteAccount(e)}>Supprimer mon compte</button>

        </div>
      </div>
    )
  }
}

export default Profile;
