from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .metrics import dashboard_metrics


@api_view(["GET"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAdminUser])
def dashboard(request):
    metrics = dashboard_metrics()
    metrics["recent_quotes"] = [
        {
            "id": q.id,
            "reference": q.reference,
            "full_name": q.full_name,
            "company": q.company,
            "status": q.status,
            "created_at": q.created_at,
        }
        for q in metrics["recent_quotes"]
    ]
    metrics["top_products"] = [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "quote_count": p.quote_count,
            "view_count": p.view_count,
        }
        for p in metrics["top_products"]
    ]
    return Response(metrics)
