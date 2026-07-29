from rest_framework import serializers

from .models import (
    FAQ,
    Certification,
    ClientLogo,
    Milestone,
    ProcessStep,
    Service,
    Stat,
    TeamMember,
    Testimonial,
    ValueProp,
)


class StatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stat
        fields = ["id", "label", "value", "suffix", "icon", "order"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id", "name", "slug", "summary", "description",
            "icon", "image", "highlights", "order",
        ]


class ValuePropSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValueProp
        fields = ["id", "title", "description", "icon", "order"]


class ProcessStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessStep
        fields = ["id", "title", "description", "icon", "duration", "order"]


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "year", "title", "description", "order"]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            "id", "author", "role", "company", "quote",
            "rating", "avatar", "logo", "source", "order",
        ]


class ClientLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientLogo
        fields = ["id", "name", "logo", "website", "order"]


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ["id", "question", "answer", "category", "page", "order"]


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ["id", "name", "issuer", "description", "badge", "order"]


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ["id", "name", "role", "bio", "photo", "linkedin", "order"]
