// Mirrors backend/apps/catalog/models.py Product.Grade / Product.Availability —
// a closed vocabulary the public frontend already renders human labels for
// (grade_display / availability_display), so keep these two lists in sync
// with the model's TextChoices if either ever changes.
export const GRADE_CHOICES = [
  { value: "industrial", label: "Industrial grade" },
  { value: "technical", label: "Technical grade" },
  { value: "laboratory", label: "Laboratory / analytical grade" },
  { value: "food", label: "Food grade" },
  { value: "pharma", label: "Pharmaceutical grade" },
];

export const AVAILABILITY_CHOICES = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "made_to_order", label: "Made to order" },
  { value: "out_of_stock", label: "Out of stock" },
];
