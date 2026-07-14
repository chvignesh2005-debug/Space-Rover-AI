from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_ai_explanation(prediction):
    prompt = f"""
You are an expert NASA Mars Rover AI assistant.

Analyze the following rover prediction carefully.

Prediction:
{prediction}

Generate a professional report using the following format.

1. Overall Rover Status

2. Problem Detected

3. Possible Causes

4. Risk Level (Low, Medium, High, Critical)

5. Recommended Actions

6. Expected Impact on Rover Mission

7. Preventive Maintenance Suggestions

8. Final Conclusion

Explain everything clearly in simple English.
Write around 200-300 words.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": "You are an intelligent NASA rover diagnostic assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content
