
import { getLatestNews } from "./news.js";

const articles = await getLatestNews();

console.log(`Found ${articles.length} articles`);

for (const article of articles) {
  console.log(`\n${article.title}`);
  console.log(article.url);
  console.log(article.published || "Date unavailable");
}
