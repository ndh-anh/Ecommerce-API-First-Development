import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DASHSCOPE_API_KEY_AGENT_1 = os.getenv("DASHSCOPE_API_KEY_AGENT_1", "")
    DASHSCOPE_API_KEY_AGENT_2 = os.getenv("DASHSCOPE_API_KEY_AGENT_2", "")
    DEFAULT_MODEL = "qwen-plus"
    TEMPERATURE = 0.0
    DB_URI = os.getenv("DB_URI", "")

settings = Settings()