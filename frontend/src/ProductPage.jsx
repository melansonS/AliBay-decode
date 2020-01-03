import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import AddToCart from "./AddToCart.jsx";
import UpdateItem from "./UpdateItem.jsx";
import { FiStar } from "react-icons/fi";
import "./style/productpage.css";

import { IconContext } from "react-icons";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

class unconnectedProductPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemDetails: [],
      itemRatings: [],
      userRating: undefined,
      showUpdateForm: false
    };
  }
  componentDidMount = () => {
    console.log("did mount, id:", this.props.id);
    this.getItemDetails();
  };

  getItemDetails = async () => {
    let data = new FormData();
    data.append("id", this.props.id);
    let response = await fetch("/product-page", { method: "POST", body: data });
    let body = await response.text();
    body = JSON.parse(body);
    this.setState({ itemDetails: body.item, itemRatings: body.item.ratings });
    console.log("response body, item info:", body);
  };
  handleRatingChange = event => {
    this.setState({ userRating: event.target.value });
  };
  handleRatingSubmit = async event => {
    event.preventDefault();
    if (this.props.user === undefined) {
      console.log("not logged in, can't review");
      this.props.history.push("/dashboard");
      return;
    }
    let rating = this.state.userRating;
    let itemId = this.props.id;
    let userId = this.props.user._id;
    console.log("RATING:", rating, " - ITEM ID:", itemId, " - USERId:", userId);
    let data = new FormData();
    data.append("rating", rating);
    data.append("id", itemId);
    data.append("userId", userId);
    let response = await fetch("/rating", { method: "POST", body: data });
    let body = await response.text();
    body = JSON.parse(body);
    console.log("Rating success:", body);
    this.setState({ itemRatings: body.ratings });
    this.setState({ userRating: undefined });
  };

  handleShowUpdateItem = event => {
    event.preventDefault();
    this.setState({ showUpdateForm: !this.state.showUpdateForm });
  };

  render = () => {
    console.log("itemDetails in the state:", this.state.itemDetails);
    console.log("Item Ratings:", this.state.itemRatings);

    //checks to see whether the item on display is part of the current user's inventory
    //if it is, then display the option to update the item details
    let soldByCurrentMerchant = false;
    if (this.props.user !== undefined) {
      console.log("User's inventory:", this.props.user.inventory);
      if (this.props.user.inventory.includes(this.props.id)) {
        soldByCurrentMerchant = true;
      } else {
        console.log("not my item");
      }
    }
    let tags = [];
    if (this.state.itemDetails.tags !== undefined) {
      tags = this.state.itemDetails.tags.join(" ");
    }
    let images = [];

    if (this.state.itemDetails.posts !== undefined) {
      images = this.state.itemDetails.posts.map((imgPath, index) => {
        let navigation;
        if (this.state.itemDetails.posts.length > 1) {
          navigation = (
            <>
              <a
                class="arrow arrow-prev"
                href={
                  "#target-item-" +
                  (index - 1 > 0
                    ? index - 1
                    : this.state.itemDetails.posts.length)
                }
              >
                <IconContext.Provider value={{ className: "search-icon" }}>
                  <FiChevronLeft />
                </IconContext.Provider>
              </a>
              <a
                class="arrow arrow-next"
                href={
                  "#target-item-" +
                  (index + 1 > this.state.itemDetails.posts.length
                    ? 0
                    : index + 1)
                }
              >
                <IconContext.Provider value={{ className: "search-icon" }}>
                  <FiChevronRight />
                </IconContext.Provider>
              </a>
            </>
          );
        }

        return (
          <>
            <span id={"target-item-" + index}></span>
            <div class={"carousel-item item-" + index}>
              <img class="productpage-image" src={imgPath} />
              {navigation}
            </div>
          </>
        );
      });
    }
    //adds the values of each of the ratings to the 'roundedRating' variable
    let ratings = Object.values(this.state.itemRatings);
    let roundedRating = 0;
    if (ratings.length > 0) {
      ratings.forEach(rating => {
        roundedRating += rating;
      });
      //devides the total of all of the ratings by the number of ratings to get the average value
      roundedRating = Math.round(roundedRating / ratings.length);
    }

    return (
      <section className="product-page">
        <h1>{this.state.itemDetails.productName}</h1>
        <h3>{this.state.itemDetails.descriptionHeader}</h3>
        <div></div>

        <div class="carousel-wrapper">{images}</div>

        <div>{this.state.itemDetails.descriptionText}</div>
        <br></br>
        <div>
          <span className="field-name">Location:</span>
          {this.state.itemDetails.location}
        </div>
        <div>
          <span className="field-name">Price:</span>
          <sup>$</sup>
          {this.state.itemDetails.price}
          <small>CAD</small>
        </div>

        <div>
          <span className="field-name">Rating:</span>
          {roundedRating}
        </div>
        <div>
          <span className="field-name">Number of ratings: </span>
          {ratings.length}
        </div>
        <div>
          <span className="field-name">Category: </span>
          {this.state.itemDetails.category}
        </div>
        <div>
          <span className="field-name"> Tags: </span>
          {tags}
        </div>
        <div>
          <span className="field-name"> Seller: </span>
          <Link to={"/seller/" + this.state.itemDetails.sellerId}>
            {this.state.itemDetails.sellerName}
          </Link>
        </div>
        {/* Rating inputs! */}
        <form onSubmit={this.handleRatingSubmit} className="rating-form">
          <span className="field-name"> Rate this product: </span>

          <input
            id="one-star"
            type="radio"
            name="stars"
            value={1}
            onChange={this.handleRatingChange}
            required
          ></input>
          <label
            for="one-star"
            className={
              this.state.userRating >= 1 ? "rating-star" : "rating-blank"
            }
          >
            <FiStar />
          </label>
          <input
            id="two-star"
            type="radio"
            name="stars"
            value={2}
            onChange={this.handleRatingChange}
          ></input>
          <label
            for="two-star"
            className={
              this.state.userRating >= 2 ? "rating-star" : "rating-blank"
            }
          >
            <FiStar />
          </label>
          <input
            id="three-star"
            type="radio"
            name="stars"
            value={3}
            onChange={this.handleRatingChange}
          ></input>
          <label
            for="three-star"
            className={
              this.state.userRating >= 3 ? "rating-star" : "rating-blank"
            }
          >
            <FiStar />
          </label>
          <input
            id="four-star"
            type="radio"
            name="stars"
            value={4}
            onChange={this.handleRatingChange}
          ></input>
          <label
            for="four-star"
            className={
              this.state.userRating >= 4 ? "rating-star" : "rating-blank"
            }
          >
            <FiStar />
          </label>
          <input
            id="five-star"
            type="radio"
            name="stars"
            value={5}
            onChange={this.handleRatingChange}
          ></input>
          <label
            for="five-star"
            className={
              this.state.userRating >= 5 ? "rating-star" : "rating-blank"
            }
          >
            <FiStar />
          </label>
          <button className="rating-submit">Submit rating!</button>
        </form>

        <AddToCart
          item={this.props.id}
          inventory={this.state.itemDetails.inventory}
        ></AddToCart>
        {soldByCurrentMerchant && (
          <div>
            <button onClick={this.handleShowUpdateItem}>
              <i>UPDATE ITEM</i>
            </button>
          </div>
        )}
        {this.state.showUpdateForm && (
          <UpdateItem item={this.props.id}></UpdateItem>
        )}
      </section>
    );
  };
}

let mapStateToProps = st => {
  return { user: st.user };
};

let ProductPage = connect(mapStateToProps)(withRouter(unconnectedProductPage));

export default ProductPage;
