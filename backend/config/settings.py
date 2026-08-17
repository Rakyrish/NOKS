"""
NOKS — Chemical Division · Django settings.

Every value here is sourced from the single root-level `.env` file
(`<repo>/.env`) that the Next.js frontend also reads. Nothing is hardcoded.
"""

import sys
from pathlib import Path

import environ
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# The one and only source of truth, at the root of the fullstack.
# python-dotenv (not environ.Env.read_env) because django-environ strips
# everything after a '#', which would blank out hex colours like "#0C48E6".
load_dotenv(ROOT_DIR / ".env")

# django-environ still provides the typed accessors, reading from os.environ.
env = environ.Env()

# ─────────────────────────────── CORE ─────────────────────────────
SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ENVIRONMENT = env("DJANGO_ENV", default="production")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

SITE_URL = env("SITE_URL", default="http://localhost:3000")
API_URL = env("API_URL", default="http://localhost:8000")

# Cloudinary-backed storage for image fields only — see STORAGES below.
# Document/library FileFields (ProductDocument.file, MediaAsset.file) stay on
# local storage regardless of this flag.
USE_CLOUDINARY = env.bool("USE_CLOUDINARY", default=False)

INSTALLED_APPS = [
    "apps.core.apps.CoreConfig",
    "apps.core.admin_site.NoksAdminConfig",  # branded AdminSite + dashboard
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    # cloudinary_storage must be listed before staticfiles.
    *(["cloudinary_storage"] if USE_CLOUDINARY else []),
    "django.contrib.staticfiles",
    *(["cloudinary"] if USE_CLOUDINARY else []),
    "django.contrib.sitemaps",
    "django.contrib.humanize",
    # Third party
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",
    "import_export",
    "taggit",
    "drf_spectacular",
    # Local
    "apps.catalog",
    "apps.blog",
    "apps.leads",
    "apps.assistant",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "apps.core.context_processors.brand",
            ],
        },
    },
]

# ─────────────────────────────── DATABASE ─────────────────────────
# Postgres when DATABASE_URL is set, otherwise a zero-config SQLite file.
_database_url = env("DATABASE_URL", default="")
if _database_url:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.parse(
            _database_url, conn_max_age=600, conn_health_checks=True
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─────────────────────────────── CACHE ────────────────────────────
_redis_url = env("REDIS_URL", default="")
if _redis_url:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": _redis_url,
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }
else:
    CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }

# ─────────────────────────────── CELERY ───────────────────────────
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=_redis_url or "memory://")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default=_redis_url or "cache+memory://")
# Run inline when there is no broker, and always inline under test so the
# suite never depends on a running worker.
TESTING = "test" in sys.argv
CELERY_TASK_ALWAYS_EAGER = TESTING or not bool(_redis_url)
CELERY_TASK_EAGER_PROPAGATES = TESTING
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = env("DJANGO_TIME_ZONE", default="Africa/Nairobi")

# ─────────────────────────────── AUTH ─────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─────────────────────────────── I18N ─────────────────────────────
LANGUAGE_CODE = env("DJANGO_LANGUAGE_CODE", default="en-us")
TIME_ZONE = env("DJANGO_TIME_ZONE", default="Africa/Nairobi")
USE_I18N = True
USE_TZ = True

# ─────────────────────────────── STATIC / MEDIA ───────────────────
STATIC_URL = "/django-static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Read lazily by the cloudinary_storage backend only when USE_CLOUDINARY selects
# it below — inert (and fine to leave blank) while local storage is in use.
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": env("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": env("CLOUDINARY_API_SECRET", default=""),
}

STORAGES = {
    # Applies to every ImageField/FileField that doesn't set its own `storage=`.
    # ProductDocument.file and MediaAsset.file opt out explicitly (see their
    # models) so PDFs/library files never ride Cloudinary's image-typed backend.
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"
        if USE_CLOUDINARY
        else "django.core.files.storage.FileSystemStorage"
    },
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# ─────────────────────────────── DRF ──────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    # Session auth covers the DRF browsable API/docs when DEBUG is on; token auth
    # is what the admin control panel actually uses (see apps.core.auth_views).
    # Public read endpoints stay AllowAny regardless — only admin.* viewsets and
    # apps.core.auth_views require either of these to resolve a user.
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": env.int("API_PAGE_SIZE", default=12),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": env("THROTTLE_ANON_RATE", default="120/hour"),
        "user": env("THROTTLE_USER_RATE", default="1000/hour"),
        "ai": env("THROTTLE_AI_RATE", default="30/hour"),
        "login": env("THROTTLE_LOGIN_RATE", default="20/hour"),
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "NOKS Chemical Division API",
    "DESCRIPTION": "Products, industries, knowledge centre and quotation endpoints.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ─────────────────────────────── CORS ─────────────────────────────
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True

# ─────────────────────────────── EMAIL ────────────────────────────
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@localhost")
SALES_NOTIFICATION_EMAIL = env("SALES_NOTIFICATION_EMAIL", default=DEFAULT_FROM_EMAIL)

# ─────────────────────────────── ADMIN ────────────────────────────
ADMIN_URL = env("DJANGO_ADMIN_URL", default="admin/")
ADMIN_SITE_HEADER = env("DJANGO_ADMIN_SITE_HEADER", default="NOKS")
ADMIN_SITE_TITLE = env("DJANGO_ADMIN_SITE_TITLE", default="NOKS Admin")
ADMIN_INDEX_TITLE = env("DJANGO_ADMIN_INDEX_TITLE", default="Dashboard")

# ─────────────────────────────── AI ASSISTANT (customer-facing) ───
ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")
AI_MODEL = env("AI_MODEL", default="claude-opus-5")
AI_MAX_TOKENS = env.int("AI_MAX_TOKENS", default=1024)
AI_TEMPERATURE = env.float("AI_TEMPERATURE", default=0.3)
AI_ASSISTANT_NAME = env("AI_ASSISTANT_NAME", default="NOKS Chem Assistant")
AI_ENABLED = bool(ANTHROPIC_API_KEY)

# ─────────────────────────────── AI PRODUCT DRAFTING (admin-only) ─
# Separate provider from the customer assistant above — this drafts catalog
# copy for staff to review, never talks to a site visitor. Deliberately never
# asked to produce GHS/hazard/UN-number/storage data; see apps.catalog.ai.
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
OPENAI_MODEL = env("OPENAI_MODEL", default="gpt-4o-mini")
AI_PRODUCT_DRAFTING_ENABLED = bool(OPENAI_API_KEY)

# ─────────────────────────────── BRAND (shared with frontend) ─────
# Read straight from the same NEXT_PUBLIC_* keys the Next.js app uses, so the
# admin, transactional emails and the website can never drift apart.
BRAND = {
    "name": env("NEXT_PUBLIC_BRAND_NAME", default="NOKS"),
    "division": env("NEXT_PUBLIC_BRAND_DIVISION", default="Chemical Division"),
    "tagline": env("NEXT_PUBLIC_BRAND_TAGLINE", default=""),
    "mission": env("NEXT_PUBLIC_BRAND_MISSION", default=""),
    "primary": env("NEXT_PUBLIC_COLOR_PRIMARY", default="#0C48E6"),
    "primary_dark": env("NEXT_PUBLIC_COLOR_PRIMARY_DARK", default="#0A38C2"),
    "navy": env("NEXT_PUBLIC_COLOR_NAVY", default="#071233"),
    "emerald": env("NEXT_PUBLIC_COLOR_EMERALD", default="#059669"),
    "email": env("NEXT_PUBLIC_CONTACT_EMAIL", default=""),
    "phone": env("NEXT_PUBLIC_CONTACT_PHONE", default=""),
    "whatsapp": env("NEXT_PUBLIC_WHATSAPP_NUMBER", default=""),
    "city": env("NEXT_PUBLIC_ADDRESS_CITY", default=""),
    "country": env("NEXT_PUBLIC_ADDRESS_COUNTRY", default=""),
    "site_url": SITE_URL,
}

# ─────────────────────────────── SECURITY ─────────────────────────
X_FRAME_OPTIONS = "SAMEORIGIN"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = env.int("DJANGO_HSTS_SECONDS", default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Next.js's server-side fetches (lib/api.ts, lib/admin/api.ts) hit this
# container directly on the Docker network, bypassing nginx entirely — so
# request.get_host() would otherwise resolve to "backend:8000" and every
# request.build_absolute_uri() call (DRF's automatic ImageField/FileField
# URLs) would bake that unreachable internal host into image/document URLs.
# Both API clients send X-Forwarded-Host with the real public hostname
# precisely so this setting can make Django trust it instead. Safe because
# the backend port is never exposed publicly (see docker-compose.yml) — only
# containers already on the private network can set this header at all.
USE_X_FORWARDED_HOST = env.bool("DJANGO_USE_X_FORWARDED_HOST", default=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "[{levelname}] {name}: {message}", "style": "{"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "root": {"handlers": ["console"], "level": env("DJANGO_LOG_LEVEL", default="INFO")},
}
