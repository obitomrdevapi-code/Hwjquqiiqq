import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const router = express.Router();

router.get("/book", async (req, res) => {

  try {

    const { query } = req.query;

    if (!query) {

      return res.status(400).json({

        status: "error",

        message: "يرجى إدخال اسم الكتاب أو الرواية للبحث عنها.",

      });

    }

    const searchUrl = `https://www.alarabimag.com/search/?q=${encodeURIComponent(query)}`;

    const { data } = await axios.get(searchUrl);

    const $ = cheerio.load(data);

    const books = [];

    // استخراج قائمة الكتب من البحث

    const bookElements = $(".hotbooks").slice(0, 10); // تحديد 10 نتائج كحد أقصى

    if (bookElements.length === 0) {

      return res

        .status(404)

        .json({ status: "error", message: "لم يتم العثور على أي نتائج." });

    }

    // البحث عن روابط التنزيل لكل كتاب

    await Promise.all(

      bookElements

        .map(async (_, element) => {

          const title = $(element).find("h2 a").text().trim();

          const url =

            "https://www.alarabimag.com" + $(element).find("h2 a").attr("href");

          const description = $(element).find(".info").text().trim();

          const imageSrc =

            "https://www.alarabimag.com" + $(element).find(".smallimg").attr("src");

          try {

            const { data: bookPage } = await axios.get(url);

            const $$ = cheerio.load(bookPage);

            const downloadLink = $$("#download a").attr("href");

            if (!downloadLink) return;

            const { data: downloadPage } = await axios.get(

              "https://www.alarabimag.com" + downloadLink

            );

            const $$$ = cheerio.load(downloadPage);

            const downloadLinks = $$$("#download a")

              .map((_, el) => "https://www.alarabimag.com" + $$$(el).attr("href"))

              .get();

            const infos = $$$(".rTable .rTableRow")

              .map((_, row) => {

                return {

                  title: $$$(row).find(".rTableHead").text().trim(),

                  value: $$$(row).find(".rTableCell").text().trim(),

                };

              })

              .get();

            books.push({ title, url, description, imageSrc, downloadLinks, infos });

          } catch (err) {

            console.error(`خطأ أثناء جلب تفاصيل الكتاب (${title}):`, err.message);

          }

        })

        .get()

    );

    res.json({

      status: "success",

      count: books.length,

      books,

    });

  } catch (error) {

    res.status(500).json({

      status: "error",

      message: "حدث خطأ أثناء البحث.",

      error: error.message,

    });

  }

});

export default {

  path: "/api/tools",

  name: "Book-Search",

  type: "tools",

  url: `${global.t}/api/tools/book?query=example`,

  logo: "https://files.catbox.moe/wy1k15.jpg",

  router,

};