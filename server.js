const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite"
];

/* =========================
   TEXT GENERATION
========================= */

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
                error: "Gemini API Key غير موجود على Render"
            });
        }

        for (const model of MODELS) {
            try {
                console.log(`Trying model: ${model}`);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": apiKey
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        {
                                            text: `أنت مساعد تسويق احترافي لمنصة BizAI.

مهمتك إنشاء محتوى احترافي ومفيد بناءً على طلب المستخدم.

اكتب باللغة المطلوبة.
لا تستخدم الإيموجي إلا إذا طلب المستخدم ذلك.
لا تضف شرحاً خارج المحتوى المطلوب.
اجعل النتيجة جاهزة للنسخ والنشر.

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

                if (response.ok) {
                    const text =
                        data?.candidates?.[0]?.content?.parts
                            ?.map(part => part.text || "")
                            .join("")
                            .trim();

                    if (text) {
                        return res.json({
                            result: text
                        });
                    }
                }

                console.error(
                    `Model ${model} failed`,
                    data?.error?.message || ""
                );

            } catch (error) {
                console.error(
                    `Model ${model} error:`,
                    error.message
                );
            }
        }

        return res.status(503).json({
            error: "كل نماذج Gemini مشغولة حالياً. جرّب مرة ثانية."
        });

    } catch (error) {
        console.error("Server Error:", error);

        res.status(500).json({
            error: "حدث خطأ في السيرفر"
        });
    }
});


/* =========================
   IMAGE GENERATION
========================= */

app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                error: "اكتب وصف الصورة أولاً"
            });
        }

        const apiKey = process.env.POLLINATIONS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Pollinations API Key غير موجود على Render"
            });
        }

        const imageUrl =
            `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
            `?model=flux&width=1024&height=1024&nologo=true&key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(imageUrl);

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "Pollinations Error:",
                errorText
            );

            return res.status(response.status).json({
                error: "فشل إنشاء الصورة"
            });
        }

        res.json({
            image: imageUrl
        });

    } catch (error) {
        console.error(
            "Image Server Error:",
            error
        );

        res.status(500).json({
            error: "حدث خطأ أثناء إنشاء الصورة"
        });
    }
});


/* =========================
   SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizAI running on port ${PORT}`);
});
