const mongoose = require("mongoose");
const Item = require("./models/Items"); // Adjust the path to your model file
const { v4: uuidv4 } = require("uuid");

const updateExistingRows = async () => {
  try {
    await mongoose.connect("mongodb+srv://17prateek12:OIxoUmn0kUjklPOf@cluster0.0ptso.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"); // Replace with your MongoDB connection string

    // Find all items in the collection
    const items = await Item.find();

    for (const item of items) {
      let rowsUpdated = false;

      // Loop through rows and add `id` if it doesn't exist
      item.rows = item.rows.map((row) => {
        if (!row.id) {
          row.id = uuidv4(); // Generate a new UUID for the row
          rowsUpdated = true;
        }
        return row;
      });

      // Save the updated document only if rows were modified
      if (rowsUpdated) {
        await item.save();
        console.log(`Updated item with ID: ${item._id}`);
      }
    }

    console.log("All existing rows updated successfully.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating rows:", error);
    mongoose.connection.close();
  }
};

updateExistingRows();
