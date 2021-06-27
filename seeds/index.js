const mongoose = require("mongoose");
const cities = require("./cities");
const Campground = require("../models/campground");
const { places, descriptors } = require("./seedHelpers");

// || "mongodb://localhost:27017/yelp-camp"
const dbUrl = process.env.DB_URL;
mongoose.connect(
  "mongodb+srv://admin:OFP1gG4CYrh5D8jh@cluster0.4ispe.mongodb.net/yelp-camp?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: "60d48b0284976f18cc47987a",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos vero magnam aperiam laborum mollitia quas dicta soluta totam maiores, sunt eligendi maxime natus modi hic! Vitae nostrum sit optio officia!",
      price,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://source.unsplash.com/collection/483251",
          filename: "YelpCamp/mxrqs9gljrbzvs9v9kfl",
        },
        {
          url: "https://source.unsplash.com/collection/483253",
          filename: "YelpCamp/rtchj4f081d9nqssiqck",
        },
      ],
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
