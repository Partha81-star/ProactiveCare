"""
ProactiveCare – Notification Scheduler
========================================

Handles scheduled/delayed notifications using APScheduler.

Use cases:
    - Send appointment reminders 24 hours before the appointment
    - Schedule medicine reminders at specific times
    - Batch process notifications at off-peak hours

The scheduler runs in-process alongside the FastAPI server.
"""

from datetime import datetime
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger

from app.logger import get_logger

logger = get_logger(__name__)

# Global scheduler instance
_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """
    Get or create the global scheduler instance.

    Returns:
        The AsyncIOScheduler instance.
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        logger.info("Scheduler initialized")
    return _scheduler


def start_scheduler() -> None:
    """Start the scheduler if not already running."""
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started")


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
    _scheduler = None


def schedule_notification(
    job_id: str,
    run_at: datetime,
    func: callable,
    **kwargs,
) -> str:
    """
    Schedule a notification for future delivery.

    Args:
        job_id: Unique identifier for this scheduled job.
        run_at: When to send the notification.
        func: The async function to call (typically the notification pipeline).
        **kwargs: Arguments to pass to the function.

    Returns:
        The job ID for tracking/cancellation.
    """
    scheduler = get_scheduler()

    scheduler.add_job(
        func,
        trigger=DateTrigger(run_date=run_at),
        id=job_id,
        kwargs=kwargs,
        replace_existing=True,
    )

    logger.info(f"Notification scheduled: job_id={job_id}, run_at={run_at}")
    return job_id
