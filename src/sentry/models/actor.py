from django.db import models
from sentry.db.models import Model
from django.db.models.signals import pre_save

ACTOR_TYPES = {"team": 0, "user": 1}


def actor_type_to_model(type):
    # type will be 0 or 1 and we want to get Team or User
    from sentry.models import Team, User

    ACTOR_TYPE_TO_MODEL = [Team, User]  # Indexed to match ACTOR_TYPES.
    return ACTOR_TYPE_TO_MODEL[type]


class Actor(Model):
    __core__ = True

    type = models.PositiveSmallIntegerField(
        choices=(
            (0, "team"),
            (1, "user"),
        )
    )

    class Meta:
        app_label = "sentry"
        db_table = "sentry_actor"


def handle_actor_pre_save(instance, **kwargs):
    # we want to create an actor if we don't have one
    if not instance.actor_id:
        instance.actor_id = Actor.objects.create(
            type=ACTOR_TYPES[type(instance).__name__.lower()]
        ).id


pre_save.connect(
    handle_actor_pre_save, sender="sentry.Team", dispatch_uid="handle_actor_pre_save", weak=False
)
pre_save.connect(
    handle_actor_pre_save, sender="sentry.User", dispatch_uid="handle_actor_pre_save", weak=False
)
