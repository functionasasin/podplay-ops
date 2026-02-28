# Spec: Pydantic & SQLAlchemy Models — Instagram DM Support

**Aspect**: `spec-pydantic-models`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-02-28
**Input files**:
- `analysis/audit/backend-services.md` — exact backend service patterns, `Candidate` object
- `analysis/audit/db-schemas.md` — exact current schema baseline
- `analysis/spec/db-migrations.md` — new tables and columns
- `../cheerful-ig-dm-reverse/analysis/option-parallel-tables.md` — parallel tables design
- Codebase reads: `src/models/database/smtp_message.py`, `src/models/database/user_smtp_account.py`,
  `src/models/database/smtp_thread_state.py`, `src/models/database/gmail_thread_state.py`,
  `src/models/temporal/gmail_thread_state.py`, `src/models/api/gmail_message.py`,
  `src/models/api/smtp_account.py`

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/backend/src/models/database/user_ig_dm_account.py` |
| CREATE | `apps/backend/src/models/database/ig_dm_message.py` |
| CREATE | `apps/backend/src/models/database/ig_dm_thread_state.py` |
| CREATE | `apps/backend/src/models/database/ig_dm_llm_draft.py` |
| CREATE | `apps/backend/src/models/meta/webhook.py` |
| CREATE | `apps/backend/src/models/meta/__init__.py` |
| CREATE | `apps/backend/src/models/api/ig_dm_account.py` |
| CREATE | `apps/backend/src/models/api/ig_dm_message.py` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/models/database/account_type.py` | Add `INSTAGRAM_DM = "instagram_dm"` |
| MODIFY | `apps/backend/src/models/temporal/gmail_thread_state.py` | Add `ig_dm_account_id`, `ig_conversation_id`, `state__window_expires_at`, `state__latest_ig_dm_message_id` to `Candidate`; add `ig_dm_account_id` to `UpdateStateStatusParams` |
| MODIFY | `apps/backend/src/models/database/__init__.py` | Export new IG DM models |

---

## Conventions Used (From Existing Codebase)

All models follow these conventions confirmed in the audit:

- **SQLAlchemy ORM**: `from sqlalchemy.orm import Mapped, mapped_column` with type annotations
- **PK default**: `server_default=func.gen_random_uuid()` (not Python-side default)
- **Timestamps**: `DateTime(timezone=True)` with `server_default=func.now()`, no `onupdate`
- **Nullable columns**: `nullable=True` on `mapped_column()` OR `Mapped[type | None]` union
- **StrEnum reuse**: `GmailThreadStatus` is imported and reused for SMTP (same pattern for IG DM)
- **Direction enum**: `GmailMessageDirection` is reused across Gmail and SMTP; same for IG DM
- **Pydantic models**: `from pydantic import BaseModel, ConfigDict, Field`
- **`from_attributes`**: `model_config = ConfigDict(from_attributes=True)` (not deprecated `Config`)
- **Union syntax**: Python 3.10+ `type | None` (not `Optional[type]`)

---

## 1. Modified: `account_type.py`

**File**: `apps/backend/src/models/database/account_type.py`

```python
from enum import StrEnum


class AccountType(StrEnum):
    GMAIL        = "gmail"
    SMTP         = "smtp"
    INSTAGRAM_DM = "instagram_dm"  # NEW
```

**Behavior**: `INSTAGRAM_DM` is used wherever code branches on account type (coordinator, API routes,
settings pages). All existing `GMAIL` and `SMTP` usages are unaffected.

---

## 2. New: `user_ig_dm_account.py`

**File**: `apps/backend/src/models/database/user_ig_dm_account.py`
**Parallel to**: `src/models/database/user_smtp_account.py`

```python
"""UserIgDmAccount model for Instagram Business Account credentials."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base


class UserIgDmAccount(Base):
    """Instagram Business Account connected for receiving/sending DMs.

    Parallel to UserGmailAccount and UserSmtpAccount.
    Stores long-lived page access token (60-day expiry, requires periodic refresh).
    """

    __tablename__ = "user_ig_dm_account"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "instagram_business_account_id",
            name="uq_user_ig_dm_account",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Meta account identifiers
    instagram_business_account_id: Mapped[str] = mapped_column(Text, nullable=False)
    # e.g. "17841400000123456"
    facebook_page_id: Mapped[str] = mapped_column(Text, nullable=False)
    # Linked Facebook Page ID (required by current Meta API for IG Messaging)
    ig_username: Mapped[str] = mapped_column(Text, nullable=False)
    # e.g. "brandname" (display name in UI, re-fetched on token refresh)

    # OAuth tokens (long-lived page token, 60-day expiry)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    # Stored as returned by Meta (not encrypted — RLS restricts to owner)
    # See audit/backend-services.md §Credential Storage Pattern for discussion
    access_token_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    token_type: Mapped[str] = mapped_column(Text, nullable=False, default="page")
    # 'page' | 'user'

    # Webhook subscription state
    webhook_subscribed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    webhook_subscription_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    webhook_subscribed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Initial sync / backfill state
    initial_sync_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_sync_cursor: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Graph API /conversations pagination cursor; NULL = not yet synced

    # Account health
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verification_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

---

## 3. New: `ig_dm_message.py`

**File**: `apps/backend/src/models/database/ig_dm_message.py`
**Parallel to**: `src/models/database/smtp_message.py` (which mirrors `gmail_message.py`)

```python
"""IgDmMessage model for storing Instagram DM messages."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base
from .gmail_message import GmailMessageDirection  # Reuse direction enum


class IgDmMessageType(StrEnum):
    """Type/format of an Instagram DM message payload."""
    TEXT         = "text"
    IMAGE        = "image"
    VIDEO        = "video"
    AUDIO        = "audio"
    STORY_REPLY  = "story_reply"
    UNSUPPORTED  = "unsupported"


class IgDmMessage(Base):
    """Individual Instagram DM message (inbound or outbound).

    Parallel to GmailMessage and SmtpMessage. Key structural differences:
    - No subject, CC, BCC, or RFC 2822 headers (DMs are chat-style)
    - Sender/recipient identified by IGSID (opaque numeric string), not email
    - Media stored as Supabase Storage paths (Meta CDN URLs expire ~1 hour)
    - is_echo=True for outbound messages echoed back via Meta webhooks
    """

    __tablename__ = "ig_dm_message"
    __table_args__ = (
        UniqueConstraint(
            "ig_dm_account_id",
            "mid",
            name="uq_ig_dm_message",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # Ownership
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    ig_dm_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_ig_dm_account.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Meta identifiers
    mid: Mapped[str] = mapped_column(Text, nullable=False)
    # Message ID from Meta (global, unique per sender). Used for deduplication.
    ig_conversation_id: Mapped[str] = mapped_column(Text, nullable=False)
    # Meta conversation thread ID — semantic equivalent of gmail_thread_id

    # Sender / recipient (IGSIDs are opaque numeric strings from Meta)
    sender_igsid: Mapped[str] = mapped_column(Text, nullable=False)
    sender_username: Mapped[str | None] = mapped_column(Text, nullable=True)
    # NULL until resolved via ig_igsid_cache; updated after Graph API call
    recipient_igsid: Mapped[str] = mapped_column(Text, nullable=False)

    # Direction (reuse GmailMessageDirection: INBOUND | OUTBOUND)
    direction: Mapped[GmailMessageDirection] = mapped_column(Text, nullable=False)
    is_echo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # TRUE if this is a Meta webhook echo of an outbound message sent by Cheerful

    # Content
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # NULL for media-only messages
    message_type: Mapped[IgDmMessageType] = mapped_column(
        Text, nullable=False, default=IgDmMessageType.TEXT
    )

    # Media (Meta CDN URLs expire ~1 hour — download and re-store in Supabase Storage)
    media_storage_paths: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    # Supabase Storage object paths (permanent URLs for serving to frontend)
    media_original_urls: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    # Original Meta CDN URLs (kept for reference; may be expired)

    # Timestamps
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Timestamp from Meta webhook payload
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # When Cheerful stored this message

    # Threading
    reply_to_mid: Mapped[str | None] = mapped_column(Text, nullable=True)
    # MID of the message this is a direct reply to (if any)
```

---

## 4. New: `ig_dm_thread_state.py`

**File**: `apps/backend/src/models/database/ig_dm_thread_state.py`
**Parallel to**: `src/models/database/smtp_thread_state.py`

```python
"""IgDmThreadState and LatestIgDmMessagePerThread models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base
from .gmail_thread_state import GmailThreadStatus

# Alias for code clarity — uses the same underlying string values as GmailThreadStatus.
# READY_FOR_ATTACHMENT_EXTRACTION is never emitted for DM threads (coordinator branch
# skips that step). All other 7 statuses apply with DM-specific semantics.
# See spec-db-migrations.md §Section 5 for status → DM semantics mapping table.
IgDmThreadStatus = GmailThreadStatus


class IgDmThreadState(Base):
    """Versioned state tracking for Instagram DM conversation threads.

    Append-only event-sourced state log. Parallel to GmailThreadState and
    SmtpThreadState. Adds window_expires_at for the Instagram 24-hour messaging
    window (no email equivalent).
    """

    __tablename__ = "ig_dm_thread_state"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "ig_dm_account_id",
            "ig_conversation_id",
            "latest_internal_date",
            name="uq_ig_dm_thread_state_version",
        ),
        Index(
            "idx_ig_dm_thread_state_latest",
            "ig_dm_account_id",
            "ig_conversation_id",
            "latest_internal_date",
            postgresql_using="btree",
        ),
        Index(
            "idx_ig_dm_thread_state_user_latest_date",
            "user_id",
            "latest_internal_date",
            postgresql_using="btree",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # Ownership
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    ig_dm_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_ig_dm_account.id"), nullable=False
    )

    # Thread identity
    ig_conversation_id: Mapped[str] = mapped_column(Text, nullable=False)
    # Meta conversation ID (= campaign_thread.ig_dm_thread_id)

    # State machine (reuse GmailThreadStatus; stored as TEXT in DB)
    status: Mapped[GmailThreadStatus] = mapped_column(
        Text,
        nullable=False,
        default=GmailThreadStatus.READY_FOR_CAMPAIGN_ASSOCIATION,
    )

    # Version (append-only pattern — one row per state transition)
    latest_internal_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    # sent_at of the ig_dm_message that triggered this state row

    # DM-specific: 24-hour messaging window
    window_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Non-NULL when a new inbound message arrived = latest_internal_date + 24h.
    # NULL for system-generated state rows (IGNORE, DONE) where window is not relevant.

    # Causation tracing
    triggered_by_mid: Mapped[str | None] = mapped_column(Text, nullable=True)
    # ig_dm_message.mid that caused this state transition

    # Latest message reference (parallel to GmailThreadState.latest_gmail_message_id)
    latest_ig_dm_message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ig_dm_message.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class LatestIgDmMessagePerThread(Base):
    """Tracks the latest DM message per conversation for efficient inbox queries.

    Trigger-maintained denormalized table. Parallel to LatestSmtpMessagePerThread.
    Trigger: trg_update_latest_ig_dm_message (defined in migration SQL).
    """

    __tablename__ = "latest_ig_dm_message_per_thread"

    # Composite PK (ig_conversation_id is NOT globally unique across accounts)
    ig_dm_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_ig_dm_account.id", ondelete="CASCADE"),
        primary_key=True,
    )
    ig_conversation_id: Mapped[str] = mapped_column(Text, primary_key=True)

    latest_message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ig_dm_message.id", ondelete="CASCADE"),
        nullable=False,
    )
    latest_message_sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    direction: Mapped[str] = mapped_column(Text, nullable=False)
    # 'INBOUND' | 'OUTBOUND' — for inbox preview (shows sent vs received)
```

---

## 5. New: `ig_dm_llm_draft.py`

**File**: `apps/backend/src/models/database/ig_dm_llm_draft.py`
**Design**: New isolated table (Option B) — does NOT extend `gmail_thread_llm_draft`.
See `spec-db-migrations.md §Section 7` for rationale.

```python
"""IgDmLlmDraft model for AI-generated Instagram DM reply drafts."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import Base


class IgDmLlmDraft(Base):
    """AI-generated draft for an Instagram DM thread.

    New isolated table (not extending gmail_thread_llm_draft) for clean separation.
    Key differences from gmail_thread_llm_draft:
    - No draft_subject (DMs have no subject)
    - No draft_body_html (DMs are always plain text)
    - No gmail_draft_id (no Gmail API integration for DMs)
    - draft_body_text is NOT NULL (always required)
    - ig_dm_thread_state_id is NOT NULL (always scoped to a state)
    """

    __tablename__ = "ig_dm_llm_draft"
    __table_args__ = (
        UniqueConstraint(
            "ig_dm_account_id",
            "ig_conversation_id",
            "ig_dm_thread_state_id",
            name="uq_ig_dm_llm_draft_per_state",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    # Ownership
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    ig_dm_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_ig_dm_account.id"), nullable=False
    )

    # Thread references
    ig_dm_thread_state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ig_dm_thread_state.id"), nullable=False
    )
    ig_conversation_id: Mapped[str] = mapped_column(Text, nullable=False)
    # Denormalized from ig_dm_thread_state for query convenience

    # Draft content (plain text only — no subject, no HTML)
    draft_body_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Observability
    langfuse_session_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Langfuse session ID for this draft generation run (for debugging prompt traces)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

---

## 6. New: `models/meta/webhook.py`

**File**: `apps/backend/src/models/meta/webhook.py`
**Purpose**: Parse incoming Meta webhook payloads (Pydantic models used in the webhook router).
**Reference**: `../cheerful-ig-dm-reverse/analysis/meta-webhooks-realtime.md`

```python
"""Pydantic models for parsing Meta webhook payloads."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MetaWebhookSender(BaseModel):
    """IGSID of the message sender."""
    id: str
    # Instagram-Scoped ID (IGSID) — opaque numeric string, e.g. "17841400000123456"


class MetaWebhookRecipient(BaseModel):
    """IGSID of the message recipient (the IG Business Account)."""
    id: str


class MetaWebhookAttachment(BaseModel):
    """Media attachment in a webhook message."""
    type: str
    # "image" | "video" | "audio" | "file" | "story_mention"
    payload: MetaWebhookAttachmentPayload | None = None


class MetaWebhookAttachmentPayload(BaseModel):
    """Payload for a media attachment."""
    url: str | None = None
    # Ephemeral CDN URL (~1 hour TTL) — must be downloaded immediately


class MetaWebhookMessage(BaseModel):
    """A single message within a webhook messaging event."""
    mid: str
    # Global message ID — used for deduplication (uq_ig_dm_message constraint)
    text: str | None = None
    # Text body; NULL for media-only messages
    attachments: list[MetaWebhookAttachment] | None = None
    is_echo: bool = False
    # True if this is an outbound message echo (sent by the IG Business Account)
    reply_to: MetaWebhookReplyTo | None = None


class MetaWebhookReplyTo(BaseModel):
    """The message this reply is responding to."""
    mid: str | None = None
    # MID of the original message being replied to


class MetaWebhookMessaging(BaseModel):
    """A messaging event within a webhook entry."""
    sender: MetaWebhookSender
    recipient: MetaWebhookRecipient
    timestamp: int
    # Unix milliseconds — convert to TIMESTAMPTZ for sent_at
    message: MetaWebhookMessage | None = None
    # NULL for non-message events (delivery receipts, read receipts, etc.)


class MetaWebhookEntry(BaseModel):
    """A single entry in a webhook payload (one IG Business Account's events)."""
    id: str
    # IG Business Account ID this entry belongs to
    time: int
    # Unix timestamp of the batch
    messaging: list[MetaWebhookMessaging] = Field(default_factory=list)


class MetaWebhookPayload(BaseModel):
    """Root Meta webhook POST body.

    Example shape:
    {
      "object": "instagram",
      "entry": [
        {
          "id": "17841400000123456",
          "time": 1234567890,
          "messaging": [
            {
              "sender": {"id": "12345"},
              "recipient": {"id": "17841400000123456"},
              "timestamp": 1234567890123,
              "message": {"mid": "mid.xxx", "text": "hello"}
            }
          ]
        }
      ]
    }
    """
    object: str
    # Always "instagram" for IG DM webhooks
    entry: list[MetaWebhookEntry] = Field(default_factory=list)


# Rebuild forward references
MetaWebhookAttachment.model_rebuild()
MetaWebhookMessage.model_rebuild()
```

**File**: `apps/backend/src/models/meta/__init__.py`
```python
from .webhook import (
    MetaWebhookAttachment,
    MetaWebhookAttachmentPayload,
    MetaWebhookEntry,
    MetaWebhookMessage,
    MetaWebhookMessaging,
    MetaWebhookPayload,
    MetaWebhookRecipient,
    MetaWebhookReplyTo,
    MetaWebhookSender,
)

__all__ = [
    "MetaWebhookAttachment",
    "MetaWebhookAttachmentPayload",
    "MetaWebhookEntry",
    "MetaWebhookMessage",
    "MetaWebhookMessaging",
    "MetaWebhookPayload",
    "MetaWebhookRecipient",
    "MetaWebhookReplyTo",
    "MetaWebhookSender",
]
```

---

## 7. New: `models/api/ig_dm_account.py`

**File**: `apps/backend/src/models/api/ig_dm_account.py`
**Parallel to**: `src/models/api/smtp_account.py`
**Purpose**: Request/response models for the IG account management API endpoints.

```python
"""API request/response models for Instagram DM account endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IgDmAccountConnectRequest(BaseModel):
    """Request body for completing Meta OAuth flow.

    Frontend sends this after receiving the authorization code from Meta's
    OAuth redirect. Backend exchanges the code for tokens.
    """
    code: str
    # Authorization code from Meta OAuth redirect
    redirect_uri: str
    # Must match the redirect_uri used in the initial OAuth link


class IgDmAccountResponse(BaseModel):
    """Response model for a connected Instagram DM account.

    Excludes access_token (sensitive). Parallel to SmtpAccountResponse.
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    instagram_business_account_id: str
    facebook_page_id: str
    ig_username: str
    token_type: str
    access_token_expires_at: datetime

    # Webhook state
    webhook_subscribed: bool
    webhook_subscribed_at: datetime | None

    # Sync state
    initial_sync_completed: bool

    # Account health
    is_active: bool
    last_verified_at: datetime | None
    verification_error: str | None

    created_at: datetime


class IgDmAccountListResponse(BaseModel):
    """List of connected IG DM accounts for the current user."""
    accounts: list[IgDmAccountResponse]


class IgDmAccountUpdateRequest(BaseModel):
    """Request for updating IG account settings (currently only deactivation)."""
    is_active: bool | None = None
```

---

## 8. New: `models/api/ig_dm_message.py`

**File**: `apps/backend/src/models/api/ig_dm_message.py`
**Parallel to**: `src/models/api/gmail_message.py`
**Purpose**: Request/response models for IG DM thread list, thread detail, and reply endpoints.

```python
"""API request/response models for Instagram DM thread and message endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.models.database.gmail_thread_state import GmailThreadStatus
from src.models.database.gmail_message import GmailMessageDirection
from src.models.database.ig_dm_message import IgDmMessageType


class IgDmMessageResponse(BaseModel):
    """Full message detail for an individual DM (within thread view).

    Parallel to MessageInThread (from gmail_message.py) but DM-shaped:
    - Sender identified by IGSID + username (not email)
    - No subject, CC, BCC, HTML body
    - Includes media_urls for rendering images/videos
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    # ig_dm_message.id (for frontend keying)
    mid: str
    # Meta message ID (for deduplication and reply threading)
    ig_conversation_id: str

    sender_igsid: str
    sender_username: str | None
    # @username; NULL if not yet resolved via ig_igsid_cache
    recipient_igsid: str

    direction: GmailMessageDirection
    is_echo: bool

    body_text: str | None
    message_type: IgDmMessageType

    # Media: Supabase Storage signed URLs for images/videos
    # Frontend uses these for rendering; they are permanent (not ephemeral Meta CDN URLs)
    media_storage_paths: list[str] | None
    media_original_urls: list[str] | None

    sent_at: datetime
    received_at: datetime

    reply_to_mid: str | None


class IgDmThreadSummary(BaseModel):
    """Summary of a DM thread for inbox list view.

    Parallel to ThreadSummary (from gmail_message.py) but DM-shaped.
    Used by GET /api/ig-dm/threads response.
    """
    ig_conversation_id: str
    # = campaign_thread.ig_dm_thread_id (the thread identifier)
    ig_dm_thread_state_id: uuid.UUID
    # Latest ig_dm_thread_state.id (for draft operations)
    ig_dm_account_id: uuid.UUID

    status: GmailThreadStatus
    latest_message_sent_at: datetime
    latest_direction: GmailMessageDirection

    snippet: str
    # Truncated body_text (~150 chars) from latest non-echo message
    sender_igsid: str
    sender_username: str | None
    # @handle of the DM partner (creator)

    campaign_id: uuid.UUID | None
    # Set once campaign is associated

    # 24-hour window
    window_expires_at: datetime | None
    # NULL if no active window (e.g. thread is WAITING_FOR_INBOUND after reply sent)

    # Creator fields (from campaign_creator, if resolved)
    gifting_status: str | None = None
    paid_promotion_status: str | None = None


class IgDmThreadView(BaseModel):
    """Full thread detail with messages for the DM thread detail view.

    Parallel to ThreadWithMessages (from gmail_message.py).
    Used by GET /api/ig-dm/threads/{id}/messages response.
    """
    ig_conversation_id: str
    ig_dm_thread_state_id: uuid.UUID
    ig_dm_account_id: uuid.UUID
    ig_username: str
    # The IG Business Account @username (from user_ig_dm_account.ig_username)

    status: GmailThreadStatus
    latest_message_sent_at: datetime
    latest_direction: GmailMessageDirection

    snippet: str
    sender_igsid: str
    sender_username: str | None
    # @handle of the DM partner

    campaign_id: uuid.UUID | None

    # 24-hour window state
    window_expires_at: datetime | None
    window_is_active: bool
    # Computed: window_expires_at is not None AND window_expires_at > now()

    messages: list[IgDmMessageResponse]
    # All messages in chronological order (sent_at ASC)

    # AI draft (if available for current state)
    llm_draft: str | None = None
    # draft_body_text from ig_dm_llm_draft for the current ig_dm_thread_state_id;
    # NULL if no draft generated yet

    # Creator fields
    gifting_status: str | None = None
    paid_promotion_status: str | None = None


class IgDmReplyRequest(BaseModel):
    """Request body for POST /api/ig-dm/threads/{id}/reply."""
    message_text: str | None = None
    # Plain text content (required unless media_url is provided)
    media_url: str | None = None
    # Supabase Storage URL for image/video to send (optional)
    # Frontend uploads media first, then includes the storage URL here

    # Note: at least one of message_text or media_url must be provided.
    # Validation is enforced in the route handler (not in this model)
    # to follow the existing codebase's "validate in handler" pattern.


class IgDmReplyResponse(BaseModel):
    """Response body for POST /api/ig-dm/threads/{id}/reply."""
    sent_mid: str
    # MID of the sent message (from Meta API response)
    stored_message_id: uuid.UUID
    # ig_dm_message.id of the stored outbound message
```

---

## 9. Modified: `models/temporal/gmail_thread_state.py`

**File**: `apps/backend/src/models/temporal/gmail_thread_state.py`
**Current**: Lines 1-32 define `Candidate` and `UpdateStateStatusParams`.
**Change**: Add 4 new optional fields to `Candidate`; add `ig_dm_account_id` to `UpdateStateStatusParams`.

### Modified `Candidate` class

```python
import uuid
from datetime import datetime

from pydantic import BaseModel
from src.models.database import GmailThreadStatus
from src.models.database.gmail_message import GmailMessageDirection


class Candidate(BaseModel):
    gmail_thread_id: str
    # NOTE: For IG DM threads, this field contains the ig_conversation_id string.
    # This reuses the existing naming convention (SMTP already reuses gmail_thread_id
    # to hold email_thread_id). The ig_conversation_id is the semantic equivalent.

    gmail_account_id: uuid.UUID | None = None
    # Gmail account (set for Gmail path)
    smtp_account_id: uuid.UUID | None = None
    # SMTP account (set for SMTP path)
    ig_dm_account_id: uuid.UUID | None = None
    # Instagram DM account (set for IG DM path)  ← NEW

    user_id: uuid.UUID
    state__id: uuid.UUID
    # GmailThreadState.id, SmtpThreadState.id, OR IgDmThreadState.id
    state__latest_internal_date: datetime
    state__latest_gmail_message_id: uuid.UUID
    # For IG DM: this holds the ig_dm_message.id (field name is legacy)

    latest_gmail_message__direction: GmailMessageDirection
    # For IG DM: holds direction of the latest ig_dm_message

    user__email: str | None = None
    gmail_account__email: str | None = None
    # For IG DM: holds ig_username from user_ig_dm_account (field name is legacy)

    # IG DM-specific fields  ← NEW
    ig_conversation_id: str | None = None
    # The Meta conversation ID (= ig_dm_thread_state.ig_conversation_id).
    # When set, ig_dm_account_id is also set; all email-specific fields are None.
    state__window_expires_at: datetime | None = None
    # Populated for IG DM threads from ig_dm_thread_state.window_expires_at.
    # Used by coordinator to gate draft generation (if expired, don't draft).

    force_reply: bool = False
    # Bypass campaign goal/rule checks (set by unhide)
    force_campaign_id: uuid.UUID | None = None
    # Skip LLM campaign association, use this campaign
```

### Modified `UpdateStateStatusParams` class

```python
class UpdateStateStatusParams(BaseModel):
    state__id: uuid.UUID
    status: GmailThreadStatus
    smtp_account_id: uuid.UUID | None = None
    # Set for SMTP states
    ig_dm_account_id: uuid.UUID | None = None
    # Set for IG DM states  ← NEW
```

**Behavior notes for `Candidate` extension**:
- Exactly one of `gmail_account_id`, `smtp_account_id`, `ig_dm_account_id` is set per `Candidate`.
- `ig_conversation_id` is set when `ig_dm_account_id` is set (and is also stored in `gmail_thread_id` for backward compatibility with coordinator shared logic that reads `gmail_thread_id` as a generic thread identifier).
- `state__window_expires_at` is `None` for all Gmail and SMTP candidates (no window concept).
- `state__latest_gmail_message_id` holds `ig_dm_message.id` for IG DM candidates — field name is a naming artifact of the parallel-tables approach (SMTP set this precedent).

---

## 10. Supporting Model: IGSID Resolution Result

**File**: `apps/backend/src/models/temporal/ig_dm_ingest.py` (new)
**Purpose**: Shared types for IG DM Temporal workflows and activities.

```python
"""Pydantic models for IG DM Temporal workflow inputs/outputs."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from src.models.database.ig_dm_message import IgDmMessageType
from src.models.database.gmail_message import GmailMessageDirection


class IgIdentityResult(BaseModel):
    """Result of IGSID → username resolution (ig_igsid_resolution_activity output)."""
    igsid: str
    username: str | None
    # NULL if Graph API call failed or returned no username (rate-limited)
    display_name: str | None
    resolved_from_cache: bool
    # True = cache hit; False = Graph API call was made


class IgDmIngestInput(BaseModel):
    """Input to IgDmIngestWorkflow (fired from webhook BackgroundTask)."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    ig_business_account_id: str
    # From webhook entry.id — used to look up the UserIgDmAccount
    sender_igsid: str
    recipient_igsid: str
    ig_conversation_id: str
    mid: str
    body_text: str | None
    message_type: IgDmMessageType
    sent_at_ms: int
    # Unix milliseconds from Meta webhook timestamp field
    media_original_urls: list[str] | None
    # Raw Meta CDN URLs to download (if any) — ephemeral, ~1 hour TTL
    reply_to_mid: str | None
    is_echo: bool


class IgDmIngestResult(BaseModel):
    """Output from IgDmIngestWorkflow."""
    ig_dm_message_id: uuid.UUID
    # ig_dm_message.id of the stored message
    ig_conversation_id: str
    was_duplicate: bool
    # True if mid already existed (ON CONFLICT DO NOTHING triggered)


class IgDmSendReplyInput(BaseModel):
    """Input to IgDmSendReplyWorkflow (fired from POST /api/ig-dm/threads/{id}/reply)."""
    ig_dm_account_id: uuid.UUID
    ig_dm_thread_state_id: uuid.UUID
    ig_conversation_id: str
    user_id: uuid.UUID
    recipient_igsid: str
    message_text: str | None
    media_url: str | None
    # Supabase Storage URL for media; IgDmService will send this URL to Meta API


class IgDmReconciliationInput(BaseModel):
    """Input to IgDmReconciliationWorkflow (cron-scheduled polling recovery)."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    lookback_hours: int = 2
    # How far back to poll for missed messages
```

---

## 11. Summary Table: All New Model Classes

| Class | File | Type | Parallel to |
|-------|------|------|-------------|
| `UserIgDmAccount` | `models/database/user_ig_dm_account.py` | SQLAlchemy ORM | `UserSmtpAccount` |
| `IgDmMessageType` | `models/database/ig_dm_message.py` | StrEnum | `GmailMessageDirection` pattern |
| `IgDmMessage` | `models/database/ig_dm_message.py` | SQLAlchemy ORM | `SmtpMessage` |
| `IgDmThreadStatus` | `models/database/ig_dm_thread_state.py` | Alias (`= GmailThreadStatus`) | `GmailThreadStatus` |
| `IgDmThreadState` | `models/database/ig_dm_thread_state.py` | SQLAlchemy ORM | `SmtpThreadState` |
| `LatestIgDmMessagePerThread` | `models/database/ig_dm_thread_state.py` | SQLAlchemy ORM | `LatestSmtpMessagePerThread` |
| `IgDmLlmDraft` | `models/database/ig_dm_llm_draft.py` | SQLAlchemy ORM | `GmailThreadLlmDraft` (isolated) |
| `MetaWebhookSender` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookRecipient` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookAttachment` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookAttachmentPayload` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookMessage` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookReplyTo` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookMessaging` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookEntry` | `models/meta/webhook.py` | Pydantic | — (new) |
| `MetaWebhookPayload` | `models/meta/webhook.py` | Pydantic | — (new) |
| `IgDmAccountConnectRequest` | `models/api/ig_dm_account.py` | Pydantic | `SmtpAccountCreateRequest` |
| `IgDmAccountResponse` | `models/api/ig_dm_account.py` | Pydantic | `SmtpAccountResponse` |
| `IgDmAccountListResponse` | `models/api/ig_dm_account.py` | Pydantic | — |
| `IgDmAccountUpdateRequest` | `models/api/ig_dm_account.py` | Pydantic | `SmtpAccountUpdateRequest` |
| `IgDmMessageResponse` | `models/api/ig_dm_message.py` | Pydantic | `MessageInThread` |
| `IgDmThreadSummary` | `models/api/ig_dm_message.py` | Pydantic | `ThreadSummary` |
| `IgDmThreadView` | `models/api/ig_dm_message.py` | Pydantic | `ThreadWithMessages` |
| `IgDmReplyRequest` | `models/api/ig_dm_message.py` | Pydantic | — |
| `IgDmReplyResponse` | `models/api/ig_dm_message.py` | Pydantic | — |
| `IgIdentityResult` | `models/temporal/ig_dm_ingest.py` | Pydantic | — (new) |
| `IgDmIngestInput` | `models/temporal/ig_dm_ingest.py` | Pydantic | — |
| `IgDmIngestResult` | `models/temporal/ig_dm_ingest.py` | Pydantic | — |
| `IgDmSendReplyInput` | `models/temporal/ig_dm_ingest.py` | Pydantic | — |
| `IgDmReconciliationInput` | `models/temporal/ig_dm_ingest.py` | Pydantic | — |

### Modified Model Classes

| Class | File | Change |
|-------|------|--------|
| `AccountType` | `models/database/account_type.py` | Add `INSTAGRAM_DM = "instagram_dm"` |
| `Candidate` | `models/temporal/gmail_thread_state.py` | Add `ig_dm_account_id`, `ig_conversation_id`, `state__window_expires_at` |
| `UpdateStateStatusParams` | `models/temporal/gmail_thread_state.py` | Add `ig_dm_account_id: uuid.UUID \| None = None` |

---

## Design Decisions

### 1. `IgDmThreadStatus = GmailThreadStatus` (alias, not new StrEnum)
- Status values are stored as TEXT in DB (not DB enum), so no migration needed.
- All 7 existing values apply semantically; `READY_FOR_ATTACHMENT_EXTRACTION` is simply never emitted for DM threads (coordinator branch skips that step).
- Code clarity: `from src.models.database.ig_dm_thread_state import IgDmThreadStatus` vs referencing `GmailThreadStatus` directly.

### 2. `GmailMessageDirection` reused for IG DM direction
- Same values (`INBOUND` | `OUTBOUND`) apply to DMs.
- Import from `ig_dm_message.py`: `from .gmail_message import GmailMessageDirection`.
- No new enum needed.

### 3. `Candidate.gmail_thread_id` reused for IG DM conversation ID
- SMTP already set this precedent: `gmail_thread_id` holds `email_thread_id` for SMTP threads.
- For IG DM: `gmail_thread_id` holds `ig_conversation_id`. Additionally, `ig_conversation_id` is set as a separate explicit field for type-safe access in the coordinator's IG DM branch.
- This naming debt is accepted as consistent with the parallel-tables approach.

### 4. `access_token` NOT encrypted in DB (unlike Gmail `refresh_token`)
- Gmail: `refresh_token` is encrypted via `crypto_service.encrypt()` before storage.
- SMTP: `smtp_password` and `imap_password` are encrypted.
- IG DM: `access_token` is stored as returned by Meta (not separately encrypted).
- Justification: Supabase RLS restricts `user_ig_dm_account` to owner-only SELECT. The token is only accessible to the authenticated user. This matches the per-table security model. If the team prefers encryption at rest (defense in depth), add `crypto_service.encrypt()` at `IgDmService.for_account()` creation time — field type and API model stay the same.

### 5. No `IgIsidCache` SQLAlchemy model
- `ig_igsid_cache` is a system-level shared table not user-scoped (no RLS, no user_id).
- It is never returned directly to the frontend (no API model needed).
- Access is via raw SQL in the `ig_igsid_resolution_activity` (same pattern as other low-level cache tables in the system).
- A simple TypedDict or dataclass suffices for Python-side representation; no SQLAlchemy ORM model needed.
