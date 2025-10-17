const express = require("express");
const axios = require("axios");

const router = express.Router();


async function searchGitHubRepos(query) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=50`;
  const { data} = await axios.get(url, { timeout: 10000});

  return data.items.map(repo => ({
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    owner: repo.owner.login,
    url: repo.html_url
}));
}


router.get("/github", async (req, res) => {
  const { query} = req.query;
  if (!query) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يرجى إدخال كلمة البحث في المعامل 'query'."
});
}

  try {
    const results = await searchGitHubRepos(query);
    if (!results.length) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: "❌ لم يتم العثور على مستودعات مطابقة."
});
}

    res.json({
      status: 200,
      success: true,
      total: results.length,
      query,
      results
});
} catch (error) {
    console.error("GitHub Search Error:", error.message);
    res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء البحث في GitHub.",
      error: error.message
});
}
});

module.exports = {
  path: "/api/search",
  name: "GitHub Search",
  type: "search",
  url: `${global.t}/api/search/github?query=bot`,
  logo: "https://qu.ax/obitoajajq.png",
  description: "البحث عن مشاريع في جيتهاب",
  router
};