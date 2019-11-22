import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Inventory from "./Inventory";
import SalesRecord from "./SalesRecord";
import Graph from "./Graph";

class UnconnectedMerchantDashboard extends Component {
  render = () => {
    return (
      <div>
        <div>
          <Graph />
        </div>
        merchant dash <Link to="/productform">add product</Link>
        <div>
          Inventory:
          <Inventory />
        </div>
        <div>
          Sales history:
          <SalesRecord />
        </div>
      </div>
    );
  };
}

let MerchantDashboard = connect()(UnconnectedMerchantDashboard);

export default MerchantDashboard;
