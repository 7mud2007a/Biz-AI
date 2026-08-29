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

        let lastError = null;

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

                        console.log(`Success with model: ${model}`);

                        return res.json({
                            result: text
                        });

                    }

                    lastError = "Gemini لم يرجع أي محتوى";

                } else {

                    lastError =
                        data?.error?.message ||
                        `Model ${model} failed`;

                    console.error(
                        `Model ${model} failed:`,
                        lastError
                    );

                }

            } catch (error) {

                lastError = error.message;

                console.error(
                    `Model ${model} error:`,
                    error.message
                );

            }
        }

        return res.status(503).json({
            error:
                "كل نماذج Gemini مشغولة حالياً. جرّب مرة ثانية بعد قليل."
        });

    } catch (error) {

        console.error("Server Error:", error);

        return res.status(500).json({
            error: "حدث خطأ في السيرفر"
        });

    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizAI running on port ${PORT}`);
});
