
import "dotenv/config";
import app from "./index.js";

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`SIDEKICK backend running at http://localhost:${port}`);
});
