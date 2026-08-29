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
                error: "Gemini API Key غير موجود على Render"
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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

مهمتك إنشاء محتوى مفيد واحترافي بناءً على طلب المستخدم.
اكتب باللغة التي يستخدمها المستخدم.
لا تستخدم الإيموجي إلا إذا طلب المستخدم ذلك.
اجعل النتيجة منظمة وسهلة النسخ والاستخدام.

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
            console.error("Gemini API Error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "حدث خطأ أثناء الاتصال بـ Gemini"
            });
        }

        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!text) {
            return res.status(500).json({
                error: "Gemini لم يرجع أي محتوى"
            });
        }

        res.json({
            result: text
        });

    } catch (error) {
        console.error("Server Error:", error);

        res.status(500).json({
            error: "حدث خطأ في السيرفر"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`BizAI running on port ${PORT}`);
});
