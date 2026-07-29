import django_filters as filters
from django.db.models import Q

from .models import Product


class ProductFilter(filters.FilterSet):
    """Powers every control in the catalog's filter rail."""

    category = filters.CharFilter(method="filter_category")
    industry = filters.CharFilter(field_name="industries__slug", lookup_expr="iexact")
    manufacturer = filters.CharFilter(field_name="manufacturer__slug", lookup_expr="iexact")
    grade = filters.MultipleChoiceFilter(choices=Product.Grade.choices)
    availability = filters.MultipleChoiceFilter(choices=Product.Availability.choices)
    cas_number = filters.CharFilter(field_name="cas_number", lookup_expr="icontains")
    package_size = filters.CharFilter(field_name="package_sizes__label", lookup_expr="iexact")
    application = filters.CharFilter(method="filter_application")
    featured = filters.BooleanFilter(field_name="is_featured")
    bestseller = filters.BooleanFilter(field_name="is_bestseller")
    price_min = filters.NumberFilter(field_name="indicative_price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="indicative_price", lookup_expr="lte")
    q = filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = ["category", "industry", "manufacturer", "grade", "availability"]

    def filter_category(self, queryset, name, value):
        """Match the category or any of its children, by slug."""
        return queryset.filter(
            Q(category__slug__iexact=value) | Q(category__parent__slug__iexact=value)
        )

    def filter_application(self, queryset, name, value):
        return queryset.filter(applications__icontains=value)

    def filter_search(self, queryset, name, value):
        value = value.strip()
        if not value:
            return queryset
        return queryset.filter(
            Q(name__icontains=value)
            | Q(sku__icontains=value)
            | Q(synonyms__icontains=value)
            | Q(cas_number__icontains=value)
            | Q(chemical_formula__icontains=value)
            | Q(short_description__icontains=value)
            | Q(category__name__icontains=value)
        ).distinct()
