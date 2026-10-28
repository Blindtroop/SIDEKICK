
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
});

const feeds = [
  "https://feeds.bbci.co.uk/news/technology/rss.xml",
  "https://techcrunch.com/feed/",
  "https://www.theverge.com/rss/index.xml",
];

export async function getLatestNews() {
  const results = await Promise.allSettled(
    feeds.map((url) => parser.parseURL(url))
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.items)
    .filter((item) => item.title && item.link)
    .slice(0, 15)
    .map((item) => ({
      title: item.title,
      url: item.link,
      published: item.isoDate || item.pubDate || null,
      summary: (item.contentSnippet || item.content || "").slice(0, 500),
    }));
}
