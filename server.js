const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                error: "اكتب طلبك أولاً"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Gemini API Key غير موجود على السيرفر"
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            encodeURIComponent(apiKey),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text:
`أنت مساعد تسويق احترافي لمنصة BizAI.
اكتب محتوى واضحاً واحترافياً ومناسباً للجمهور المطلوب.
لا تستخدم الإيموجي إلا إذا طلب المستخدم ذلك.

طلب المستخدم:
${prompt}`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini error:", data);

            return res.status(response.status).json({
                error: data?.error?.message || "حدث خطأ أثناء الاتصال بـ Gemini"
            });
        }

        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!text) {
            return res.status(500).json({
                error: "Gemini لم يرجع نتيجة"
            });
        }

        res.json({
            result: text
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "حدث خطأ في السيرفر"
        });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizAI running on port ${PORT}`);
});
