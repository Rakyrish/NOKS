from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer

from .models import Conversation, Message
from .services import ask

MAX_HISTORY = 12


class AIThrottle(AnonRateThrottle):
    scope = "ai"


@api_view(["POST"])
@throttle_classes([AIThrottle])
def chat(request):
    """Chat turn for the AI Chemical Assistant.

    Body: {"message": str, "session_id": uuid|null, "path": str|null}
    """
    text = (request.data.get("message") or "").strip()
    if not text:
        return Response({"detail": "message is required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(text) > 4000:
        return Response({"detail": "Message too long."}, status=status.HTTP_400_BAD_REQUEST)

    session_id = request.data.get("session_id")
    conversation = None
    if session_id:
        conversation = Conversation.objects.filter(session_id=session_id).first()
    if conversation is None:
        conversation = Conversation.objects.create(
            referrer_path=(request.data.get("path") or "")[:250]
        )

    Message.objects.create(
        conversation=conversation, role=Message.Role.USER, content=text
    )

    history = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages.order_by("-created_at")[:MAX_HISTORY][::-1]
    ]

    result = ask(history, query=text)

    assistant_message = Message.objects.create(
        conversation=conversation,
        role=Message.Role.ASSISTANT,
        content=result["reply"],
    )

    products = Product.objects.published().with_relations().filter(slug__in=result["products"])
    if products:
        assistant_message.referenced_products.set(products)

    return Response(
        {
            "session_id": str(conversation.session_id),
            "reply": result["reply"],
            "configured": result["configured"],
            "products": ProductListSerializer(
                products, many=True, context={"request": request}
            ).data,
        }
    )


@api_view(["POST"])
def capture_lead(request):
    """Attach visitor details captured mid-conversation to the transcript."""
    conversation = Conversation.objects.filter(
        session_id=request.data.get("session_id")
    ).first()
    if not conversation:
        return Response({"detail": "Unknown session."}, status=status.HTTP_404_NOT_FOUND)

    for field in ("visitor_name", "visitor_email", "visitor_phone"):
        value = request.data.get(field)
        if value:
            setattr(conversation, field, str(value)[:140])
    conversation.is_qualified_lead = bool(conversation.visitor_email)
    conversation.save()
    return Response({"detail": "Saved."})


@api_view(["GET"])
def assistant_config(request):
    return Response(
        {
            "enabled": settings.AI_ENABLED,
            "name": settings.AI_ASSISTANT_NAME,
            "greeting": (
                f"Hi! I'm {settings.AI_ASSISTANT_NAME}. Tell me the chemical, "
                "application or industry you're working with and I'll find the right "
                "product and get you a quotation."
            ),
            "suggestions": [
                "What do you recommend for municipal water treatment?",
                "Do you stock food grade citric acid?",
                "I need 500 kg of caustic soda flakes in Nairobi",
                "What's the difference between technical and laboratory grade?",
            ],
        }
    )
