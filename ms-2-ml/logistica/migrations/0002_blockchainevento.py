from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("logistica", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BlockchainEvento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vin", models.CharField(db_index=True, max_length=17)),
                ("evento", models.CharField(max_length=80)),
                ("descripcion", models.TextField(blank=True, default="")),
                ("registrado_por", models.CharField(blank=True, default="", max_length=80)),
                ("creado_en", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-creado_en"],
            },
        ),
    ]
