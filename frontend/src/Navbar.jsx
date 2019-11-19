import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { IconContext } from "react-icons";
import { FiSearch, FiShoppingBag } from "react-icons/fi";

class UnconnecterNavbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      search: ""
    };
  }
  handleSearchChange = event => {
    console.log(event.target.value);
    this.setState({ search: event.target.value });
  };
  logOut = () => {
    this.props.dispatch({ type: "logout-success" });
  };

  render = () => {
    return (
      <nav class="flex-container flex-center-v flex-end-h">
        <div class="cart flex-container flex-center-h flex-center-v">
          <Link to="/cart">
            <IconContext.Provider value={{ className: "cart-icon" }}>
              <FiShoppingBag />
            </IconContext.Provider>
          </Link>
        </div>

        <div>
          <form>
            <input
              class="search-input ellipsis"
              type="text"
              placeholder="search"
              onChange={this.handleSearchChange}
            ></input>
            <button onClick="submit" class="search-button">
              <IconContext.Provider value={{ className: "search-icon" }}>
                <FiSearch />
              </IconContext.Provider>
            </button>
          </form>
        </div>

        {!this.props.isLoggedIn && (
          /*Link to the Login and Signup components */
          <div>
            <button>
              <Link to="/login">Log-in</Link>
            </button>
          </div>
        )}

        {this.props
          .isLoggedIn /*Will display the name of the current user and will link to that user's profile aswell as a log out button if the user is logged in*/ && (
          <div>
            <h3>{this.props.user}</h3>
            <button onClick={this.logOut}>log-out</button>
          </div>
        )}
      </nav>
    );
  };
}

let mapStateToProps = st => {
  return { isLoggedIn: st.loggedIn, user: st.username };
};

let Navbar = connect(mapStateToProps)(UnconnecterNavbar);

export default Navbar;