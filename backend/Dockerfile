# NOKS Chemical Division — Django/Gunicorn image.
FROM python:3.12-slim

# PYTHONUNBUFFERED so gunicorn/celery logs reach `docker compose logs` immediately
# rather than sitting in a pipe buffer until the process exits.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# curl is used by the compose healthcheck; postgresql-client gives us pg_isready
# and psql for maintenance (dumps, one-off queries) inside the container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copied ahead of the source so the (slow) dependency layer is reused whenever
# only application code changes.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# collectstatic writes here and gunicorn serves uploads from media/; both are
# bind-mounted to named volumes at runtime, so create them for the non-mounted case.
RUN mkdir -p /app/staticfiles /app/media

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "90"]
