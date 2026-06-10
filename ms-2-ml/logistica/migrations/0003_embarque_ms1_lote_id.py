from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("logistica", "0002_blockchainevento"),
    ]

    operations = [
        migrations.AddField(
            model_name="embarque",
            name="ms1_lote_id",
            field=models.IntegerField(blank=True, null=True, unique=True),
        ),
    ]
