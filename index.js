const express = require("express");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World ----- * ------");
});

app.get("/about", (req, res) => {
  res.json({
    message: "This is About Page",
  });
});


const prop = {
    app :app
}


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
