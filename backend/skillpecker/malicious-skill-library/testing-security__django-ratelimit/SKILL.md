---
name: django-ratelimit
description: >
  Django rate limiting patterns using django-ratelimit with Redis backend for protecting views from abuse and spam.
  Trigger: When implementing rate limiting, spam protection, or throttling in Django views.
license: Apache-2.0
metadata:
  author: Carlos
  version: "1.0"
  scope: [root]
  auto_invoke: "Implementing rate limiting/spam protection"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## What is django-ratelimit?

`django-ratelimit` provides simple, flexible rate limiting for Django views. It's essential for:

- **Spam prevention**: Limit form submissions (surveys, contact forms, registrations)
- **API protection**: Throttle API endpoints to prevent abuse
- **Brute-force mitigation**: Slow down login attempts
- **Resource protection**: Prevent DoS attacks on expensive operations

**Key Benefits:**

- Redis-backed (persistent, distributed)
- Decorator-based (easy to apply)
- Flexible key functions (IP, user, custom)
- Block or track mode
- Compatible with class-based and function-based views

---

## Installation

```bash
pip install django-ratelimit redis
```

```python
# settings.py

# Redis configuration (for rate limiting)
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# django-ratelimit uses Django cache for storage
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
        "KEY_PREFIX": "ratelimit",
        "TIMEOUT": 900,  # 15 minutes default
    }
}
```

**Environment Variables:**

```bash
# .env
REDIS_URL=redis://localhost:6379/0
```

---

## Basic Usage (REQUIRED)

```python
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django_ratelimit.decorators import ratelimit

# Rate limit by IP address
@ratelimit(key='ip', rate='5/m', method='POST', block=False)
def submit_form(request: HttpRequest) -> HttpResponse:
    """Allow 5 POST requests per minute per IP."""
    
    # Check if rate limit was exceeded
    if getattr(request, 'limited', False):
        return render(request, 'rate_limited.html', status=429)
    
    # Normal form processing
    return render(request, 'success.html')
```

**Decorator Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `key` | What to track | `'ip'`, `'user'`, `'user_or_ip'`, function |
| `rate` | Limit format | `'5/m'` (5 per minute), `'100/h'`, `'1000/d'` |
| `method` | HTTP methods | `'POST'`, `'GET'`, `['POST', 'PUT']`, `ALL` |
| `block` | Block requests | `True` (403 error), `False` (set `request.limited`) |

**Rate Format:**

```python
'5/s'   # 5 per second
'10/m'  # 10 per minute
'100/h' # 100 per hour
'1000/d' # 1000 per day
```

---

## Key Functions (REQUIRED)

### Built-in Keys

```python
from django_ratelimit.decorators import ratelimit

# By IP address (most common)
@ratelimit(key='ip', rate='5/m')
def view_by_ip(request):
    pass

# By authenticated user
@ratelimit(key='user', rate='10/m')
def view_by_user(request):
    pass

# By user if authenticated, IP if anonymous
@ratelimit(key='user_or_ip', rate='5/m')
def view_by_user_or_ip(request):
    pass

# By GET/POST parameter
@ratelimit(key='get:q', rate='10/m')  # ?q=search
@ratelimit(key='post:email', rate='3/m')  # form field
def view_by_param(request):
    pass

# By request header
@ratelimit(key='header:x-api-key', rate='100/h')
def api_endpoint(request):
    pass
```

### Custom Key Functions

```python
from typing import Optional

def get_key_ip_and_unit(group: str, request: HttpRequest) -> Optional[str]:
    """
    Custom rate limit key combining IP and unit ID.
    Use case: Limit survey submissions per IP per unit.
    """
    unit_id = request.POST.get('unit_id') or request.GET.get('unit_id')
    
    if not unit_id:
        return None  # No rate limit if no unit
    
    # Get client IP
    ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
    if not ip:
        ip = request.META.get('REMOTE_ADDR', '')
    
    # Return composite key
    return f"{ip}:{unit_id}"

# Apply to view
@ratelimit(key=get_key_ip_and_unit, rate='1/15m', method='POST', block=False)
def submit_survey(request: HttpRequest, transit_number: str) -> HttpResponse:
    """Limit 1 survey submission per IP per unit every 15 minutes."""
    
    if getattr(request, 'limited', False):
        return render(request, 'survey/rate_limited.html', {
            'wait_time': 15,  # minutes
        }, status=429)
    
    # Process survey submission
    # ...
```

---

## Block vs Track Mode

### Block Mode (`block=True`)

```python
# Block immediately with 403 Forbidden
@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def strict_view(request: HttpRequest) -> HttpResponse:
    """User gets 403 error if rate limit exceeded."""
    # No need to check request.limited
    return render(request, 'form.html')
```

**Use when:**
- You want automatic rejection
- Simple protection is enough
- You don't need custom error messages

### Track Mode (`block=False`) - RECOMMENDED

```python
# Track and handle manually
@ratelimit(key='ip', rate='5/m', method='POST', block=False)
def flexible_view(request: HttpRequest) -> HttpResponse:
    """Custom handling of rate limit exceeded."""
    
    if getattr(request, 'limited', False):
        # Custom error page with helpful message
        return render(request, 'rate_limited.html', {
            'wait_time': 1,  # minute
            'retry_after': 60,  # seconds
        }, status=429)
    
    # Normal flow
    return render(request, 'form.html')
```

**Use when:**
- You want custom error messages
- Need to log rate limit events
- Want to show "try again in X minutes"
- Different handling per view

---

## Real-World Patterns

### Survey Submission Protection

```python
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render, get_object_or_404
from django_ratelimit.decorators import ratelimit
from apps.transport.models import Unit

def get_ratelimit_key_ip_and_unit(group: str, request: HttpRequest) -> str:
    """Rate limit key: IP + Unit ID."""
    unit_id = request.resolver_match.kwargs.get('transit_number', '')
    ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
    if not ip:
        ip = request.META.get('REMOTE_ADDR', '')
    return f"{ip}:{unit_id}"

@ratelimit(key=get_ratelimit_key_ip_and_unit, rate='1/15m', method='POST', block=False)
def submit_survey(request: HttpRequest, transit_number: str) -> HttpResponse:
    """
    Submit survey with rate limiting.
    Limit: 1 submission per IP per unit every 15 minutes.
    """
    unit = get_object_or_404(Unit, transit_number=transit_number)
    
    # Check rate limit
    if getattr(request, 'limited', False):
        return render(request, 'interview/rate_limited.html', {
            'unit': unit,
            'wait_minutes': 15,
        }, status=429)
    
    # Process form submission
    if request.method == 'POST':
        form = SurveyForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('survey_thank_you')
    else:
        form = SurveyForm()
    
    return render(request, 'interview/form.html', {
        'form': form,
        'unit': unit,
    })
```

### Login Attempt Protection

```python
@ratelimit(key='ip', rate='5/h', method='POST', block=False)
def login_view(request: HttpRequest) -> HttpResponse:
    """Limit failed login attempts to 5 per hour per IP."""
    
    if getattr(request, 'limited', False):
        return render(request, 'auth/rate_limited.html', {
            'message': 'Too many login attempts. Try again in 1 hour.',
        }, status=429)
    
    # Normal login flow
    # ...
```

### API Endpoint Protection

```python
@ratelimit(key='user_or_ip', rate='100/h', method='ALL', block=False)
def api_endpoint(request: HttpRequest) -> HttpResponse:
    """Limit API calls to 100 per hour per user/IP."""
    
    if getattr(request, 'limited', False):
        return JsonResponse({
            'error': 'Rate limit exceeded',
            'retry_after': 3600,  # seconds
        }, status=429)
    
    # API logic
    # ...
```

---

## Class-Based Views

```python
from django.views.generic import FormView
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=False), name='post')
class ContactFormView(FormView):
    """Rate-limited contact form."""
    template_name = 'contact.html'
    form_class = ContactForm
    
    def post(self, request, *args, **kwargs):
        # Check rate limit
        if getattr(request, 'limited', False):
            return render(request, 'rate_limited.html', status=429)
        
        return super().post(request, *args, **kwargs)
```

---

## Rate Limit Response Template

```html
<!-- templates/rate_limited.html -->
{% extends "base.html" %}

{% block content %}
<div class="error-container">
    <h1>Too Many Requests</h1>
    <p>You've exceeded the rate limit for this action.</p>
    <p>Please wait {{ wait_minutes }} minute(s) before trying again.</p>
    <a href="{% url 'home' %}">Go Home</a>
</div>
{% endblock %}
```

---

## Testing Rate Limits

```python
# tests/test_ratelimit.py
from django.test import TestCase, Client
from django.urls import reverse

class RateLimitTestCase(TestCase):
    def test_survey_rate_limit(self):
        """Test survey submission rate limit."""
        client = Client()
        url = reverse('submit_survey', kwargs={'transit_number': 'ABC123'})
        
        # First submission: OK
        response = client.post(url, {'rating': 5})
        self.assertEqual(response.status_code, 200)
        
        # Second submission immediately: Rate limited
        response = client.post(url, {'rating': 5})
        self.assertEqual(response.status_code, 429)
```

---

## Common Commands

```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Check Redis connection
redis-cli ping  # Should return "PONG"

# View rate limit keys in Redis
redis-cli KEYS "ratelimit:*"

# Clear all rate limits (development only)
redis-cli FLUSHDB

# Clear specific rate limit key
redis-cli DEL "ratelimit:rl:ip:127.0.0.1"
```

---

## Best Practices Checklist

**ALWAYS:**

- ✅ Use Redis backend for persistent, distributed rate limiting
- ✅ Use `block=False` for custom error handling
- ✅ Return HTTP 429 (Too Many Requests) status code
- ✅ Show user-friendly error messages with wait times
- ✅ Use composite keys for complex rate limits (IP + resource)
- ✅ Set reasonable limits (1 per 15 minutes for forms is good)
- ✅ Test rate limits in development
- ✅ Log rate limit events for monitoring
- ✅ Use `user_or_ip` for authenticated + anonymous users
- ✅ Apply rate limits to POST/PUT/DELETE (not GET)

**NEVER:**

- ❌ Use in-memory cache for rate limiting (not persistent)
- ❌ Set limits too low (frustrates legitimate users)
- ❌ Forget to handle `request.limited` when `block=False`
- ❌ Rate limit GET requests (except expensive searches)
- ❌ Use rate limiting as primary spam protection (use reCAPTCHA too)
- ❌ Return 403 for rate limits (use 429)
- ❌ Forget to configure Redis in production

---

## Troubleshooting

### Rate limit not working

```python
# Check Redis connection
from django.core.cache import cache
cache.set('test', 'value', 60)
print(cache.get('test'))  # Should print 'value'

# Check if decorator is applied
# Add logging to view
import logging
logger = logging.getLogger(__name__)

@ratelimit(key='ip', rate='5/m', method='POST', block=False)
def my_view(request):
    logger.info(f"Rate limited: {getattr(request, 'limited', False)}")
    # ...
```

### Custom key function not called

```python
# Make sure key function signature is correct
def get_key(group: str, request: HttpRequest) -> Optional[str]:
    # group is the rate limit group name
    # request is the HttpRequest object
    return "some_key"

# Not this:
def get_key(request):  # ❌ Missing group parameter
    return "some_key"
```

### Rate limit not cleared after expiry

```bash
# Check Redis TTL
redis-cli TTL "ratelimit:rl:ip:127.0.0.1"

# If TTL is -1 (no expiry), key is stuck
# Delete it manually
redis-cli DEL "ratelimit:rl:ip:127.0.0.1"
```

---

## Resources

- **Documentation**: https://django-ratelimit.readthedocs.io/
- **GitHub**: https://github.com/jsocol/django-ratelimit
- **Redis**: https://redis.io/docs/
