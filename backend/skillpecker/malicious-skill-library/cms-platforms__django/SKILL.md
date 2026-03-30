---
name: django
description: >
  Django modern patterns and best practices for views, forms, URL routing, and management commands.
  Trigger: When implementing or refactoring Django views, forms, URLs, or commands.
license: Apache-2.0
metadata:
  author: Carlos
  version: "1.1"
  scope: [root]
  auto_invoke:
    - "Writing Django views/forms/URLs"
    - "Implementing survey form views"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## ⚠️ CRITICAL: Class-Based Views ONLY

**This project uses EXCLUSIVELY Class-Based Views (CBV). Function-Based Views (FBV) are PROHIBITED.**

**Why?** Better reusability, built-in mixins (permissions, login), cleaner GET/POST separation, easier to extend.

## Django Forms with Type Hints

```python
from django import forms
from django.core.exceptions import ValidationError
from typing import Any

class UserForm(forms.ModelForm):
    """Type-safe ModelForm with validation."""
    
    class Meta:
        model = User
        fields = ["name", "email", "status"]
        widgets = {"email": forms.EmailInput(attrs={"class": "form-control"})}
        labels = {"name": "Full Name"}
        help_texts = {"email": "We'll never share your email."}
    
    def clean_email(self) -> str:
        """Validate unique email."""
        email = self.cleaned_data.get("email", "")
        qs = User.objects.filter(email=email)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise ValidationError("Email already exists")
        return email.lower()
    
    def clean(self) -> dict[str, Any]:
        """Cross-field validation."""
        cleaned_data = super().clean()
        # Add cross-field validation logic here
        return cleaned_data
```

**Common field types:** `CharField`, `IntegerField`, `ChoiceField`, `MultipleChoiceField`, `BooleanField`, `DateField`, `FileField`, `EmailField`

## Class-Based Views (CBV)

```python
from django.views.generic import ListView, CreateView, UpdateView, DetailView, TemplateView, FormView
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from typing import Any

# TemplateView - Static/simple pages
class HomeView(TemplateView):
    template_name = "home.html"
    
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["total_users"] = User.objects.count()
        return context

# ListView - Display list of objects
class UserListView(ListView):
    model = User
    template_name = "users/list.html"
    context_object_name = "users"
    paginate_by = 20
    
    def get_queryset(self):
        return User.objects.filter(status="active")

# DetailView - Display single object
class UserDetailView(DetailView):
    model = User
    template_name = "users/detail.html"
    context_object_name = "user"
    pk_url_kwarg = "user_id"

# CreateView - Create new object
class UserCreateView(CreateView):
    model = User
    form_class = UserForm
    template_name = "users/create.html"
    success_url = reverse_lazy("user_list")
    
    def form_valid(self, form):
        messages.success(self.request, f"User {form.instance.name} created!")
        return super().form_valid(form)

# UpdateView - Update existing object
class UserUpdateView(UpdateView):
    model = User
    form_class = UserForm
    template_name = "users/update.html"
    pk_url_kwarg = "user_id"
    
    def form_valid(self, form):
        messages.success(self.request, "User updated!")
        return super().form_valid(form)
    
    def get_success_url(self):
        return reverse_lazy("user_detail", kwargs={"user_id": self.object.pk})

# FormView - Form without model
class ContactFormView(FormView):
    template_name = "contact.html"
    form_class = ContactForm
    success_url = reverse_lazy("home")
    
    def form_valid(self, form):
        form.send_email()
        messages.success(self.request, "Message sent!")
        return super().form_valid(form)

# Protected view with permissions
class DashboardView(LoginRequiredMixin, PermissionRequiredMixin, TemplateView):
    template_name = "dashboard.html"
    permission_required = "app.can_view_dashboard"
    login_url = "/login/"
    
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["organization"] = self.request.tenant  # Multi-tenant access
        return context
```

**Key Methods to Override:**
- `get_context_data()` - Add extra context
- `get_queryset()` - Filter queryset
- `form_valid()` - Handle valid form submission
- `form_invalid()` - Handle invalid form submission
- `get_success_url()` - Dynamic success URL
- `dispatch()` - Pre-process request

## URL Configuration

```python
# users/urls.py
from django.urls import path
from . import views

app_name = "users"  # Enable namespacing

urlpatterns = [
    path("", views.UserListView.as_view(), name="user_list"),
    path("<int:user_id>/", views.UserDetailView.as_view(), name="user_detail"),
    path("create/", views.UserCreateView.as_view(), name="user_create"),
    path("<int:user_id>/update/", views.UserUpdateView.as_view(), name="user_update"),
]

# Reverse URLs
success_url = reverse_lazy("users:user_detail", kwargs={"user_id": 123})
# Template: {% url 'users:user_detail' user_id=123 %}
```

## Multi-Tenancy with django-tenants

```python
# settings.py
TENANT_MODEL = "organization.Organization"
TENANT_DOMAIN_MODEL = "organization.Domain"
PUBLIC_SCHEMA_URLCONF = "buzon_quejas.urls_public"  # Public URLs
ROOT_URLCONF = "buzon_quejas.urls_tenant"  # Tenant URLs

# urls_public.py - No tenant required
urlpatterns = [
    path("", views.LandingView.as_view(), name="landing"),
    path("login/", views.LoginView.as_view(), name="login"),
]

# urls_tenant.py - Tenant context required
urlpatterns = [
    path("", views.DashboardView.as_view(), name="dashboard"),
    path("users/", include("apps.users.urls")),
]

# Tenant-aware view
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"
    
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        tenant = self.request.tenant  # Access current tenant
        context["tenant_name"] = tenant.name
        return context
```

## Management Commands

```python
# app/management/commands/command_name.py
from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import schema_context
from typing import Any

class Command(BaseCommand):
    help = "Command description"
    
    def add_arguments(self, parser) -> None:
        parser.add_argument("count", type=int, help="Number to process")
        parser.add_argument("--schema", type=str, help="Tenant schema")
    
    def handle(self, *args: Any, **options: Any) -> None:
        count = options["count"]
        schema = options.get("schema")
        
        # Tenant-specific operation
        if schema:
            with schema_context(schema):
                self._process(count)
        else:
            self._process(count)
    
    def _process(self, count: int) -> None:
        try:
            # Your logic here
            self.stdout.write(self.style.SUCCESS(f"Processed {count} items"))
        except Exception as e:
            raise CommandError(f"Error: {e}")

# Usage: python manage.py command_name 10 --schema=tenant1
```

## Project-Specific: Survey Form Pattern

**URL Structure:**
- `/survey/` - Unit selector (auto-redirect if only 1 unit)
- `/survey/<transit_number>/` - Survey form for specific unit
- `/survey/<transit_number>/submit/` - Submit survey
- `/survey/thank-you/` - Thank you page

```python
# apps/interview/views.py
class SelectUnitForSurveyView(TemplateView):
    """Auto-redirect if 1 unit, show selector if multiple."""
    template_name = "interview/select_unit.html"
    
    def get(self, request, *args, **kwargs):
        units = Unit.objects.all()
        if units.count() == 0:
            self.template_name = "interview/no_units.html"
        elif units.count() == 1:
            return redirect("interview:survey_form", transit_number=units.first().transit_number)
        return super().get(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        context["units"] = Unit.objects.all()
        return context

class SurveyFormView(TemplateView):
    """Display survey form for specific unit."""
    template_name = "interview/form_section.html"
    
    def get_context_data(self, transit_number: str, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        unit = get_object_or_404(Unit, transit_number=transit_number)
        context.update({
            "unit": unit,
            "questions": Question.objects.filter(is_active=True).order_by("order"),
        })
        return context

class SubmitSurveyView(FormView):
    """Process survey submission with rate limiting."""
    form_class = SurveyForm
    template_name = "interview/form_section.html"
    
    def dispatch(self, request, *args, **kwargs):
        if request.method != "POST":
            return redirect("interview:survey_form", transit_number=kwargs["transit_number"])
        return super().dispatch(request, *args, **kwargs)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["unit"] = get_object_or_404(Unit, transit_number=self.kwargs["transit_number"])
        return kwargs
    
    def form_valid(self, form):
        form.save()
        messages.success(self.request, "¡Gracias! Tu encuesta ha sido enviada.")
        return redirect("interview:survey_thank_you")
    
    def form_invalid(self, form):
        messages.error(self.request, "Por favor corrige los errores.")
        return super().form_invalid(form)

# apps/interview/urls.py
app_name = "interview"
urlpatterns = [
    path("survey/", views.SelectUnitForSurveyView.as_view(), name="select_unit_for_survey"),
    path("survey/<str:transit_number>/", views.SurveyFormView.as_view(), name="survey_form"),
    path("survey/<str:transit_number>/submit/", views.SubmitSurveyView.as_view(), name="submit_survey"),
    path("survey/thank-you/", views.SurveyThankYouView.as_view(), name="survey_thank_you"),
]
```

## Admin Customization (django-jazzmin)

```python
# settings.py
INSTALLED_APPS = [
    "jazzmin",  # MUST be before django.contrib.admin
    "django.contrib.admin",
    # ...
]

JAZZMIN_SETTINGS = {
    "site_title": "Admin Panel",
    "site_header": "Tu Voz en Ruta",
    "site_logo": "images/logo.png",
    "icons": {
        "auth.user": "fas fa-user",
        "transport.Unit": "fas fa-bus",
    },
    "theme": "flatly",
}

# Custom Tenant Admin
from django.contrib.admin import AdminSite

class TenantAdminSite(AdminSite):
    site_header = "Panel de Administración"
    site_title = "Admin"

tenant_admin_site = TenantAdminSite(name="tenant_admin")

@admin.register(Unit, site=tenant_admin_site)
class UnitAdmin(admin.ModelAdmin):
    list_display = ["transit_number", "route", "is_active"]
    list_filter = ["is_active", "route"]
    search_fields = ["transit_number"]
```

## Best Practices Checklist

**ALWAYS:**
- ✅ **Use Class-Based Views (CBV) - MANDATORY**
- ✅ Type hints on all views and forms
- ✅ Use `get_object_or_404` instead of try/except
- ✅ Use `reverse_lazy` in CBV (not `reverse`)
- ✅ Add `app_name` in urls.py for namespacing
- ✅ Use Django messages framework for feedback
- ✅ Validate data in forms, not views
- ✅ Separate public and tenant URLs
- ✅ Access tenant via `request.tenant`
- ✅ Use mixins: `LoginRequiredMixin`, `PermissionRequiredMixin`

**NEVER:**
- ❌ **Use Function-Based Views (FBV) - PROHIBITED**
- ❌ Hard-code URLs (use `reverse_lazy()`)
- ❌ Put business logic in views (use models/managers/services)
- ❌ Skip form validation
- ❌ Mix public and tenant logic
- ❌ Use `reverse()` in class attributes (use `reverse_lazy()`)
