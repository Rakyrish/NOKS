"""Conversation log for the AI Chemical Assistant (lead qualification trail)."""

import uuid

from django.db import models

from apps.core.models import TimeStampedModel


class Conversation(TimeStampedModel):
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    visitor_name = models.CharField(max_length=140, blank=True)
    visitor_email = models.EmailField(blank=True)
    visitor_phone = models.CharField(max_length=40, blank=True)
    is_qualified_lead = models.BooleanField(default=False, db_index=True)
    summary = models.TextField(blank=True)
    referrer_path = models.CharField(max_length=250, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.visitor_email or 'Anonymous'} — {self.session_id.hex[:8]}"


class Message(TimeStampedModel):
    class Role(models.TextChoices):
        USER = "user", "Visitor"
        ASSISTANT = "assistant", "Assistant"

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    referenced_products = models.ManyToManyField("catalog.Product", blank=True)

    class Meta:
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"{self.role}: {self.content[:60]}"
