const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const TEXT_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite"
];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


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

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API Key غير موجود على Render"
            });
        }

        for (const model of TEXT_MODELS) {
            try {
                console.log(`Trying text model: ${model}`);

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": GEMINI_API_KEY
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        {
                                            text: `أنت مساعد تسويق احترافي لمنصة BizAI.

أنشئ محتوى احترافي ومفيد بناءً على طلب المستخدم.

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
                    `Text model ${model} failed:`,
                    data?.error?.message || "Unknown error"
                );

            } catch (error) {
                console.error(
                    `Text model ${model} error:`,
                    error.message
                );
            }
        }

        return res.status(503).json({
            error: "كل نماذج Gemini مشغولة حالياً. جرّب مرة ثانية."
        });

    } catch (error) {
        console.error("Text server error:", error);

        return res.status(500).json({
            error: "حدث خطأ في السيرفر"
        });
    }
});


/* =========================
   NANO BANANA 2 IMAGE
========================= */

app.post("/api/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                error: "اكتب وصف الصورة أولاً"
            });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API Key غير موجود على Render"
            });
        }

        console.log("Generating image with Nano Banana 2...");

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                body: JSON.stringify({
                    model: "gemini-3.1-flash-image",
                    input: prompt,
                    response_format: {
                        type: "image",
                        aspect_ratio: "1:1",
                        image_size: "2K"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Nano Banana error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "فشل إنشاء الصورة"
            });
        }

        const image =
            data?.output_image?.data;

        if (!image) {
            console.error(
                "No image returned:",
                JSON.stringify(data).slice(0, 3000)
            );

            return res.status(500).json({
                error: "Gemini لم يرجع صورة"
            });
        }

        res.json({
            image: `data:image/jpeg;base64,${image}`
        });

    } catch (error) {
        console.error(
            "Image server error:",
            error
        );

        res.status(500).json({
            error:
                "حدث خطأ أثناء إنشاء الصورة: " +
                error.message
        });
    }
});


/* =========================
   SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizAI running on port ${PORT}`);
});
