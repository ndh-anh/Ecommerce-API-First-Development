from langchain_openai import ChatOpenAI
from app.config import settings

def get_llm_with_fallbacks(api_key: str, model: str = None, tools: list = None, **kwargs):
    model = model or settings.DEFAULT_MODEL
    
    # Extract kwargs or defaults
    temperature = kwargs.get("temperature", settings.TEMPERATURE)
    base_url = kwargs.get("base_url", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
    
    primary_llm = ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=api_key,
        base_url=base_url,
    )
    
    # Danh sách model dự phòng (tự động chuyển sang khi model chính lỗi 403 / Hết Quota)
    fallback_models = ["qwen-turbo", "qwen-max"]
    fallback_models = [m for m in fallback_models if m != model]
    
    fallbacks = [
        ChatOpenAI(
            model=m,
            temperature=temperature,
            api_key=api_key,
            base_url=base_url,
        )
        for m in fallback_models
    ]
    
    if tools:
        primary_llm = primary_llm.bind_tools(tools)
        fallbacks = [f.bind_tools(tools) for f in fallbacks]
        
    structured_output = kwargs.get("structured_output")
    if structured_output:
        primary_llm = primary_llm.with_structured_output(structured_output)
        fallbacks = [f.with_structured_output(structured_output) for f in fallbacks]
        
    return primary_llm.with_fallbacks(fallbacks)

