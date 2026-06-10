from django.urls import include, path

urlpatterns = [
    path("api/", include("logistica.urls")),
    path("health/", include("logistica.health_urls")),
]
