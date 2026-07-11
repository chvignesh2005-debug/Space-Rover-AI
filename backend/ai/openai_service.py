from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_ai_explanation(prediction):
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": f"Explain this rover prediction in simple words: {prediction}"
            }
        ]
    )

    return response.choices[0].message.content