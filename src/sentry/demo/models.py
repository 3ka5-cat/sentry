from django.db import models
from django.utils import timezone
from enum import IntEnum

from sentry.models import DefaultFieldsModel, Organization, User
from sentry.db.models import FlexibleForeignKey, BoundedPositiveIntegerField


class DemoOrgStatus(IntEnum):
    ACTIVE = 0
    PENDING = 1

    def __str__(self):
        return self.name

    @property
    def label(self):
        return DemoOrgStatus._labels[self]

    @classmethod
    def as_choices(cls):
        (
            (cls.ACTIVE, DemoOrgStatus._labels[cls.ACTIVE]),
            (cls.PENDING, DemoOrgStatus._labels[cls.PENDING]),
        )


DemoOrgStatus._labels = {
    DemoOrgStatus.ACTIVE: "active",
    DemoOrgStatus.PENDING: "pending",
}


class DemoOrganization(DefaultFieldsModel):
    __core__ = False

    organization = FlexibleForeignKey("sentry.Organization", unique=True)
    status = BoundedPositiveIntegerField(
        choices=DemoOrgStatus.as_choices(), default=DemoOrgStatus.PENDING.value
    )
    date_assigned = models.DateTimeField(null=True)

    @classmethod
    def create_org(cls, *args, **kwargs):
        org = Organization.objects.create(*args, **kwargs)
        cls.objects.create(organization=org)
        return org

    def mark_assigned(self):
        self.status = DemoOrgStatus.ACTIVE.value
        self.date_assigned = timezone.now()
        self.save()


class DemoUser(DefaultFieldsModel):
    __core__ = False

    user = FlexibleForeignKey("sentry.User", unique=True)
    date_assigned = models.DateTimeField(null=True)

    @classmethod
    def create_user(cls, *args, **kwargs):
        user = User.objects.create(*args, **kwargs)
        # assignment takes place on creation
        cls.objects.create(user=user, date_assigned=timezone.now())
        return user
